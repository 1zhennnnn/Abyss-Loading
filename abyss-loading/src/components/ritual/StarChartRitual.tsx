import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FortuneCard, FortuneRitualDef } from '../../types/game.types';

interface RitualProps {
  ritualDef: FortuneRitualDef;
  onComplete: (card: FortuneCard, isReversed?: boolean) => void;
}

// 星點粒子
const GoldParticles: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {Array.from({ length: 40 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 rounded-full bg-yellow-300"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          opacity: Math.random() * 0.5 + 0.1,
        }}
        animate={{ opacity: [0.1, 0.8, 0.1], scale: [1, 1.5, 1] }}
        transition={{
          duration: Math.random() * 3 + 2,
          repeat: Infinity,
          delay: Math.random() * 2,
        }}
      />
    ))}
  </div>
);

export const StarChartRitual: React.FC<RitualProps> = ({ ritualDef, onComplete }) => {
  const { cards, player_choice, draw_count, confirm_label } = ritualDef;

  const [spinning, setSpinning] = useState(false);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [selectedCard, setSelectedCard] = useState<FortuneCard | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  // 展示前 draw_count 張牌
  const displayCards = cards.slice(0, Math.min(draw_count, cards.length));

  const handleSpin = useCallback(() => {
    if (spinning || selectedCard) return;
    setSpinning(true);

    const extraRotation = 360 * 5 + Math.random() * 360;
    const newDeg = rotationDeg + extraRotation;
    setRotationDeg(newDeg);

    setTimeout(() => {
      setSpinning(false);
      if (!player_choice) {
        // 自動選定
        const idx = Math.floor(Math.random() * displayCards.length);
        setSelectedCard(displayCards[idx]);
      }
    }, 2000);
  }, [spinning, selectedCard, rotationDeg, player_choice, displayCards]);

  function handleSelect(card: FortuneCard) {
    if (!player_choice || spinning || selectedCard) return;
    setSelectedCard(card);
  }

  function handleConfirm() {
    if (!selectedCard || confirmed) return;
    setConfirmed(true);
    onComplete(selectedCard, false);
  }

  // 計算每張牌在圓形星盤上的位置
  const radius = 160;
  const total = displayCards.length;

  return (
    <div className="relative flex flex-col items-center gap-8">
      <GoldParticles />

      {/* 星盤 */}
      <div className="relative w-80 h-80 flex items-center justify-center">
        {/* 背景圓 */}
        <motion.div
          className="absolute w-72 h-72 rounded-full border-2 border-yellow-600/30 bg-indigo-950/60"
          animate={{ rotate: rotationDeg }}
          transition={{ duration: 2, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* 同心裝飾圓 */}
          <div className="absolute inset-4 rounded-full border border-yellow-700/20" />
          <div className="absolute inset-8 rounded-full border border-yellow-700/10" />

          {/* 牌位 */}
          {displayCards.map((card, i) => {
            const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
            const x = Math.cos(angle) * radius * 0.55 + 50;
            const y = Math.sin(angle) * radius * 0.55 + 50;
            const isSelected = selectedCard?.fortune_id === card.fortune_id;

            return (
              <motion.button
                key={card.fortune_id}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 transition-all duration-300 cursor-pointer
                  ${isSelected
                    ? 'border-yellow-400 bg-yellow-900/60 ring-4 ring-yellow-400/40'
                    : card.rarity === 'CURSED'
                    ? 'border-red-700/60 bg-red-950/50 hover:border-red-500'
                    : 'border-indigo-500/50 bg-indigo-900/40 hover:border-yellow-500/70'
                  }`}
                style={{ left: `${x}%`, top: `${y}%` }}
                onClick={() => handleSelect(card)}
                whileHover={player_choice && !selectedCard ? { scale: 1.2 } : {}}
                animate={isSelected ? {
                  boxShadow: ['0 0 10px rgba(234,179,8,0.4)', '0 0 25px rgba(234,179,8,0.8)', '0 0 10px rgba(234,179,8,0.4)'],
                } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <span>{card.icon_emoji}</span>
              </motion.button>
            );
          })}
        </motion.div>

        {/* 中心按鈕 */}
        <motion.button
          className={`relative z-10 w-16 h-16 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-all duration-300
            ${spinning
              ? 'border-yellow-600 bg-yellow-950/60 text-yellow-400 cursor-wait'
              : selectedCard
              ? 'border-indigo-500/30 bg-indigo-950/30 text-indigo-600 cursor-default'
              : 'border-yellow-500/70 bg-yellow-950/40 text-yellow-300 hover:bg-yellow-900/50 cursor-pointer'
            }`}
          onClick={handleSpin}
          whileHover={!spinning && !selectedCard ? { scale: 1.1 } : {}}
        >
          {spinning ? '…' : selectedCard ? '✦' : '起卦'}
        </motion.button>
      </div>

      {/* 選定卡片展示 */}
      <AnimatePresence>
        {selectedCard && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className={`w-80 rounded-xl border-2 p-5 bg-indigo-950/80 backdrop-blur
              ${selectedCard.rarity === 'CURSED'
                ? 'border-red-700/70'
                : selectedCard.rarity === 'RARE'
                ? 'border-indigo-400/70'
                : 'border-yellow-600/50'
              }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <motion.span
                className="text-3xl"
                animate={selectedCard.rarity === 'CURSED'
                  ? { opacity: [1, 0.5, 1] }
                  : { scale: [1, 1.1, 1] }
                }
                transition={{ duration: 2, repeat: Infinity }}
              >
                {selectedCard.icon_emoji}
              </motion.span>
              <div>
                <h3 className={`font-bold text-lg ${
                  selectedCard.rarity === 'CURSED' ? 'text-red-300' :
                  selectedCard.rarity === 'RARE' ? 'text-indigo-200' : 'text-gray-200'
                }`}>
                  {selectedCard.name}
                </h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  selectedCard.rarity === 'CURSED' ? 'bg-red-900/60 text-red-400' :
                  selectedCard.rarity === 'RARE' ? 'bg-indigo-900/60 text-indigo-300' :
                  'bg-gray-800 text-gray-400'
                }`}>
                  {selectedCard.rarity}
                </span>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed italic mb-4">
              {selectedCard.description}
            </p>

            <button
              onClick={handleConfirm}
              disabled={confirmed}
              className={`w-full py-2.5 rounded-lg font-semibold tracking-widest transition-all duration-300 text-sm
                ${confirmed
                  ? 'bg-gray-800 text-gray-600 cursor-wait'
                  : 'bg-gradient-to-r from-indigo-700 to-indigo-600 text-indigo-100 hover:from-indigo-600 hover:to-indigo-500 active:scale-95'
                }`}
            >
              {confirmed ? '命運已定…' : (confirm_label ?? '承受命運')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 提示文字 */}
      {!selectedCard && !spinning && (
        <p className="text-indigo-500/60 text-sm tracking-wider">
          {player_choice ? '點擊「起卦」後，選擇你的命盤' : '點擊「起卦」，由命運決定'}
        </p>
      )}
    </div>
  );
};
