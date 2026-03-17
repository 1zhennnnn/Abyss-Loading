import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/useGameStore';
import { OptionButton } from './OptionButton';
import { DialogueBox } from './DialogueBox';
import { PuzzleOverlay } from './puzzle/PuzzleOverlay';
import { FortuneRitual } from './ritual/FortuneRitual';
import { ItemInspectModal } from './ItemInspectModal';
import { SystemToast } from './SystemToast';
import type { FortuneCard, FortuneRitualDef } from '../types/game.types';

// ── atmosphere config ────────────────────────────────────────────────────────
const atmosphereConfig: Record<string, { rootClass: string; cssVars: Record<string, string> }> = {
  NORMAL: {
    rootClass: '',
    cssVars: {
      '--atmo-bg-tint':     'transparent',
      '--atmo-border-tint': 'rgba(255,255,255,0.07)',
      '--atmo-hud-color':   'rgba(100,90,140,0.6)',
    },
  },
  TENSE: {
    rootClass: 'atmo-tense',
    cssVars: {
      '--atmo-bg-tint':     'rgba(120,20,20,0.18)',
      '--atmo-border-tint': 'rgba(160,50,50,0.35)',
      '--atmo-hud-color':   'rgba(180,80,60,0.75)',
    },
  },
  EERIE: {
    rootClass: 'atmo-eerie',
    cssVars: {
      '--atmo-bg-tint':     'rgba(50,15,90,0.22)',
      '--atmo-border-tint': 'rgba(100,60,170,0.35)',
      '--atmo-hud-color':   'rgba(130,90,200,0.7)',
    },
  },
  DIVINE: {
    rootClass: 'atmo-divine',
    cssVars: {
      '--atmo-bg-tint':     'rgba(100,80,15,0.18)',
      '--atmo-border-tint': 'rgba(160,120,30,0.35)',
      '--atmo-hud-color':   'rgba(190,155,55,0.75)',
    },
  },
};

const fallbackGradient: Record<string, string> = {
  NORMAL: 'radial-gradient(ellipse at 30% 40%,rgba(40,20,70,.55) 0%,transparent 60%), linear-gradient(160deg,#0d0a18 0%,#07050f 40%,#0a0810 100%)',
  TENSE:  'radial-gradient(ellipse at 20% 50%,rgba(80,20,20,.5)  0%,transparent 60%), linear-gradient(160deg,#150808 0%,#0d0505 40%,#100a0a 100%)',
  EERIE:  'radial-gradient(ellipse at 60% 40%,rgba(40,15,80,.55) 0%,transparent 60%), linear-gradient(160deg,#0c0818 0%,#08051a 40%,#0a0814 100%)',
  DIVINE: 'radial-gradient(ellipse at 50% 30%,rgba(100,70,10,.4) 0%,transparent 60%), linear-gradient(160deg,#120f04 0%,#0e0c05 40%,#0f0e06 100%)',
};

