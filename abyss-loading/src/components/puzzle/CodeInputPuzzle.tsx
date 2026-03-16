import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { CodeInputConfig } from '../../types/game.types';

interface CodeInputPuzzleProps {
  config: CodeInputConfig;
  attempts: number;
  maxAttempts?: number;
  onSubmit: (value: string) => void;
}

export const CodeInputPuzzle: React.FC<CodeInputPuzzleProps> = ({
  config,
  attempts,
  maxAttempts,
  onSubmit,
}) => {
  const [value, setValue] = useState('');
  const [shaking, setShaking] = useState(false);

  // 外部通知答案錯誤時觸發抖動
  useEffect(() => {
    if (attempts > 0) {
      setShaking(true);
      setValue('');
      setTimeout(() => setShaking(false), 600);
    }
  }, [attempts]);

  const remaining = maxAttempts ? maxAttempts - attempts : null;

  function handleSubmit() {
    if (value.length < config.input_length) return;
    onSubmit(value);
  }

  if (config.input_type === 'number') {
    // 數字鍵盤
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '←', '0', '✓'];

    const handleKey = (k: string) => {
      if (k === '←') {
        setValue((v) => v.slice(0, -1));
      } else if (k === '✓') {
        handleSubmit();
      } else if (value.length < config.input_length) {
        const next = value + k;
        setValue(next);
        if (next.length === config.input_length) {
          // 自動提交
          setTimeout(() => onSubmit(next), 150);
        }
      }
    };

    return (
      <div className="flex flex-col items-center gap-5">
        {config.display_hint && (
          <p className="text-gray-400 text-sm text-center">{config.display_hint}</p>
        )}

        {/* 顯示槽 */}
        <motion.div
          className="flex gap-3"
          animate={shaking ? { x: [-6, 6, -6, 6, -4, 4, 0] } : {}}
          transition={{ duration: 0.5 }}
        >
          {Array.from({ length: config.input_length }).map((_, i) => (
            <div
              key={i}
              className={`w-12 h-14 rounded-lg border-2 flex items-center justify-center text-2xl font-mono font-bold transition-all duration-200 ${
                i < value.length
                  ? 'border-indigo-400 bg-indigo-900/40 text-indigo-200'
                  : 'border-gray-700 bg-gray-900/30 text-transparent'
              }`}
            >
              {value[i] ?? '·'}
            </div>
          ))}
        </motion.div>

        {/* 剩餘次數 */}
        {remaining !== null && (
          <p className={`text-xs tracking-wider ${remaining <= 1 ? 'text-red-400' : 'text-gray-500'}`}>
            剩餘嘗試次數：{remaining}
          </p>
        )}

        {/* 數字鍵盤 */}
        <div className="grid grid-cols-3 gap-2">
          {keys.map((k) => (
            <motion.button
              key={k}
              onClick={() => handleKey(k)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              disabled={k !== '←' && k !== '✓' && value.length >= config.input_length}
              className={`w-14 h-12 rounded-lg font-semibold text-lg transition-all duration-150
                ${k === '✓'
                  ? 'bg-indigo-700 border border-indigo-500 text-indigo-100 hover:bg-indigo-600 disabled:opacity-40'
                  : k === '←'
                  ? 'bg-gray-800 border border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-900 border border-gray-700 text-gray-200 hover:border-indigo-600 hover:text-indigo-300 disabled:opacity-30'
                }`}
            >
              {k}
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  // 文字輸入
  return (
    <div className="flex flex-col items-center gap-4">
      {config.display_hint && (
        <p className="text-gray-400 text-sm text-center">{config.display_hint}</p>
      )}

      <motion.input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, config.input_length))}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder={`輸入密碼（${config.input_length} 字以內）`}
        animate={shaking ? { x: [-6, 6, -6, 6, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="w-64 px-4 py-3 rounded-lg bg-gray-900 border-2 border-gray-700 text-gray-200 text-center font-mono text-xl tracking-widest focus:outline-none focus:border-indigo-500 transition-colors"
      />

      {remaining !== null && (
        <p className={`text-xs tracking-wider ${remaining <= 1 ? 'text-red-400' : 'text-gray-500'}`}>
          剩餘嘗試次數：{remaining}
        </p>
      )}
    </div>
  );
};
