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