// ── BackgroundLayer（保持原版 .png 副檔名） ───────────────────────────────────
const BackgroundLayer: React.FC<{ backgroundKey?: string; atmosphere: string }> = ({
  backgroundKey, atmosphere,
}) => {
  const [cur,   setCur]   = useState(backgroundKey);
  const [prev,  setPrev]  = useState<string | undefined>(undefined);
  const [cross, setCross] = useState(false);

  useEffect(() => {
    if (backgroundKey === cur) return;
    setPrev(cur); setCross(true);
    const t = setTimeout(() => { setCur(backgroundKey); setPrev(undefined); setCross(false); }, 600);
    return () => clearTimeout(t);
  }, [backgroundKey]); // eslint-disable-line

  const bgStyle = (key?: string): React.CSSProperties => key
    ? { backgroundImage: `url('/backgrounds/${key}.png')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }
    : { background: fallbackGradient[atmosphere] ?? fallbackGradient.NORMAL };

  return (
    <div className="bg-layer" style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
      {cross && prev !== undefined && (
        <div style={{ position: 'absolute', inset: 0, opacity: 0, transition: 'opacity .6s ease', ...bgStyle(prev) }} />
      )}
      <div style={{ position: 'absolute', inset: 0, opacity: 1, transition: 'opacity .6s ease', ...bgStyle(cur) }} />
      <div style={{ position: 'absolute', inset: 0, background: 'var(--atmo-bg-tint,transparent)', transition: 'background .8s ease' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(6,5,12,.85) 0%,rgba(6,5,12,.28) 42%,transparent 70%)' }} />
    </div>
  );
};

// ── 打字機 hook ───────────────────────────────────────────────────────────────
function useTypewriter(text: string, speed = 22) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone]           = useState(false);
  const idRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const skip = () => {
    if (idRef.current) clearInterval(idRef.current);
    setDisplayed(text); setDone(true);
  };

  useEffect(() => {
    setDisplayed(''); setDone(false);
    if (!text) { setDone(true); return; }
    let idx = 0;
    idRef.current = setInterval(() => {
      idx++;
      setDisplayed(text.slice(0, idx));
      if (idx >= text.length) { clearInterval(idRef.current!); setDone(true); }
    }, speed);
    return () => { if (idRef.current) clearInterval(idRef.current); };
  }, [text, speed]);

  return { displayed, done, skip };
}

// ── 標籤中文對照表 ────────────────────────────────────────────────────────────
const TAG_LABEL_ZH: Record<string, string> = {
  // 肝苦辦公室：命格標籤
  parachute_boss:    '空降主管',
  npc_command:       '指揮低階',
  firefighter:       '救火待命',
  see_collapse:      '崩潰預視',
  disposable_intern: '免洗人力',
  break_objects:     '暴力開路',
  office_ghost:      '茶水間幽靈',
  stealth_shadow:    '陰影潛行',
  // 肝苦辦公室：進度標籤
  identity_questioned: '身份疑雲',
  found_resignation:   '找到辭職書',
  knows_schedule:      '知曉排程',
  knows_warning:       '知曉警示',
  seen_too_much:       '見過太多了',
  knows_exit_method:   '知曉出路',
  knows_maze_pattern:  '識破迷宮規律',
  knows_history:       '知曉歷史',
  has_archive_hint:    '持有檔案提示',
  clean_exit:          '乾淨離場',
  // 肝苦辦公室：結局標籤
  honest_resignation:    '誠實辭職',
  silent_resignation:    '沉默辭職',
  cleared_office_clean:   'S結局達成',
  cleared_office_escaped: 'A結局達成',
  cleared_office_ghost:   '靜默結局達成',
};

// ── 天數入場全螢幕畫面 ────────────────────────────────────────────────────────
const DAY_LABELS: Record<number, string> = {
  1: '第一天', 2: '第二天', 3: '第三天', 4: '第四天',
  5: '第五天', 6: '第六天', 7: '第七天',
};
const DAY_SUBTITLES: Record<string, Record<number, string>> = {
  song_wang: {
    1: '異鄉人踏進了不該踏進的地方',
    2: '廟宇不說謊，但它沉默',
    3: '骨頭不是竹條',
    4: '宵禁，代天巡狩',
    5: '在他們察覺之前',
    6: '王船即將啟航',
    7: '最後一天',
  },
  gan_ku_office: {
    1: '你不確定你怎麼到了這裡',
    2: '你記得昨天發生的事嗎',
    3: '茶水間的咖啡還是那麼難喝',
    4: '你的識別證還掛在胸前嗎',
    5: '再過幾天就週末了',
    6: '系統排程：明日凌晨例行維護',
    7: '你不確定今天是第幾天',
  },
};

const DayCard: React.FC<{ day: number; instanceId: string | null; onDone: () => void }> = ({ day, instanceId, onDone }) => {
  useEffect(() => {
    // 自動 2.8 秒後結束，也可以點擊跳過
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      onClick={onDone}
      style={{
        position: 'absolute', inset: 0, zIndex: 100,
        background: 'rgba(4,3,10,.96)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      {/* 橫線 */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: 200 }}
        transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
        style={{ height: 1, background: 'rgba(210,195,155,.35)', marginBottom: 28 }}
      />

      {/* 天數 */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        style={{
          fontFamily: "'Noto Serif TC', serif",
          fontSize: 42, fontWeight: 300,
          letterSpacing: '.4em',
          color: 'rgba(232,218,190,.85)',
          textShadow: '0 0 60px rgba(180,160,110,.2)',
        }}
      >
        {DAY_LABELS[day] ?? `第 ${day} 天`}
      </motion.div>

      {/* 副標題 */}
      {(() => {
        const subtitle = (DAY_SUBTITLES[instanceId ?? ''] ?? DAY_SUBTITLES.song_wang)[day];
        return subtitle ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            style={{
              marginTop: 16,
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 11, letterSpacing: '.25em',
              color: 'rgba(160,145,115,.45)',
            }}
          >
            {subtitle}
          </motion.div>
        ) : null;
      })()}

      {/* 橫線 */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: 200 }}
        transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
        style={{ height: 1, background: 'rgba(210,195,155,.35)', marginTop: 28 }}
      />

      {/* 點擊跳過提示 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.4 }}
        style={{
          position: 'absolute', bottom: 40,
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 9, letterSpacing: '.25em',
          color: 'rgba(160,145,115,.3)',
        }}
      >
        點擊跳過
      </motion.div>
    </motion.div>
  );
};

// ── 右側狀態面板 ──────────────────────────────────────────────────────────────
const StatusSidebar: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const stats           = useGameStore((s) => s.stats);
  const localTags       = useGameStore((s) => s.localTags);
  const localInventory  = useGameStore((s) => s.localInventory);
  const instanceFortune = useGameStore((s) => s.instanceFortune);
  const itemRegistry    = useGameStore((s) => s.itemRegistry);

  const statBars = [
    { label: '靈感', key: 'inspiration' as const, color: 'rgba(130,100,220,.75)' },
    { label: '體質', key: 'constitution' as const, color: 'rgba(52,180,120,.75)'  },
    { label: '因果', key: 'karma'        as const, color: 'rgba(200,155,55,.75)'  },
  ];

  return (
    <motion.div
      animate={{ x: open ? 0 : '100%' }}
      initial={{ x: '100%' }}
      transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
      style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: 264,
        background: 'rgba(7,5,16,.97)',
        borderLeft: '1px solid rgba(180,165,220,.14)',
        zIndex: 50,
        display: 'flex', flexDirection: 'column',
        fontFamily: "'Share Tech Mono', monospace",
      }}
    >
      <div style={{
        padding: '14px 16px 10px',
        borderBottom: '1px solid rgba(180,165,220,.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 9, letterSpacing: '.22em', color: 'rgba(180,165,220,.55)' }}>靈魂旅者 · 命格狀態</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(160,145,200,.45)', cursor: 'pointer', fontSize: 14 }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>

        {instanceFortune && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 8, letterSpacing: '.2em', color: 'rgba(160,145,200,.32)', marginBottom: 7, textTransform: 'uppercase' }}>本回命格</div>
            <div style={{ background: 'rgba(16,12,30,.7)', border: '1px solid rgba(180,165,220,.1)', padding: '9px 10px', display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ fontSize: 22 }}>{instanceFortune.icon_emoji}</span>
              <div>
                <div style={{ fontSize: 13, color: 'rgba(225,210,180,.85)', letterSpacing: '.06em' }}>{instanceFortune.name}</div>
                <div style={{ fontSize: 8, color: 'rgba(160,145,200,.32)', marginTop: 2, letterSpacing: '.1em' }}>{instanceFortune.rarity}</div>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 8, letterSpacing: '.2em', color: 'rgba(160,145,200,.32)', marginBottom: 8, textTransform: 'uppercase' }}>命格數值</div>
          {statBars.map(s => {
            const val = stats[s.key];
            const pct = Math.max(0, Math.min(100, Math.abs(val)));
            const display = s.key === 'karma' && val < 0 ? `−${Math.abs(val)}` : `${val}`;
            return (
              <div key={s.key} style={{ marginBottom: 9 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 9, color: 'rgba(160,145,200,.5)', letterSpacing: '.1em' }}>{s.label}</span>
                  <span style={{ fontSize: 10, color: 'rgba(210,195,165,.7)', fontWeight: 'bold' }}>{display}</span>
                </div>
                <div style={{ height: 4, background: 'rgba(180,165,220,.07)', position: 'relative' }}>
                  <motion.div
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.5 }}
                    style={{ position: 'absolute', inset: 0, right: 'auto', background: s.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {localTags.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 8, letterSpacing: '.2em', color: 'rgba(160,145,200,.32)', marginBottom: 7, textTransform: 'uppercase' }}>命格標籤</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {localTags.map(tag => (
                <span key={tag} style={{ fontSize: 8, letterSpacing: '.06em', padding: '2px 7px', border: '1px solid rgba(100,180,130,.28)', color: 'rgba(100,200,145,.72)', background: 'rgba(0,20,12,.55)' }}>{TAG_LABEL_ZH[tag] ?? tag}</span>
              ))}
            </div>
          </div>
        )}

        {localInventory.length > 0 && (
          <div>
            <div style={{ fontSize: 8, letterSpacing: '.2em', color: 'rgba(160,145,200,.32)', marginBottom: 7, textTransform: 'uppercase' }}>當前道具</div>
            {localInventory.map(itemId => {
              const def = itemRegistry?.[itemId];
              return (
                <div key={itemId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', marginBottom: 4, background: 'rgba(14,12,26,.6)', border: '1px solid rgba(180,165,220,.08)' }}>
                  <span style={{ fontSize: 18 }}>{def?.icon_emoji ?? '📦'}</span>
                  <div>
                    <div style={{ fontSize: 10, color: 'rgba(205,192,165,.75)', letterSpacing: '.04em' }}>{def?.name ?? itemId}</div>
                    {def?.short_desc && <div style={{ fontSize: 8, color: 'rgba(150,138,115,.42)', marginTop: 1 }}>{def.short_desc}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ── Panel Tab ──────────────────────────────────────────────────────────────
const PanelTab: React.FC<{ open: boolean; onClick: () => void; stats: { inspiration: number; constitution: number; karma: number } }> = ({
  open, onClick, stats,
}) => (
  <motion.button
    animate={{ right: open ? 268 : 0 }}
    transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
    onClick={onClick}
    style={{
      position: 'absolute', top: '50%', transform: 'translateY(-50%)',
      zIndex: 51,
      background: 'rgba(9,7,20,.94)',
      border: '1px solid rgba(180,165,220,.18)',
      color: 'rgba(180,165,220,.65)',
      cursor: 'pointer', padding: '14px 7px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
      fontFamily: "'Share Tech Mono', monospace",
    }}
  >
    <span style={{ fontSize: 9, writingMode: 'vertical-rl', letterSpacing: '.14em', color: 'rgba(180,165,220,.5)' }}>
      {open ? '收起' : '狀態'}
    </span>
    {!open && (
      <div style={{ display: 'flex', flexDirection: 'row', gap: 3, marginTop: 4 }}>
        {[
          { val: stats.inspiration,       color: 'rgba(130,100,220,.75)' },
          { val: stats.constitution,      color: 'rgba(52,180,120,.75)'  },
          { val: Math.abs(stats.karma),   color: 'rgba(200,155,55,.75)'  },
        ].map((s, i) => (
          <div key={i} style={{ width: 4, height: 28, background: 'rgba(180,165,220,.06)', position: 'relative' }}>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${Math.min(100, s.val)}%`, background: s.color, transition: 'height .5s' }} />
          </div>
        ))}
      </div>
    )}
  </motion.button>
);

