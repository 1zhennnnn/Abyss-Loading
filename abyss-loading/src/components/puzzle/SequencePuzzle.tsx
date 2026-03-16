import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { SequenceConfig } from '../../types/game.types';

interface SequenceItem {
  item_id: string;
  label: string;
  icon_emoji: string;
}

interface SequencePuzzleProps {
  config: SequenceConfig;
  onOrderChange: (order: string[]) => void;
}

export const SequencePuzzle: React.FC<SequencePuzzleProps> = ({
  config,
  onOrderChange,
}) => {
  const [items, setItems] = useState<SequenceItem[]>(() =>
    [...config.items].sort(() => Math.random() - 0.5)
  );
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  function moveUp(idx: number) {
    if (idx === 0) return;
    const next = [...items];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    setItems(next);
    onOrderChange(next.map((it) => it.item_id));
  }

  function moveDown(idx: number) {
    if (idx === items.length - 1) return;
    const next = [...items];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    setItems(next);
    onOrderChange(next.map((it) => it.item_id));
  }

  // 拖曳支援
  function handleDragStart(idx: number) {
    setDragIdx(idx);
  }

  function handleDragEnter(idx: number) {
    setDragOverIdx(idx);
  }

  function handleDrop(idx: number) {
    if (dragIdx === null || dragIdx === idx) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    const next = [...items];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(idx, 0, moved);
    setItems(next);
    onOrderChange(next.map((it) => it.item_id));
    setDragIdx(null);
    setDragOverIdx(null);
  }

  return (
    <div className="flex flex-col gap-3 w-72">
      {config.display_hint && (
        <p className="text-gray-400 text-sm text-center mb-1">{config.display_hint}</p>
      )}

      {items.map((item, idx) => (
        <motion.div
          key={item.item_id}
          layout
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.05 }}
          draggable
          onDragStart={() => handleDragStart(idx)}
          onDragEnter={() => handleDragEnter(idx)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(idx)}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 bg-gray-900/60 transition-all duration-150 cursor-grab active:cursor-grabbing select-none
            ${dragOverIdx === idx && dragIdx !== idx
              ? 'border-indigo-400 bg-indigo-900/30'
              : 'border-gray-700/60 hover:border-gray-600'
            }`}
        >
          {/* 序號 */}
          <span className="text-gray-600 text-sm font-mono w-5 text-center">
            {idx + 1}
          </span>

          {/* emoji + label */}
          <span className="text-2xl">{item.icon_emoji}</span>
          <span className="text-gray-200 font-medium flex-1">{item.label}</span>

          {/* 上移 / 下移按鈕（無障礙替代） */}
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => moveUp(idx)}
              disabled={idx === 0}
              className="w-6 h-5 flex items-center justify-center text-gray-500 hover:text-indigo-400 disabled:opacity-20 transition-colors text-xs"
            >
              ▲
            </button>
            <button
              onClick={() => moveDown(idx)}
              disabled={idx === items.length - 1}
              className="w-6 h-5 flex items-center justify-center text-gray-500 hover:text-indigo-400 disabled:opacity-20 transition-colors text-xs"
            >
              ▼
            </button>
          </div>
        </motion.div>
      ))}

      <p className="text-gray-600 text-xs text-center mt-1">
        拖曳或使用 ▲▼ 調整順序
      </p>
    </div>
  );
};
