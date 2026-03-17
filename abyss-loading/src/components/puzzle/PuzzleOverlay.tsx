import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../../store/useGameStore';
import { CodeInputPuzzle } from './CodeInputPuzzle';
import { SequencePuzzle } from './SequencePuzzle';
import { SymbolMatchPuzzle } from './SymbolMatchPuzzle';
import type {
  PuzzleNode,
  CodeInputConfig,
  SequenceConfig,
  SymbolMatchConfig,
} from '../../types/game.types';

export const PuzzleOverlay: React.FC = () => {
  const activePuzzle       = useGameStore((s) => s.activePuzzle);
  const puzzleRegistry     = useGameStore((s) => s.puzzleRegistry);
  const localTags          = useGameStore((s) => s.localTags);
  const localInventory     = useGameStore((s) => s.localInventory);
  const submitPuzzleAnswer = useGameStore((s) => s.submitPuzzleAnswer);
  const skipPuzzle         = useGameStore((s) => s.skipPuzzle);

  const [pendingAnswer, setPendingAnswer] = useState<unknown>(null);
  const [hintOpen, setHintOpen] = useState(false);

  if (!activePuzzle) return null;

  const puzzle: PuzzleNode | undefined = puzzleRegistry[activePuzzle.puzzle_id];
  if (!puzzle) return null;

  const hasHint =
    puzzle.hint_tag &&
    puzzle.hint_text &&
    localTags.includes(puzzle.hint_tag);

  // 道具提示：有 hint_item 且持有 → 進階提示；否則顯示基本提示
  const itemHintText = puzzle.hint_item && localInventory.includes(puzzle.hint_item)
    ? (puzzle.hint_text_with_item ?? null)
    : (puzzle.hint_text_without_item ?? null);

  const canSkip = !puzzle.is_gate;

  function handleSubmit() {
    if (pendingAnswer === null) return;
    submitPuzzleAnswer(pendingAnswer);
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="puzzle-overlay"
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          className="puzzle-card"
        >
          {/* Header */}
          <div className="puzzle-header">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div>
                {puzzle.is_gate && (
                  <div className="puzzle-gate-badge">MAIN GATE</div>
                )}
                <div className="puzzle-title">{puzzle.title}</div>
                <div className="puzzle-flavour">{puzzle.flavour_text}</div>
              </div>
              {!puzzle.is_gate && (
                <button
                  style={{
                    flexShrink: 0,
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: 14,
                    color: 'rgba(100,90,130,0.5)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'color 0.15s',
                  }}
                  onClick={skipPuzzle}
                >
                  ×
                </button>
              )}
            </div>

            {hasHint && (
              <div style={{ marginTop: 10 }}>
                <button className="puzzle-hint-btn" onClick={() => setHintOpen((o) => !o)}>
                  <span>💡</span>
                  <span>{hintOpen ? '收起提示' : '查看提示'}</span>
                </button>
                <AnimatePresence>
                  {hintOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className="puzzle-hint-text">{puzzle.hint_text}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="puzzle-body">
            <PuzzleContent
              puzzle={puzzle}
              attempts={activePuzzle.attempts}
              onAnswerChange={setPendingAnswer}
            />
          </div>

          {/* 道具提示區塊 */}
          {itemHintText && (
            <div style={{
              margin: '0 0 12px',
              padding: '8px 14px',
              background: puzzle.hint_item && localInventory.includes(puzzle.hint_item)
                ? 'rgba(200,170,60,.08)'
                : 'rgba(7,5,16,.6)',
              border: `1px solid ${
                puzzle.hint_item && localInventory.includes(puzzle.hint_item)
                  ? 'rgba(200,170,60,.25)'
                  : 'rgba(180,165,220,.1)'
              }`,
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 10,
              color: puzzle.hint_item && localInventory.includes(puzzle.hint_item)
                ? 'rgba(210,185,100,.75)'
                : 'rgba(160,148,195,.5)',
              letterSpacing: '.1em',
              lineHeight: 1.7,
            }}>
              {puzzle.hint_item && localInventory.includes(puzzle.hint_item) ? '💡 ' : '◌ '}
              {itemHintText}
            </div>
          )}

          {/* Footer */}
          <div className="puzzle-footer">
            {canSkip ? (
              <button className="puzzle-btn-skip" onClick={skipPuzzle}>
                略過謎題
              </button>
            ) : (
              <div />
            )}
            <button
              className="puzzle-btn-confirm"
              onClick={handleSubmit}
              disabled={pendingAnswer === null}
            >
              CONFIRM
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

interface PuzzleContentProps {
  puzzle: PuzzleNode;
  attempts: number;
  onAnswerChange: (answer: unknown) => void;
}

const PuzzleContent: React.FC<PuzzleContentProps> = ({ puzzle, attempts, onAnswerChange }) => {
  switch (puzzle.puzzle_type) {
    case 'CODE_INPUT':
      return (
        <CodeInputPuzzle
          config={puzzle.config as CodeInputConfig}
          attempts={attempts}
          maxAttempts={puzzle.max_attempts}
          onSubmit={(val) => onAnswerChange(val)}
        />
      );
    case 'SEQUENCE':
      return (
        <SequencePuzzle
          config={puzzle.config as SequenceConfig}
          onOrderChange={(order) => onAnswerChange(order)}
        />
      );
    case 'SYMBOL_MATCH':
      return (
        <SymbolMatchPuzzle
          config={puzzle.config as SymbolMatchConfig}
          onMatchChange={(matches) => onAnswerChange(matches)}
        />
      );
    default:
      return (
        <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: 'rgba(100,90,130,0.5)' }}>
          未知謎題類型
        </p>
      );
  }
};
