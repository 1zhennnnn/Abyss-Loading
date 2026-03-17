import React from 'react';
import useGameStore from '../store/useGameStore';
import type { Option, PlayerStats } from '../types/game.types';

interface OptionButtonProps {
  option: Option;
  index: number;
  onClick: () => void;
}

const STAT_LABEL: Record<keyof PlayerStats, string> = {
  inspiration: '靈感',
  constitution: '體質',
  karma: '因果',
};

export const OptionButton: React.FC<OptionButtonProps> = ({ option, index, onClick }) => {
  const localTags      = useGameStore((s) => s.localTags);
  const localInventory = useGameStore((s) => s.localInventory);
  const stats          = useGameStore((s) => s.stats);
  const solvedPuzzles  = useGameStore((s) => s.solvedPuzzles);
  const itemRegistry   = useGameStore((s) => s.itemRegistry);

  // req_puzzle_solved → 完全隱藏（謎題解鎖是秘密條件）
  if (option.req_puzzle_solved && !solvedPuzzles.includes(option.req_puzzle_solved)) return null;

  // ── 命格強化判斷 ─────────────────────────────────────────────────────────
  // 有 req_tags = 命格強化版
  //   · 玩家持有所有 tags → 顯示金色強化版
  //   · 玩家缺少 tags    → 隱藏（通用版在旁邊覆蓋路徑）
  const isFortuneOption = (option.req_tags ?? []).length > 0;
  const hasFortuneBonus = isFortuneOption &&
    (option.req_tags ?? []).every((t) => localTags.includes(t));

  if (isFortuneOption && !hasFortuneBonus) return null;

  // ── 非命格鎖定條件（道具 / 數值門檻）────────────────────────────────────
  const missingItem = option.req_item && !localInventory.includes(option.req_item)
    ? option.req_item : null;

  let statHint = '';
  if (option.req_stat) {
    const { stat, min, max } = option.req_stat;
    const cur = stats[stat as keyof PlayerStats];
    if (min !== undefined && cur < min) {
      statHint = `需${STAT_LABEL[stat as keyof PlayerStats] ?? stat} ≥${min}（當前 ${cur}）`;
    } else if (max !== undefined && cur > max) {
      statHint = `需${STAT_LABEL[stat as keyof PlayerStats] ?? stat} ≤${max}（當前 ${cur}）`;
    }
  }

  const isLocked = !!missingItem || !!statHint;

  // ── 提示文字組合 ───────────────────────────────────────────────────────────
  const lockHints: string[] = [];
  if (missingItem) {
    const def = itemRegistry[missingItem];
    lockHints.push(`缺少道具：${def?.name ?? missingItem}`);
  }
  if (statHint) {
    lockHints.push(statHint);
  }

  const hasPuzzle   = Boolean(option.trigger_puzzle);
  const hasDialogue = Boolean(option.trigger_dialogue);
  const isDeath     = Boolean(option.is_death_trigger);

  const num = String(index + 1).padStart(2, '0') + '.';

  // 命格強化版外框樣式
  const fortuneStyle: React.CSSProperties = hasFortuneBonus
    ? {
        borderColor: 'rgba(200,170,60,0.45)',
        background: 'rgba(200,170,60,0.04)',
      }
    : {};

  // 死亡觸發外框（命格強化版優先顯示金色）
  const borderStyle: React.CSSProperties =
    hasFortuneBonus ? fortuneStyle
    : isDeath && !isLocked ? { borderColor: 'rgba(160,40,40,0.35)' }
    : {};

  return (
    <div
      className={`choice-item${isLocked ? ' disabled' : ''}`}
      onClick={isLocked ? undefined : onClick}
      style={borderStyle}
    >
      <span className="choice-num">{num}</span>
      <div className="choice-body">
        <div className="choice-label">
          {/* 命格強化版金色標籤 */}
          {hasFortuneBonus && (
            <span style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 9,
              color: 'rgba(210,185,100,0.9)',
              background: 'rgba(200,170,60,0.12)',
              border: '1px solid rgba(200,170,60,0.3)',
              borderRadius: 2,
              padding: '1px 5px',
              marginRight: 6,
              letterSpacing: '0.08em',
              flexShrink: 0,
            }}>
              ✦ 命格
            </span>
          )}
          <span>{option.label}</span>
          {hasPuzzle && !isLocked && (
            <span className="choice-badge cb-puzzle">LOCK</span>
          )}
          {hasDialogue && !hasPuzzle && !isLocked && (
            <span className="choice-badge cb-dialogue">TALK</span>
          )}
          {isDeath && !isLocked && (
            <span className="choice-badge cb-death">☠</span>
          )}
        </div>

        {/* flavor_text：未鎖定時顯示 */}
        {option.flavor_text && !isLocked && (
          <div className="choice-flavor">{option.flavor_text}</div>
        )}

        {/* 鎖定提示（道具 / 數值） */}
        {isLocked && lockHints.length > 0 && (
          <div className="req-fail">
            {lockHints.map((hint, i) => (
              <span key={i} style={{ display: 'block' }}>⚠ {hint}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
