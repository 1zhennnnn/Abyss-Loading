import React from 'react';
import useGameStore from '../store/useGameStore';
import type { Option, PlayerStats } from '../types/game.types';

interface OptionButtonProps {
  option: Option;
  index: number;
  onClick: () => void;
}

export const OptionButton: React.FC<OptionButtonProps> = ({ option, index, onClick }) => {
  const localTags     = useGameStore((s) => s.localTags);
  const localInventory = useGameStore((s) => s.localInventory);
  const stats         = useGameStore((s) => s.stats);
  const solvedPuzzles = useGameStore((s) => s.solvedPuzzles);

  // ── 完全隱藏條件 ──────────────────────────────────
  if (option.req_tags?.length) {
    const missing = option.req_tags.filter((t) => !localTags.includes(t));
    if (missing.length > 0) return null;
  }
  if (option.req_item && !localInventory.includes(option.req_item)) return null;
  if (option.req_puzzle_solved && !solvedPuzzles.includes(option.req_puzzle_solved)) return null;

  // ── 可見但 disabled（req_stat 不符）────────────
  let statDisabled = false;
  let statHintText = '';
  if (option.req_stat) {
    const { stat, min, max } = option.req_stat;
    const current = stats[stat];
    const statLabel: Record<keyof PlayerStats, string> = {
      inspiration: '靈感',
      constitution: '體質',
      karma: '因果',
    };
    if (min !== undefined && current < min) {
      statDisabled = true;
      statHintText = `需${statLabel[stat]} ≥${min}（當前 ${current}）`;
    } else if (max !== undefined && current > max) {
      statDisabled = true;
      statHintText = `需${statLabel[stat]} ≤${max}（當前 ${current}）`;
    }
  }

  const hasPuzzle   = Boolean(option.trigger_puzzle);
  const hasDialogue = Boolean(option.trigger_dialogue);
  const isDeath     = Boolean(option.is_death_trigger);

  const num = String(index + 1).padStart(2, '0') + '.';

  return (
    <div
      className={`choice-item${statDisabled ? ' disabled' : ''}`}
      onClick={statDisabled ? undefined : onClick}
      style={isDeath && !statDisabled
        ? { borderColor: 'rgba(160,40,40,0.35)' }
        : undefined
      }
    >
      <span className="choice-num">{num}</span>
      <div className="choice-body">
        <div className="choice-label">
          <span>{option.label}</span>
          {hasPuzzle && !statDisabled && (
            <span className="choice-badge cb-puzzle">LOCK</span>
          )}
          {hasDialogue && !hasPuzzle && !statDisabled && (
            <span className="choice-badge cb-dialogue">TALK</span>
          )}
          {isDeath && !statDisabled && (
            <span className="choice-badge cb-death">☠</span>
          )}
        </div>
        {option.flavor_text && !statDisabled && (
          <div className="choice-flavor">{option.flavor_text}</div>
        )}
        {statDisabled && statHintText && (
          <div className="req-fail">{statHintText}</div>
        )}
      </div>
    </div>
  );
};
