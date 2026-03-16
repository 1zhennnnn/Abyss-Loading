import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FortuneCard, FortuneRitualDef } from '../../types/game.types';

interface RitualProps {
  ritualDef: FortuneRitualDef;
  onComplete: (card: FortuneCard, isReversed?: boolean) => void;
}

type YaoType = 'yin' | 'yang'; // 陰爻 / 陽爻

function getYaoSymbol(yao: YaoType): string {
  return yao === 'yang' ? '⚊' : '⚋';
}

// 將六爻 hash 映射到卡池（用 index 取餘數）
function hashYaos(yaos: YaoType[]): number {
  return yaos.reduce((acc, y, i) => acc + (y === 'yang' ? 1 : 0) * Math.pow(2, i), 0);
}

export const CoinDivinationRitual: React.FC<RitualProps> = ({ ritualDef, onComplete }) => {
  // COIN_DIVINATION 強制 player_choice = false，無論 JSON 設定如何
  const { cards, confirm_label } = ritualDef;

  const [throwing, setThrowing] = useState(false);
  const [yaos, setYaos] = useState<YaoType[]>([]);
  const [result, setResult] = useState<FortuneCard | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleThrow = useCallback(() => {
    if (throwing || yaos.length >= 6) return;
    setThrowing(true);

    setTimeout(() => {
      const newYao: YaoType = Math.random() > 0.5 ? 'yang' : 'yin';
      setYaos((prev) => {
        const next = [...prev, newYao];
        if (next.length === 6) {
          const hash = hashYaos(next);
          const idx = hash % cards.length;
          setResult(cards[idx]);
        }
        return next;
      });
      setThrowing(false);
    }, 1200);
  }, [throwing, yaos, cards]);

  function handleConfirm() {
    if (!result || confirmed) return;
    setConfirmed(true);
    onComplete(result, false); // 銅錢卦無逆位
  }

  const coinsArr = [0, 1, 2]; // 三枚銅錢

  return (
    <div className="flex flex-col items-center gap-6">
      {/* 銅錢 */}
      <div className="flex gap-6">
        {coinsArr.map((idx) => (
          <motion.div
            key={idx}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-600 to-yellow-800 border-2 border-yellow-500/50 flex items-center justify-center text-yellow-200 font-bold text-xl shadow-lg shadow-yellow-900/30"
            animate={throwing ? {
              rotateY: [0, 360, 720, 1080],
              y: [0, -20, 0, -15, 0],
            } : {}}
            transition={{ duration: 1.0, delay: idx * 0.1 }}
          >
            卦
          </motion.div>
        ))}
      </div>

      {/* 擲卦按鈕 */}
      {yaos.length < 6 && (
        <motion.button
          onClick={handleThrow}
          disabled={throwing}
          whileHover={!throwing ? { scale: 1.05 } : {}}
          className={`px-8 py-2.5 rounded border-2 font-semibold tracking-widest text-sm transition-all ${
            throwing
              ? 'border-yellow-800/50 bg-yellow-950/30 text-yellow-700 cursor-wait'
              : 'border-yellow-600/70 bg-yellow-950/50 text-yellow-300 hover:border-yellow-500 hover:bg-yellow-900/40'
          }`}
        >
          {throwing ? '擲中…' : `第 ${yaos.length + 1} 爻（共 6 爻）`}
        </motion.button>
      )}

      {/* 爻象顯示 */}
      {yaos.length > 0 && (
        <div className="flex flex-col-reverse items-center gap-1 min-h-32">
          {yaos.map((yao, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <span className="text-yellow-700/60 text-xs w-6 text-right">{i + 1}</span>
              <span className={`text-2xl font-bold ${
                yao === 'yang' ? 'text-yellow-400' : 'text-gray-400'
              }`}>
                {getYaoSymbol(yao)}
              </span>
              <span className={`text-xs ${
                yao === 'yang' ? 'text-yellow-600' : 'text-gray-600'
              }`}>
                {yao === 'yang' ? '陽' : '陰'}
              </span>
            </motion.div>
          ))}
        </div>
      )}

      {/* 結果卦象 */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`w-80 rounded border-2 p-5 bg-amber-50/5 backdrop-blur ${
              result.rarity === 'CURSED' ? 'border-red-700/60' :
              result.rarity === 'RARE' ? 'border-yellow-500/60' : 'border-yellow-700/40'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{result.icon_emoji}</span>
              <div>
                <h3 className={`font-bold text-lg ${
                  result.rarity === 'CURSED' ? 'text-red-300' : 'text-yellow-200'
                }`}>
                  {result.name}
                </h3>
                <span className="text-yellow-700/60 text-xs">卦象顯示</span>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed italic mb-4">
              {result.description}
            </p>

            <button
              onClick={handleConfirm}
              disabled={confirmed}
              className={`w-full py-2.5 rounded font-semibold tracking-widest text-sm border-2 transition-all ${
                confirmed
                  ? 'border-gray-700 bg-gray-900/30 text-gray-600 cursor-wait'
                  : 'border-yellow-600 bg-yellow-950/60 text-yellow-300 hover:bg-yellow-900/40 active:scale-95'
              }`}
            >
              {confirmed ? '卦象已定…' : (confirm_label ?? '受卦')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {yaos.length === 0 && (
        <p className="text-yellow-800/60 text-sm tracking-wider">
          點擊按鈕，逐爻起卦
        </p>
      )}
    </div>
  );
};
