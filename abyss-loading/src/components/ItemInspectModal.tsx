import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/useGameStore';

export const ItemInspectModal: React.FC = () => {
  const inspectingItemId = useGameStore((s) => s.inspectingItemId);
  const itemRegistry     = useGameStore((s) => s.itemRegistry);
  const currentSceneId   = useGameStore((s) => s.currentSceneId);
  const closeInspect     = useGameStore((s) => s.closeInspect);
  const startUseItem     = useGameStore((s) => s.startUseItem);

  const item = inspectingItemId ? itemRegistry[inspectingItemId] : null;

  const canUse =
    item?.use_effect &&
    item.usable_in_scenes &&
    currentSceneId &&
    item.usable_in_scenes.includes(currentSceneId);

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="item-modal-bg"
          onClick={closeInspect}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="item-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="item-modal-close" onClick={closeInspect}>×</button>

            {/* Icon */}
            <motion.div
              className="item-modal-icon"
              animate={
                item.rarity === 'CURSED'
                  ? { opacity: [1, 0.5, 1] }
                  : item.rarity === 'LEGENDARY'
                  ? { scale: [1, 1.06, 1] }
                  : {}
              }
              transition={{ duration: 2, repeat: Infinity }}
            >
              {item.icon_emoji}
            </motion.div>

            {/* Name + rarity */}
            <div className="item-modal-name">{item.name}</div>
            <div className={`item-modal-rarity rarity-${item.rarity}`}>
              {item.rarity} · {item.item_type}
            </div>

            <div className="item-modal-divider" />

            {/* Lore */}
            <div className="item-modal-lore">
              {item.lore_text.split('\n').map((line, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  {line}
                </motion.p>
              ))}
            </div>

            {/* Passive */}
            {item.passive_effect && (
              <div className="item-modal-passive">{item.passive_effect}</div>
            )}

            {/* Cursed warning */}
            {item.is_cursed && (
              <div className="item-modal-cursed-warn">
                ⚠ 詛咒道具：每進入場景 karma −1
              </div>
            )}

            {/* Use button */}
            {item.use_effect && (
              <button
                className="item-modal-use-btn"
                disabled={!canUse}
                onClick={() => startUseItem(item.item_id)}
              >
                {canUse ? 'USE ITEM' : 'CANNOT USE HERE'}
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
