import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FortuneCard, FortuneRitualDef } from '../../types/game.types';

interface RitualProps {
  ritualDef: FortuneRitualDef;
  onComplete: (card: FortuneCard, isReversed?: boolean) => void;
}

interface CardState {
  card: FortuneCard;
  revealed: boolean;
  isReversed: boolean;
}

export const TarotRitual: React.FC<RitualProps> = ({ ritualDef, onComplete }) => {
  const { cards, player_choice, draw_count, confirm_label } = ritualDef;

  // 隨機抽取 draw_count 張
  const [cardStates] = useState<CardState[]>(() => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(draw_count, cards.length)).map((card) => ({
      card,
      revealed: false,
      isReversed: Math.random() < 0.5, // 50% 逆位
    }));
  });

  const [states, setStates] = useState(cardStates);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  function revealCard(idx: number) {
    if (states[idx].revealed) return;
    if (player_choice) {
      if (selectedIdx !== null) return; // 只能選一張
      setStates((prev) =>
        prev.map((s, i) => (i === idx ? { ...s, revealed: true } : s))
      );
      setSelectedIdx(idx);
    } else {
      // 自動逐張翻開
      setStates((prev) =>
        prev.map((s, i) => (i === idx ? { ...s, revealed: true } : s))
      );
    }
  }

  const selectedState = selectedIdx !== null ? states[selectedIdx] : null;

  function handleConfirm() {
    if (!selectedState || confirmed) return;
    setConfirmed(true);
    onComplete(selectedState.card, selectedState.isReversed);
  }

  // 扇形排列
  const total = states.length;
  const spreadAngle = Math.min(60, total * 12);

  return (
    <div className="flex flex-col items-center gap-8">
      {/* 卡牌扇形區 */}
      <div className="relative h-56 w-80 flex items-end justify-center">
        {states.map((cs, i) => {
          const angle = total > 1
            ? -spreadAngle / 2 + (i / (total - 1)) * spreadAngle
            : 0;
          const isSelected = selectedIdx === i;

          return (
            <motion.div
              key={i}
              className={`absolute cursor-pointer`}
              style={{
                bottom: 0,
                left: '50%',
                originX: '50%',
                originY: '100%',
                rotate: angle,
                translateX: '-50%',
                zIndex: isSelected ? 20 : i,
              }}
              whileHover={!cs.revealed && player_choice ? { y: -12, scale: 1.05 } : {}}
              animate={isSelected ? { y: -20 } : {}}
              onClick={() => revealCard(i)}
            >
              <motion.div
                className="w-20 h-36 rounded-lg relative"
                style={{ transformStyle: 'preserve-3d', perspective: 600 }}
                animate={{ rotateY: cs.revealed ? 180 : 0 }}
                transition={{ duration: 0.6 }}
              >
                {/* 牌背 */}
                <div
                  className={`absolute inset-0 rounded-lg border-2 flex items-center justify-center
                    ${isSelected ? 'border-purple-400' : 'border-purple-700/60'}
                    bg-gradient-to-br from-purple-950 to-indigo-950`}
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <span className="text-purple-500/40 text-3xl">✦</span>
                </div>

                {/* 牌面 */}
                <div
                  className={`absolute inset-0 rounded-lg border-2 flex flex-col items-center justify-center p-1 gap-1
                    ${cs.card.rarity === 'CURSED' ? 'border-red-700 bg-red-950/80' : 'border-yellow-600/70 bg-indigo-950/90'}`}
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: `rotateY(180deg) ${cs.isReversed ? 'rotate(180deg)' : ''}`,
                  }}
                >
                  <span className="text-2xl">{cs.card.icon_emoji}</span>
                  <span className={`text-xs text-center font-medium leading-tight ${
                    cs.card.rarity === 'CURSED' ? 'text-red-300' : 'text-yellow-200'
                  }`}>
                    {cs.isReversed && cs.card.reversed_name
                      ? cs.card.reversed_name
                      : cs.card.name}
                  </span>
                  {cs.isReversed && (
                    <span className="text-red-500/70 text-xs">逆位</span>
                  )}
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* 選定說明 */}
      <AnimatePresence>
        {selectedState && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`w-80 rounded-xl border-2 p-5 bg-purple-950/80 backdrop-blur ${
              selectedState.card.rarity === 'CURSED'
                ? 'border-red-700/80'
                : 'border-yellow-600/60'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{selectedState.card.icon_emoji}</span>
              <div>
                <h3 className={`font-bold ${
                  selectedState.card.rarity === 'CURSED' ? 'text-red-300' : 'text-yellow-200'
                }`}>
                  {selectedState.isReversed && selectedState.card.reversed_name
                    ? selectedState.card.reversed_name
                    : selectedState.card.name}
                </h3>
                {selectedState.isReversed && (
                  <span className="text-red-400 text-xs">逆位</span>
                )}
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed italic mb-4">
              {selectedState.isReversed && selectedState.card.reversed_description
                ? selectedState.card.reversed_description
                : selectedState.card.description}
            </p>

            <button
              onClick={handleConfirm}
              disabled={confirmed}
              className={`w-full py-2.5 rounded-lg font-semibold tracking-widest text-sm transition-all duration-300
                ${confirmed
                  ? 'bg-gray-800 text-gray-600 cursor-wait'
                  : 'bg-gradient-to-r from-purple-700 to-purple-600 text-purple-100 hover:from-purple-600 hover:to-purple-500 active:scale-95'
                }`}
            >
              {confirmed ? '命運已定…' : (confirm_label ?? '揭示')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {!selectedState && (
        <p className="text-purple-400/60 text-sm tracking-wider">
          {player_choice ? '點擊牌背選擇你的塔羅' : '牌面將逐一揭示'}
        </p>
      )}
    </div>
  );
};
