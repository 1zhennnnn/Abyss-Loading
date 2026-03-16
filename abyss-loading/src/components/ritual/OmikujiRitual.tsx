import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FortuneCard, FortuneRitualDef } from '../../types/game.types';

interface RitualProps {
  ritualDef: FortuneRitualDef;
  onComplete: (card: FortuneCard, isReversed?: boolean) => void;
}

export const OmikujiRitual: React.FC<RitualProps> = ({ ritualDef, onComplete }) => {
  // OMIKUJI 強制 player_choice = false，無論 JSON 設定如何
  const { cards, confirm_label } = ritualDef;

  const [shaking, setShaking] = useState(false);
  const [drawnCard, setDrawnCard] = useState<FortuneCard | null>(null);
  const [scrollOpen, setScrollOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleShake = useCallback(() => {
    if (shaking || drawnCard) return;
    setShaking(true);

    setTimeout(() => {
      const idx = Math.floor(Math.random() * cards.length);
      setDrawnCard(cards[idx]);
      setShaking(false);
      setTimeout(() => setScrollOpen(true), 600);
    }, 1800);
  }, [shaking, drawnCard, cards]);

  function handleConfirm() {
    if (!drawnCard || confirmed) return;
    setConfirmed(true);
    onComplete(drawnCard, false); // OMIKUJI 無逆位
  }

  return (
    <div className="flex flex-col items-center gap-8">
      {/* 籤筒 */}
      <motion.div
        className="relative flex flex-col items-center cursor-pointer"
        onClick={handleShake}
        animate={shaking ? {
          rotate: [-8, 8, -8, 8, -6, 6, -4, 4, 0],
        } : {}}
        transition={{ duration: 1.8, ease: 'easeInOut' }}
      >
        {/* 籤筒主體 */}
        <div className="w-20 h-32 rounded-t-full bg-gradient-to-b from-red-800 to-red-950 border-4 border-red-700 relative overflow-hidden shadow-lg shadow-red-900/50">
          {/* 籤條 */}
          {!drawnCard && (
            <div className="absolute inset-x-0 top-0 flex justify-center gap-1 pt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-amber-100/80 rounded"
                  style={{ height: 40 + i * 5 }}
                />
              ))}
            </div>
          )}
          {/* 底部裝飾 */}
          <div className="absolute bottom-0 inset-x-0 h-6 bg-red-900 border-t-2 border-red-700" />
          {/* 文字 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-amber-200 text-xs tracking-widest writing-vertical font-semibold opacity-70">
              御籤
            </span>
          </div>
        </div>
        {/* 底座 */}
        <div className="w-24 h-4 bg-red-900 rounded-b-sm border-2 border-red-700" />
      </motion.div>

      {/* 彈出籤條動畫 */}
      <AnimatePresence>
        {drawnCard && scrollOpen && (
          <motion.div
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`origin-top w-72 rounded-sm border-4 p-5 bg-amber-50 text-center shadow-xl
              ${drawnCard.rarity === 'CURSED'
                ? 'border-red-800'
                : drawnCard.rarity === 'RARE'
                ? 'border-red-600'
                : 'border-red-400'
              }`}
          >
            {/* 籤號 */}
            <div className={`text-xs mb-2 font-semibold tracking-widest ${
              drawnCard.rarity === 'CURSED' ? 'text-red-800' :
              drawnCard.rarity === 'RARE' ? 'text-red-600' : 'text-red-400'
            }`}>
              {drawnCard.rarity === 'CURSED' ? '凶' :
               drawnCard.rarity === 'RARE' ? '吉' : '中吉'}
            </div>
            <div className="text-3xl mb-2">{drawnCard.icon_emoji}</div>
            <h3 className="text-gray-800 font-bold text-lg mb-2 font-serif">
              {drawnCard.name}
            </h3>
            <div className="h-px bg-red-300 mb-3" />
            <p className="text-gray-600 text-sm leading-relaxed italic mb-4">
              {drawnCard.description}
            </p>

            <button
              onClick={handleConfirm}
              disabled={confirmed}
              className={`w-full py-2 rounded font-semibold tracking-widest transition-all text-sm border-2
                ${confirmed
                  ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-wait'
                  : 'border-red-600 bg-red-700 text-white hover:bg-red-600 active:scale-95'
                }`}
            >
              {confirmed ? '籤意已受…' : (confirm_label ?? '奉籤')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 提示 */}
      {!drawnCard && !shaking && (
        <p className="text-amber-800/60 text-sm tracking-wider">
          點擊籤筒搖籤
        </p>
      )}
      {shaking && (
        <p className="text-amber-700/70 text-sm tracking-wider animate-pulse">
          搖籤中……
        </p>
      )}
    </div>
  );
};