// ── DeadScreen ────────────────────────────────────────────────────────────────
const DeadScreen: React.FC = () => {
  const exitInstance = useGameStore((s) => s.exitInstance);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2 }} className="dead-screen">
      <div className="dead-icon">☠</div>
      <div className="dead-title">深淵已吞噬你</div>
      <div className="dead-sub">命格記錄已定格</div>
      <button className="dead-return" onClick={exitInstance}>RETURN TO HUB</button>
    </motion.div>
  );
};

// ── 遊戲流程狀態 ──────────────────────────────────────────────────────────────
//
//  'typing'   → 打字機播放中（點擊可跳過）
//  'confirm'  → 打字完，等玩家點「繼續」（有 entry_dialogue 的話這步直接過）
//  'dialogue' → entry_dialogue 播放中（由 DialogueBox + activeDialogueId 控制）
//  'choices'  → 顯示選項
//
// 轉換規則：
//   scene 切換          → 'typing'
//   descDone            → if (entry_dialogue) startDialogue + 'dialogue'
//                          else 'confirm'
//   玩家點繼續           → if (entry_dialogue) startDialogue + 'dialogue'
//                          else 'choices'
//   activeDialogueId 消失 → 'choices'
//
// ── GameEngine ────────────────────────────────────────────────────────────────
export const GameEngine: React.FC = () => {
  const gamePhase         = useGameStore((s) => s.gamePhase);
  const currentSceneId    = useGameStore((s) => s.currentSceneId);
  const sceneRegistry     = useGameStore((s) => s.sceneRegistry);
  const activeDialogueId  = useGameStore((s) => s.activeDialogueId);
  const activePuzzle      = useGameStore((s) => s.activePuzzle);
  const currentInstanceId = useGameStore((s) => s.currentInstanceId);
  const applyOption       = useGameStore((s) => s.applyOption);
  const drawFortune       = useGameStore((s) => s.drawFortune);
  const navigateTo        = useGameStore((s) => s.navigateTo);
  const exitInstance      = useGameStore((s) => s.exitInstance);
  const stats             = useGameStore((s) => s.stats);
  const startDialogue     = useGameStore((s) => s.startDialogue);

  const ritualDef  = useGameStore((s) => (s as { ritualDef: FortuneRitualDef | null }).ritualDef);
  const entryScene = useGameStore((s) => (s as { entryScene: string | null }).entryScene);

  const [panelOpen, setPanelOpen] = useState(false);

  // 天數入場卡控制
  const [showDayCard, setShowDayCard] = useState(false);
  const [dayCardNum,  setDayCardNum]  = useState<number | null>(null);
  const [currentDay,  setCurrentDay]  = useState<number | null>(null);
  // 是否正在等待天數卡結束（卡結束前不播敘述）
  const [waitingDayCard, setWaitingDayCard] = useState(false);

  // 敘述流程狀態
  type DescPhase = 'typing' | 'confirm' | 'dialogue' | 'choices';
  const [descPhase, setDescPhase] = useState<DescPhase>('typing');

  const scene  = currentSceneId ? sceneRegistry[currentSceneId] : null;
  const atm    = scene?.atmosphere ?? 'NORMAL';
  const atmCfg = atmosphereConfig[atm] ?? atmosphereConfig.NORMAL;

  const { displayed, done: descDone, skip } = useTypewriter(
    // 天數卡還在播時不開始打字
    (!waitingDayCard && scene?.description) ? scene.description : '',
    22,
  );

  // ── scene 切換 ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentSceneId) return;
    setDescPhase('typing');

    const m = currentSceneId.match(/^day(\d+)/);
    const sceneForDay = useGameStore.getState().sceneRegistry[currentSceneId];
    const day = m ? parseInt(m[1], 10) : (sceneForDay?.day_number ?? null);

    if (day !== null && day !== currentDay) {
      setCurrentDay(day);
      setDayCardNum(day);
      setShowDayCard(true);
      setWaitingDayCard(true);
    } else {
      setWaitingDayCard(false);
    }
  }, [currentSceneId]); // eslint-disable-line

  // 天數卡結束
  const handleDayCardDone = () => {
    setShowDayCard(false);
    setWaitingDayCard(false);
  };

  // ── 打字完成 → 決定下一步 ─────────────────────────────────────────────────
  useEffect(() => {
    if (!descDone || descPhase !== 'typing' || waitingDayCard || !scene) return;

    if (scene.entry_dialogue) {
      // 有對話 → 不需要「繼續」，直接播 dialogue
      startDialogue(scene.entry_dialogue);
      setDescPhase('dialogue');
    } else {
      // 無對話 → 進入 confirm，等玩家按繼續
      setDescPhase('confirm');
    }
  }, [descDone, waitingDayCard, scene]); // eslint-disable-line

  // ── dialogue 結束 → 顯示選項 ──────────────────────────────────────────────
  useEffect(() => {
    if (descPhase === 'dialogue' && !activeDialogueId) {
      setDescPhase('choices');
    }
  }, [activeDialogueId, descPhase]);

  // ── 玩家點「繼續」 ────────────────────────────────────────────────────────
  const handleContinue = () => {
    if (!scene) return;
    // entry_dialogue 在打字完時已播，這裡不會再觸發
    setDescPhase('choices');
  };

  // ── atmosphere CSS vars ───────────────────────────────────────────────────
  useEffect(() => {
    Object.entries(atmCfg.cssVars).forEach(([k, v]) =>
      document.documentElement.style.setProperty(k, v),
    );
  }, [atm]); // eslint-disable-line

  function handleRitualComplete(card: FortuneCard, isReversed?: boolean) {
    drawFortune(card, isReversed);
  }

  useEffect(() => {
    if (gamePhase === 'PLAYING' && !currentSceneId && entryScene) navigateTo(entryScene);
  }, [gamePhase, currentSceneId, entryScene, navigateTo]);

  useEffect(() => {
    if (currentSceneId === 'exit' && gamePhase === 'PLAYING') {
      const t = setTimeout(() => exitInstance(), 2500);
      return () => clearTimeout(t);
    }
  }, [currentSceneId, gamePhase, exitInstance]);

  // ── wrapNavigateTo：副本自訂場景切換攔截器 ─────────────────────────────────
  useEffect(() => {
    if (!currentInstanceId) return;
    const manifest = (useGameStore.getState() as { _currentManifest: import('../types/game.types').InstanceManifest | null })._currentManifest;
    if (!manifest?.wrapNavigateTo) return;

    const originalNavigateTo = useGameStore.getState().navigateTo;
    const wrapped = manifest.wrapNavigateTo(originalNavigateTo);
    useGameStore.setState({ navigateTo: wrapped } as never);

    return () => {
      useGameStore.setState({ navigateTo: originalNavigateTo } as never);
    };
  }, [currentInstanceId]); // eslint-disable-line

  const choicesVisible = descPhase === 'choices' && gamePhase === 'PLAYING' && Boolean(scene);

  // ── 儀式畫面 ──────────────────────────────────────────────────────────────
  if (gamePhase === 'RITUAL' && ritualDef) {
    return (
      <div className="vn-root">
        <div className="bg-layer"><div className="bg-fallback" /></div>
        <FortuneRitual ritualDef={ritualDef} onComplete={handleRitualComplete} />
        <SystemToast />
      </div>
    );
  }

  return (
    <div className={`vn-root${atmCfg.rootClass ? ` ${atmCfg.rootClass}` : ''}`}
      style={{ position: 'relative', overflow: 'hidden' }}>

      {/* 0. 背景圖層 */}
      <BackgroundLayer backgroundKey={scene?.background_key} atmosphere={atm} />

      {/* 1. HUD 頂條（原版 class） */}
      <div className="hud-strip" style={{ position: 'relative', zIndex: 20 }}>
        <span className="hud-instance">
          {currentInstanceId ?? 'ABYSS'}{scene ? ` · ${scene.title}` : ''}
        </span>
        <span className="hud-atmo">{atm}</span>
        <div style={{ width: 32 }} />
      </div>

      {/* 2. 天數入場全螢幕卡片 */}
      <AnimatePresence>
        {showDayCard && dayCardNum !== null && (
          <DayCard key={`daycard-${dayCardNum}`} day={dayCardNum} instanceId={currentInstanceId} onDone={handleDayCardDone} />
        )}
      </AnimatePresence>

      {/* 3. 死亡畫面 */}
      <AnimatePresence>
        {gamePhase === 'DEAD' && <DeadScreen />}
      </AnimatePresence>

      {/* 4. 場景描述區（天數卡結束後才顯示） */}
      {scene && gamePhase === 'PLAYING' && !waitingDayCard && (
        <AnimatePresence mode="wait">
          <motion.div
            key={scene.id + '-desc'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.25 } }}
            style={{
              position: 'absolute',
              top: 32, left: 0, right: 0, bottom: 'calc(25vh + 60px)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '24px 80px',
              overflowY: 'auto',
              zIndex: 10,
              // 打字中可點擊跳過
              pointerEvents: descPhase === 'typing' ? 'auto' : 'none',
              cursor: descPhase === 'typing' ? 'pointer' : 'default',
            }}
            onClick={() => { if (descPhase === 'typing') skip(); }}
          >
            {/* 主敘述 */}
            <p style={{
              fontFamily: "'Crimson Pro', Georgia, serif",
              fontStyle: 'italic', fontSize: 16, fontWeight: 300,
              color: 'rgba(232,218,196,.9)',
              lineHeight: 2, whiteSpace: 'pre-wrap',
              textAlign: 'center', maxWidth: 680,
              textShadow: '0 1px 18px rgba(0,0,0,1), 0 0 55px rgba(0,0,0,.8)',
            }}>
              {displayed}
              {descPhase === 'typing' && <span className="typing-cursor" />}
            </p>

            {/* 謎題提示框 */}
            {descPhase === 'choices' && (scene as any).puzzle_context && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                style={{
                  marginTop: 22, padding: '10px 20px',
                  background: 'rgba(7,5,16,.78)',
                  border: '1px solid rgba(180,158,90,.24)',
                  maxWidth: 560, textAlign: 'center',
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: 10, color: 'rgba(205,180,115,.7)',
                  letterSpacing: '.1em', lineHeight: 1.75,
                  whiteSpace: 'pre-line',
                }}
              >
                {(scene as any).puzzle_context}
              </motion.div>
            )}

            {/* 打字跳過提示 */}
            {descPhase === 'typing' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, .55, .28, .55] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  marginTop: 18, fontFamily: "'Share Tech Mono', monospace",
                  fontSize: 9, letterSpacing: '.2em',
                  color: 'rgba(180,165,130,.45)', userSelect: 'none',
                  textShadow: '0 0 10px rgba(0,0,0,.9)',
                }}
              >
                點擊跳過
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* 5. 「繼續」按鈕（打字完且無 entry_dialogue 時出現，在描述區底部） */}
      <AnimatePresence>
        {descPhase === 'confirm' && gamePhase === 'PLAYING' && (
          <motion.div
            key="continue-btn"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{
              position: 'absolute',
              bottom: 'calc(25vh + 28px)',
              left: '50%', transform: 'translateX(-50%)',
              zIndex: 16,
            }}
          >
            <button
              onClick={handleContinue}
              style={{
                background: 'transparent',
                border: '1px solid rgba(210,195,155,.25)',
                color: 'rgba(210,195,155,.65)',
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 10, letterSpacing: '.28em',
                padding: '7px 22px',
                cursor: 'pointer',
                transition: 'all .2s',
              }}
              onMouseEnter={e => {
                (e.target as HTMLButtonElement).style.borderColor = 'rgba(210,195,155,.55)';
                (e.target as HTMLButtonElement).style.color = 'rgba(230,215,175,.9)';
              }}
              onMouseLeave={e => {
                (e.target as HTMLButtonElement).style.borderColor = 'rgba(210,195,155,.25)';
                (e.target as HTMLButtonElement).style.color = 'rgba(210,195,155,.65)';
              }}
            >
              ▶ 繼續
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. 選項覆蓋層（原版 class 保留） */}
      <div className={`choices-overlay${choicesVisible ? ' visible' : ''}`} style={{ zIndex: 15 }}>
        {scene && scene.options.length > 0 && (
          <>
            <div className="choice-prompt">— 選擇命運的走向 —</div>
            {scene.options.map((option, idx) => (
              <OptionButton
                key={option.id}
                option={option}
                index={idx}
                onClick={() => applyOption(option)}
              />
            ))}
          </>
        )}
        {scene && scene.options.length === 0 && (
          <button className="dead-return" style={{ marginTop: 8 }} onClick={exitInstance}>
            RETURN TO HUB
          </button>
        )}
      </div>

      {/* 7. 對話框（原版，不加額外 wrapper） */}
      <DialogueBox />

      {/* 8. 謎題遮罩 */}
      {(gamePhase === 'PUZZLE' || activePuzzle) && <PuzzleOverlay />}

      {/* 9. 狀態面板 */}
      <StatusSidebar open={panelOpen} onClose={() => setPanelOpen(false)} />

      {/* 10. 面板 Tab */}
      <PanelTab
        open={panelOpen}
        onClick={() => setPanelOpen((p) => !p)}
        stats={stats}
      />

      {/* 11. 道具 / 通知 */}
      <ItemInspectModal />
      <SystemToast />
    </div>
  );
};