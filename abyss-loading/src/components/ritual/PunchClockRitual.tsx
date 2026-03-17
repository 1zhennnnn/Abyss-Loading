// src/components/ritual/PunchClockRitual.tsx
// 電子打卡機命格儀式 — 辦公室副本專屬

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FortuneCard, FortuneRitualDef } from '../../types/game.types';

interface RitualProps {
  ritualDef: FortuneRitualDef;
  onComplete: (card: FortuneCard, isReversed?: boolean) => void;
}

type Phase = 'idle' | 'scanning' | 'result';

const SCAN_MSGS = [
  'READY',
  'SCANNING...',
  'ID: --------',
  'PROCESSING',
  'IDENTIFYING',
  'RESULT:',
];

export const PunchClockRitual: React.FC<RitualProps> = ({ ritualDef, onComplete }) => {
  const { cards, confirm_label } = ritualDef;
  const [phase, setPhase] = useState<Phase>('idle');
  const [displayMsg, setDisplayMsg] = useState('READY');
  const [result, setResult] = useState<FortuneCard | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [flickering, setFlickering] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // cleanup on unmount
  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  const schedule = (fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
  };

  const handleFingerprint = useCallback(() => {
    if (phase !== 'idle') return;
    setPhase('scanning');
    setFlickering(true);

    const msgTimings: [string, number][] = [
      ['SCANNING...', 0],
      ['ID: --------', 700],
      ['PROCESSING', 1400],
      ['IDENTIFYING', 2000],
      ['RESULT:', 2700],
    ];

    msgTimings.forEach(([msg, delay]) => {
      schedule(() => setDisplayMsg(msg), delay);
    });

    schedule(() => {
      setFlickering(false);
      const idx = Math.floor(Math.random() * cards.length);
      setResult(cards[idx]);
      setPhase('result');
    }, 3100);
  }, [phase, cards]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleConfirm() {
    if (!result || confirmed) return;
    setConfirmed(true);
    onComplete(result, false); // 打卡機無逆位
  }

  const ticketBorderColor = (rarity: string) => {
    if (rarity === 'CURSED') return 'rgba(180,40,40,.5)';
    if (rarity === 'RARE')   return 'rgba(180,140,40,.45)';
    return 'rgba(140,130,110,.35)';
  };

  const nameColor = (rarity: string) => {
    if (rarity === 'CURSED') return '#991b1b';
    if (rarity === 'RARE')   return '#92400e';
    return '#3c3530';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>

      {/* ── Clock Body ── */}
      <motion.div
        style={{
          width: 230,
          background: 'linear-gradient(175deg, #2c2a22 0%, #1e1c16 100%)',
          border: '2px solid rgba(160,140,80,.2)',
          borderRadius: 8,
          padding: '14px 18px 18px',
          boxShadow: '0 0 40px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,240,180,.05)',
          position: 'relative',
        }}
        animate={flickering ? { opacity: [1, 0.88, 1, 0.92, 1] } : {}}
        transition={{ repeat: flickering ? Infinity : 0, duration: 0.22 }}
      >
        {/* Brand */}
        <div style={{
          fontFamily: 'monospace',
          fontSize: 7,
          letterSpacing: '.28em',
          color: 'rgba(160,140,80,.22)',
          textAlign: 'center',
          marginBottom: 8,
          textTransform: 'uppercase',
        }}>
          ABYSS CORP · TIME RECORDER
        </div>

        {/* Sticker — yellowed age mark */}
        <div style={{
          position: 'absolute',
          top: 10,
          right: 12,
          fontFamily: 'monospace',
          fontSize: 7,
          color: 'rgba(140,120,60,.28)',
          letterSpacing: '.04em',
          transform: 'rotate(4deg)',
        }}>
          ∞ 次輪迴使用
        </div>

        {/* LCD display */}
        <motion.div
          style={{
            background: '#060f06',
            border: '1px solid rgba(60,100,60,.3)',
            borderRadius: 4,
            padding: '7px 10px',
            fontFamily: 'monospace',
            fontSize: 12,
            letterSpacing: '.14em',
            color: '#4ade80',
            textAlign: 'center',
            marginBottom: 12,
            minHeight: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textShadow: '0 0 10px rgba(74,222,128,.35)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,.4)',
          }}
          animate={phase === 'scanning' ? { opacity: [1, 0.55, 1, 0.7, 1] } : {}}
          transition={{ repeat: phase === 'scanning' ? Infinity : 0, duration: 0.38 }}
        >
          {displayMsg}
        </motion.div>

        {/* Fingerprint pad */}
        <motion.button
          onClick={handleFingerprint}
          disabled={phase !== 'idle'}
          style={{
            width: '100%',
            height: 76,
            background: phase === 'idle'
              ? 'linear-gradient(145deg, rgba(100,85,45,.18) 0%, rgba(60,50,25,.12) 100%)'
              : 'rgba(30,28,18,.5)',
            border: phase === 'idle'
              ? '1px solid rgba(160,140,80,.22)'
              : '1px solid rgba(80,70,40,.12)',
            borderRadius: 5,
            cursor: phase === 'idle' ? 'pointer' : 'default',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            position: 'relative',
            overflow: 'hidden',
          }}
          whileHover={phase === 'idle' ? { scale: 1.02, borderColor: 'rgba(180,160,100,.35)' } : {}}
          whileTap={phase === 'idle' ? { scale: 0.96 } : {}}
        >
          <motion.div
            style={{ fontSize: 30, lineHeight: 1 }}
            animate={
              phase === 'scanning'
                ? { scale: [1, 1.2, 1, 1.15, 1], filter: ['brightness(1)', 'brightness(2.2)', 'brightness(1)', 'brightness(1.8)', 'brightness(1)'] }
                : phase === 'idle'
                ? { opacity: [0.6, 1, 0.6] }
                : { opacity: 0.3 }
            }
            transition={
              phase === 'idle'
                ? { repeat: Infinity, duration: 3.5, ease: 'easeInOut' }
                : { duration: 2.6 }
            }
          >
            👆
          </motion.div>
          <div style={{
            fontFamily: 'monospace',
            fontSize: 8,
            letterSpacing: '.16em',
            color: phase === 'idle'
              ? 'rgba(180,160,90,.5)'
              : phase === 'scanning'
              ? 'rgba(74,222,128,.45)'
              : 'rgba(90,80,50,.3)',
          }}>
            {phase === 'idle' ? '按壓指紋打卡' : phase === 'scanning' ? '讀取中…' : '打卡完成'}
          </div>

          {/* Scan line animation */}
          {phase === 'scanning' && (
            <motion.div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: 2,
                background: 'linear-gradient(90deg, transparent, rgba(74,222,128,.5), transparent)',
              }}
              animate={{ top: [0, 76, 0] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
            />
          )}
        </motion.button>

        {/* Paper slot */}
        <div style={{
          marginTop: 14,
          height: 4,
          background: '#080808',
          borderRadius: 2,
          border: '1px solid rgba(60,55,35,.4)',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,.6)',
        }} />

        {/* Roller ridges */}
        <div style={{ display: 'flex', gap: 4, marginTop: 3, justifyContent: 'center' }}>
          {Array(5).fill(null).map((_, i) => (
            <div key={i} style={{ width: 28, height: 2, background: 'rgba(80,70,40,.25)', borderRadius: 1 }} />
          ))}
        </div>
      </motion.div>

      {/* ── Ticket Output ── */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -30, scaleY: 0.3 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            style={{ originY: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <div style={{
              width: 280,
              background: 'linear-gradient(180deg, #f7f2e2 0%, #eee8d2 100%)',
              borderTop: '4px dashed rgba(140,120,70,.3)',
              borderLeft: `2px solid ${ticketBorderColor(result.rarity)}`,
              borderRight: `2px solid ${ticketBorderColor(result.rarity)}`,
              borderBottom: `2px solid ${ticketBorderColor(result.rarity)}`,
              padding: '16px 20px 20px',
              boxShadow: '0 6px 24px rgba(0,0,0,.55)',
              position: 'relative',
            }}>
              {/* Hole punch marks */}
              {[16, 56, 96].map((top) => (
                <div key={top} style={{
                  position: 'absolute',
                  left: -5,
                  top,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#0e0c1a',
                  border: '1px solid rgba(140,120,70,.25)',
                }} />
              ))}

              {/* Header */}
              <div style={{
                fontFamily: 'monospace',
                fontSize: 7.5,
                letterSpacing: '.22em',
                color: 'rgba(70,55,25,.4)',
                textAlign: 'center',
                marginBottom: 12,
                paddingBottom: 8,
                borderBottom: '1px dashed rgba(100,85,40,.2)',
              }}>
                ── 職場命格判定 ──
              </div>

              {/* Card info */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 30, lineHeight: 1 }}>{result.icon_emoji}</span>
                <div>
                  <div style={{
                    fontFamily: 'monospace',
                    fontSize: 14,
                    fontWeight: 700,
                    color: nameColor(result.rarity),
                    letterSpacing: '.04em',
                    marginBottom: 4,
                  }}>
                    {result.name}
                  </div>
                  <div style={{
                    fontFamily: 'monospace',
                    fontSize: 7.5,
                    letterSpacing: '.2em',
                    color: result.rarity === 'CURSED'
                      ? 'rgba(153,27,27,.6)'
                      : result.rarity === 'RARE'
                      ? 'rgba(146,64,14,.55)'
                      : 'rgba(90,80,60,.45)',
                    border: `1px solid ${
                      result.rarity === 'CURSED'
                        ? 'rgba(153,27,27,.3)'
                        : result.rarity === 'RARE'
                        ? 'rgba(146,64,14,.28)'
                        : 'rgba(90,80,60,.2)'
                    }`,
                    display: 'inline-block',
                    padding: '1px 5px',
                  }}>
                    {result.rarity}
                  </div>
                </div>
              </div>

              {/* Description */}
              <p style={{
                fontFamily: 'monospace',
                fontSize: 10,
                color: 'rgba(50,40,20,.72)',
                lineHeight: 1.75,
                marginBottom: 14,
                whiteSpace: 'pre-line',
              }}>
                {result.description}
              </p>

              {/* Confirm button */}
              <motion.button
                onClick={handleConfirm}
                disabled={confirmed}
                style={{
                  width: '100%',
                  padding: '8px 0',
                  fontFamily: 'monospace',
                  fontSize: 9,
                  letterSpacing: '.22em',
                  color: confirmed ? 'rgba(80,60,30,.3)' : 'rgba(70,50,15,.7)',
                  background: confirmed ? 'transparent' : 'rgba(120,95,40,.1)',
                  border: `1px solid ${confirmed ? 'rgba(80,60,30,.15)' : 'rgba(130,100,40,.38)'}`,
                  cursor: confirmed ? 'default' : 'pointer',
                  transition: 'all .2s',
                }}
                whileHover={!confirmed ? { backgroundColor: 'rgba(120,95,40,.18)' } : {}}
                whileTap={!confirmed ? { scale: 0.98 } : {}}
              >
                {confirmed ? '打卡完成…' : (confirm_label ?? '確認打卡')}
              </motion.button>

              {/* Footer */}
              <div style={{
                fontFamily: 'monospace',
                fontSize: 7,
                color: 'rgba(80,60,30,.22)',
                textAlign: 'center',
                marginTop: 10,
                letterSpacing: '.1em',
              }}>
                ABYSS CORP · 深淵人力資源部 · ∞ 次輪迴
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Idle hint */}
      {phase === 'idle' && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            fontFamily: 'monospace',
            fontSize: 10,
            color: 'rgba(140,120,70,.4)',
            letterSpacing: '.14em',
          }}
        >
          請將右手食指放上感應區
        </motion.p>
      )}
    </div>
  );
};
