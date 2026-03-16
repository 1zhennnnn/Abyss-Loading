import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import useGameStore from '../store/useGameStore';
import type { PlayerStats } from '../types/game.types';

const STAT_LABELS: Record<keyof PlayerStats, string> = {
  inspiration: 'INSP',
  constitution: 'CONS',
  karma: 'KARMA',
};

// tag → chip color class (cycles through teal/purple/amber)
function tagChipClass(tag: string): string {
  const classes = ['teal', 'purple', 'amber'];
  return classes[(tag.charCodeAt(0) ?? 0) % classes.length];
}

// 數值條
const StatRow: React.FC<{ stat: keyof PlayerStats; value: number }> = ({ stat, value }) => {
  const [flash, setFlash] = useState(false);
  const prevRef = useRef(value);

  useEffect(() => {
    if (prevRef.current !== value) {
      setFlash(true);
      prevRef.current = value;
      setTimeout(() => setFlash(false), 600);
    }
  }, [value]);

  const displayValue = stat === 'karma' ? value : Math.max(0, Math.min(100, value));
  const pct = stat === 'karma'
    ? Math.min(100, Math.max(0, ((value + 100) / 200) * 100))
    : displayValue;

  return (
    <div className="stat-row">
      <div className="stat-header">
        <span className="stat-label">{STAT_LABELS[stat]}</span>
        <span className={`stat-value${flash ? ' flash' : ''}`}>{displayValue}</span>
      </div>
      <div className="stat-bar-bg">
        <motion.div
          className={`stat-bar-fill ${stat}`}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </div>
  );
};

interface PlayerPanelProps {
  open: boolean;
  onClose: () => void;
}

export const PlayerPanel: React.FC<PlayerPanelProps> = ({ open, onClose }) => {
  const stats          = useGameStore((s) => s.stats);
  const localTags      = useGameStore((s) => s.localTags);
  const localInventory = useGameStore((s) => s.localInventory);
  const globalInventory = useGameStore((s) => s.globalInventory);
  const itemRegistry   = useGameStore((s) => s.itemRegistry);
  const instanceFortune = useGameStore((s) => s.instanceFortune);
  const usingItemId    = useGameStore((s) => s.usingItemId);
  const inspectItem    = useGameStore((s) => s.inspectItem);
  const confirmUseItem = useGameStore((s) => s.confirmUseItem);
  const cancelUseItem  = useGameStore((s) => s.cancelUseItem);

  const localItems  = localInventory.map((id) => itemRegistry[id]).filter(Boolean);
  const globalItems = globalInventory.map((id) => itemRegistry[id]).filter(Boolean);

  return (
    <div className={`side-panel${open ? ' open' : ''}`}>
      {/* 關閉按鈕 */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 8,
          right: 12,
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 14,
          color: 'rgba(100,90,130,0.5)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          transition: 'color 0.15s',
          zIndex: 1,
        }}
      >
        ×
      </button>

      {/* 使用道具模式提示 */}
      {usingItemId && (
        <div style={{
          background: 'rgba(40,25,70,0.5)',
          border: '1px solid rgba(80,55,120,0.3)',
          padding: '6px 10px',
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 9,
          color: 'rgba(130,100,190,0.75)',
          letterSpacing: '0.08em',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span>SELECT SCENE TO USE</span>
          <button
            onClick={cancelUseItem}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 9, color: 'rgba(180,80,80,0.7)',
            }}
          >
            CANCEL
          </button>
        </div>
      )}

      {/* 命格 */}
      <div>
        <div className="panel-sec-title">FORTUNE</div>
        {instanceFortune ? (
          <div className="fortune-mini">
            <div className="fortune-mini-header">
              <span style={{ fontSize: 20 }}>{instanceFortune.icon_emoji}</span>
              <div>
                <div className="fortune-mini-name">{instanceFortune.name}</div>
                <div className="fortune-mini-meta">{instanceFortune.rarity}</div>
              </div>
            </div>
            <div className="fortune-mini-desc">{instanceFortune.description}</div>
          </div>
        ) : (
          <div style={{
            fontFamily: "'Crimson Pro', serif",
            fontStyle: 'italic',
            fontSize: 12,
            color: 'rgba(80,70,90,0.5)',
          }}>
            尚未起卦
          </div>
        )}
      </div>

      {/* 數值 */}
      <div>
        <div className="panel-sec-title">STATUS</div>
        <div className="stat-block">
          {(Object.keys(STAT_LABELS) as (keyof PlayerStats)[]).map((stat) => (
            <StatRow key={stat} stat={stat} value={stats[stat]} />
          ))}
        </div>
      </div>

      {/* 標籤 */}
      {localTags.length > 0 && (
        <div>
          <div className="panel-sec-title">TAGS</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {localTags.map((tag) => (
              <span key={tag} className={`tag-chip ${tagChipClass(tag)}`}>{tag}</span>
            ))}
          </div>
        </div>
      )}

      {/* 本地背包 */}
      <div>
        <div className="panel-sec-title">INVENTORY</div>
        {localItems.length === 0 ? (
          <div style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 9,
            color: 'rgba(60,55,80,0.5)',
          }}>
            EMPTY
          </div>
        ) : (
          <div className="inv-section">
            {localItems.map((item) => (
              <div
                key={item.item_id}
                className={`inv-item${usingItemId === item.item_id ? ' using' : ''}${item.is_cursed ? ' cursed' : ''}`}
                onClick={usingItemId === item.item_id ? confirmUseItem : () => inspectItem(item.item_id)}
              >
                <div className={`inv-item-bar ${item.rarity}`} />
                <span style={{ fontSize: 13, flexShrink: 0 }}>{item.icon_emoji}</span>
                <span className="inv-item-name">{item.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 全域背包 */}
      {globalItems.length > 0 && (
        <div>
          <div className="panel-sec-title">PERMANENT</div>
          <div className="inv-section">
            {globalItems.map((item) => (
              <div
                key={item.item_id}
                className={`inv-item${usingItemId === item.item_id ? ' using' : ''}${item.is_cursed ? ' cursed' : ''}`}
                onClick={usingItemId === item.item_id ? confirmUseItem : () => inspectItem(item.item_id)}
              >
                <div className={`inv-item-bar ${item.rarity}`} />
                <span style={{ fontSize: 13, flexShrink: 0 }}>{item.icon_emoji}</span>
                <span className="inv-item-name">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
