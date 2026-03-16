import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { SymbolMatchConfig } from '../../types/game.types';

type MatchMap = Record<string, string>; // pair_id → selected symbol_b label

interface SymbolMatchPuzzleProps {
  config: SymbolMatchConfig;
  onMatchChange: (matches: Record<string, [string, string]>) => void;
}

export const SymbolMatchPuzzle: React.FC<SymbolMatchPuzzleProps> = ({
  config,
  onMatchChange,
}) => {
  const [selections, setSelections] = useState<MatchMap>({});
  const [errorPairs, setErrorPairs] = useState<Set<string>>(new Set());

  function handleSelect(pairId: string, symbolBLabel: string) {
    const next = { ...selections, [pairId]: symbolBLabel };
    setSelections(next);

    // 轉換成 onMatchChange 需要的格式
    const pair = config.pairs.find((p) => p.pair_id === pairId);
    if (!pair) return;

    const result: Record<string, [string, string]> = {};
    for (const p of config.pairs) {
      if (next[p.pair_id]) {
        result[p.pair_id] = [p.symbol_a.label, next[p.pair_id]];
      }
    }
    onMatchChange(result);
  }

  const allSelected = config.pairs.every((p) => Boolean(selections[p.pair_id]));

  return (
    <div className="flex flex-col gap-5 w-full max-w-sm">
      {/* 線索文字 */}
      <div className="px-4 py-3 rounded-lg border border-indigo-900/60 bg-indigo-950/30">
        <p className="text-indigo-300/80 text-sm leading-relaxed italic">
          {config.clue_text}
        </p>
      </div>

      {config.display_hint && (
        <p className="text-gray-400 text-sm text-center">{config.display_hint}</p>
      )}

      {/* 配對區：左側 symbol_a，右側 symbol_b 下拉選擇 */}
      <div className="flex flex-col gap-3">
        {config.pairs.map((pair) => {
          const selected = selections[pair.pair_id];
          const isError = errorPairs.has(pair.pair_id);

          return (
            <motion.div
              key={pair.pair_id}
              animate={isError ? { x: [-5, 5, -5, 5, 0] } : {}}
              transition={{ duration: 0.4 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all duration-200 bg-gray-900/50
                ${isError
                  ? 'border-red-600/70 bg-red-950/20'
                  : selected
                  ? 'border-indigo-500/60 bg-indigo-950/20'
                  : 'border-gray-700/50'
                }`}
            >
              {/* 左側符號 A */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xl">{pair.symbol_a.icon_emoji}</span>
                <span className="text-gray-200 font-medium text-sm truncate">
                  {pair.symbol_a.label}
                </span>
              </div>

              {/* 連接線 */}
              <div className={`w-8 h-px flex-shrink-0 transition-colors ${
                selected
                  ? isError ? 'bg-red-500' : 'bg-indigo-400'
                  : 'bg-gray-700'
              }`} />

              {/* 右側 symbol_b 下拉 */}
              <div className="flex-1 min-w-0">
                <select
                  value={selected ?? ''}
                  onChange={(e) => {
                    setErrorPairs((prev) => {
                      const next = new Set(prev);
                      next.delete(pair.pair_id);
                      return next;
                    });
                    handleSelect(pair.pair_id, e.target.value);
                  }}
                  className={`w-full px-2 py-1.5 rounded bg-gray-800 border text-sm font-medium focus:outline-none focus:ring-1 transition-all
                    ${isError
                      ? 'border-red-600 text-red-300 focus:ring-red-500'
                      : selected
                      ? 'border-indigo-500/60 text-indigo-200 focus:ring-indigo-500'
                      : 'border-gray-600 text-gray-400 focus:ring-indigo-500'
                    }`}
                >
                  <option value="">— 選擇配對 —</option>
                  {config.pairs.map((p) => (
                    <option key={p.pair_id} value={p.symbol_b.label}>
                      {p.symbol_b.icon_emoji} {p.symbol_b.label}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>
          );
        })}
      </div>

      {!allSelected && (
        <p className="text-gray-600 text-xs text-center">
          請完成所有配對後才能確認
        </p>
      )}
    </div>
  );
};
