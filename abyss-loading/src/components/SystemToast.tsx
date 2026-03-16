import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import useGameStore from '../store/useGameStore';
import type { SystemLog } from '../types/game.types';

const MAX_TOASTS = 3;
const AUTO_DISMISS_MS = 4000;

const toastClass: Record<SystemLog['type'], string> = {
  INFO:    'toast-info',
  WARNING: 'toast-warning',
  DANGER:  'toast-danger',
  BUFF:    'toast-buff',
  DEBUFF:  'toast-debuff',
  DIVINE:  'toast-divine',
};

const toastIcon: Record<SystemLog['type'], string> = {
  INFO:    'ℹ',
  WARNING: '⚠',
  DANGER:  '☓',
  BUFF:    '✦',
  DEBUFF:  '▼',
  DIVINE:  '✦',
};

const Toast: React.FC<{ log: SystemLog; onDismiss: () => void }> = ({ log, onDismiss }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / AUTO_DISMISS_MS) * 100);
      setProgress(pct);
      if (pct === 0) {
        clearInterval(id);
        onDismiss();
      }
    }, 50);
    return () => clearInterval(id);
  }, [onDismiss]);

  const cls = toastClass[log.type] ?? 'toast-info';
  const icon = toastIcon[log.type] ?? 'ℹ';

  return (
    <motion.div
      initial={{ x: 60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 60, opacity: 0 }}
      transition={{ duration: 0.25 }}
      className={`toast ${cls}`}
      onClick={onDismiss}
      style={{ cursor: 'pointer' }}
    >
      <span style={{ marginRight: 8, opacity: 0.7 }}>{icon}</span>
      {log.message}
      <div className="toast-progress" style={{ width: `${progress}%` }} />
    </motion.div>
  );
};

export const SystemToast: React.FC = () => {
  const systemLogs = useGameStore((s) => s.systemLogs);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [reviveFlash, setReviveFlash] = useState(false);

  const visible = systemLogs
    .filter((l) => !dismissed.has(l.id))
    .slice(-MAX_TOASTS);

  useEffect(() => {
    const hasNewDivine = systemLogs
      .filter((l) => l.type === 'DIVINE' && !dismissed.has(l.id))
      .at(-1);

    if (hasNewDivine) {
      setReviveFlash(true);
      setTimeout(() => setReviveFlash(false), 600);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemLogs.length]);

  function dismiss(id: string) {
    setDismissed((prev) => new Set([...prev, id]));
  }

  return (
    <>
      <AnimatePresence>
        {reviveFlash && (
          <motion.div
            key="revive"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="revive-overlay"
          />
        )}
      </AnimatePresence>

      <div className="toast-container">
        <AnimatePresence>
          {visible.map((log) => (
            <Toast key={log.id} log={log} onDismiss={() => dismiss(log.id)} />
          ))}
        </AnimatePresence>
      </div>
    </>
  );
};
