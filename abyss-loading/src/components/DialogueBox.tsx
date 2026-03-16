import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/useGameStore';
import type { DialogueLine } from '../types/game.types';

const TYPING_SPEED_MS = 38;

export const DialogueBox: React.FC = () => {
  const dialogueQueue      = useGameStore((s) => s.dialogueQueue);
  const activeDialogueId   = useGameStore((s) => s.activeDialogueId);
  const dialogueTotalLines = useGameStore((s) => s.dialogueTotalLines);
  const dialogueRegistry   = useGameStore((s) => s.dialogueRegistry);
  const advanceDialogue    = useGameStore((s) => s.advanceDialogue);
  const currentSceneId     = useGameStore((s) => s.currentSceneId);
  const sceneRegistry      = useGameStore((s) => s.sceneRegistry);

  const [displayed, setDisplayed] = useState('');
  const [fullyShown, setFullyShown] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentLine: DialogueLine | undefined = dialogueQueue[0];

  // atmosphere class for dialogue box
  const atm = currentSceneId ? (sceneRegistry[currentSceneId]?.atmosphere ?? 'NORMAL') : 'NORMAL';
  const atmoClass = atm !== 'NORMAL' ? ` atmo-${atm.toLowerCase()}` : '';

  // 打字機效果
  useEffect(() => {
    if (!currentLine) return;

    setDisplayed('');
    setFullyShown(false);

    const text = currentLine.text;
    const pauseMs = currentLine.pause_after_ms ?? 0;
    let idx = 0;

    const tick = () => {
      idx++;
      setDisplayed(text.slice(0, idx));
      if (idx < text.length) {
        timerRef.current = setTimeout(tick, TYPING_SPEED_MS);
      } else {
        setFullyShown(true);
        if (pauseMs > 0) {
          autoRef.current = setTimeout(() => advanceDialogue(), pauseMs);
        }
      }
    };

    timerRef.current = setTimeout(tick, TYPING_SPEED_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (autoRef.current)  clearTimeout(autoRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLine?.line_id]);

  const handleClick = useCallback(() => {
    if (!currentLine) return;
    if (!fullyShown) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setDisplayed(currentLine.text);
      setFullyShown(true);
    } else {
      advanceDialogue();
    }
  }, [currentLine, fullyShown, advanceDialogue]);

  // Space 鍵推進
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Space') {
        e.preventDefault();
        handleClick();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleClick]);

  if (!activeDialogueId || !currentLine) return null;

  const seq          = dialogueRegistry[activeDialogueId ?? ''];
  const totalLines   = dialogueTotalLines || seq?.lines.length || dialogueQueue.length;
  const currentIndex = totalLines - dialogueQueue.length + 1;

  const isSystem   = currentLine.speaker === 'system';
  const isNarrator = currentLine.speaker === 'narrator';
  const speakerKey = currentLine.speaker;
  const tone       = currentLine.voice_tone ?? 'CALM';

  // text class
  const textClass = isNarrator
    ? 'dialogue-text narrator-style'
    : isSystem
    ? 'dialogue-text system-style'
    : 'dialogue-text';

  return (
    <AnimatePresence>
      <motion.div
        key="dialogue-box"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        className={`dialogue-box${atmoClass}`}
        onClick={handleClick}
      >
        {/* 角色名稱行 */}
        {!isNarrator && (
          <div className="speaker-row">
            <span className={`speaker-name sn-${speakerKey}`}>
              {isSystem ? 'SYSTEM' : (currentLine.speaker_name ?? '???')}
            </span>
            {!isSystem && (
              <span className={`speaker-tone ${tone}`}>{tone}</span>
            )}
          </div>
        )}

        {/* 對話文字 */}
        <p className={textClass}>
          {displayed}
          {!fullyShown && <span className="typing-cursor" />}
        </p>

        {/* Footer */}
        <div className="dialogue-footer">
          <span className="dialogue-progress">
            {currentIndex} / {totalLines}
          </span>
          {fullyShown && !currentLine.pause_after_ms && (
            <span className="dialogue-continue">▶ SPACE</span>
          )}
          {currentLine.pause_after_ms && currentLine.pause_after_ms > 0 && (
            <span className="dialogue-progress">自動推進中…</span>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
