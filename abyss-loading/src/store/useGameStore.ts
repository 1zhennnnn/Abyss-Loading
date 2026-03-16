import { create } from 'zustand';
import type {
  GameState,
  PlayerStats,
  StatEffect,
  SystemLog,
  Option,
  FortuneCard,
  FortuneRitualDef,
  InstanceManifest,
  ItemDefinition,
  DialogueSequence,
} from '../types/game.types';
import { interceptDeath } from '../engine/DeathInterceptor';
import { validatePuzzle } from '../engine/PuzzleValidator';
import type { InstanceHook, HookActions } from '../engine/InstanceHook';

// ─── HookActions 建構輔助（在 store 內部使用）─────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildHookActions(set: (p: any) => void, get: () => ExtendedState & GameActions): HookActions {
  return {
    pushLog:       (msg, type) => get().pushLog(msg, type),
    navigateTo:    (id)        => get().navigateTo(id),
    startDialogue: (id)        => get().startDialogue(id),
    addTag: (tag) => {
      const cur = get().localTags;
      if (!cur.includes(tag)) set({ localTags: [...cur, tag] });
    },
    addItem: (itemId) => {
      const cur = get().localInventory;
      if (!cur.includes(itemId)) set({ localInventory: [...cur, itemId] });
    },
  };
}

// ─── 邊界保護輔助 ──────────────────────────────────────
function clampStat(stat: keyof PlayerStats, value: number): number {
  if (stat === 'karma') return value; // karma 無上限限制
  return Math.max(0, Math.min(100, value));
}

function applyStatEffects(
  stats: PlayerStats,
  effects: StatEffect[]
): PlayerStats {
  const next = { ...stats };
  for (const eff of effects) {
    next[eff.stat] = clampStat(eff.stat, next[eff.stat] + eff.delta);
  }
  return next;
}

// ─── 擴充 State（ritualDef / entryScene 不在 GameState 內，但存入 store） ──
interface ExtendedState extends GameState {
  ritualDef: FortuneRitualDef | null;
  entryScene: string | null;
  instanceHook: InstanceHook | null;
}

// ─── 初始狀態 ──────────────────────────────────────────
const initialState: ExtendedState = {
  stats: { inspiration: 50, constitution: 50, karma: 0 },
  localTags: [],
  localInventory: [],
  globalInventory: [],
  globalTags: [],

  instanceFortune: null,
  fortuneIsReversed: false,

  currentSceneId: null,
  currentInstanceId: null,
  gamePhase: 'HUB',

  systemLogs: [],

  dialogueQueue: [],
  activeDialogueId: null,
  dialogueTotalLines: 0,
  pendingNextScene: null,

  itemRegistry: {},
  combinationRegistry: [],
  inspectingItemId: null,
  usingItemId: null,

  solvedPuzzles: [],
  activePuzzle: null,
  puzzleRegistry: {},

  sceneRegistry: {},
  dialogueRegistry: {},

  ritualDef: null,
  entryScene: null,
  instanceHook: null,
};

// ─── 介面定義 ──────────────────────────────────────────
interface GameActions {
  loadInstance: (manifest: InstanceManifest) => void;
  exitInstance: () => void;

  drawFortune: (card: FortuneCard, isReversed?: boolean) => void;

  navigateTo: (sceneId: string) => void;
  applyOption: (option: Option) => void;

  startDialogue: (dialogueId: string) => void;
  advanceDialogue: () => void;
  endDialogue: () => void;

  inspectItem: (itemId: string) => void;
  closeInspect: () => void;
  startUseItem: (itemId: string) => void;
  cancelUseItem: () => void;
  confirmUseItem: () => void;
  combineItems: (itemIdA: string, itemIdB: string) => void;

  openPuzzle: (puzzleId: string, triggeredByOptionId: string) => void;
  submitPuzzleAnswer: (answer: unknown) => void;
  skipPuzzle: () => void;
  closePuzzle: () => void;

  pushLog: (message: string, type: SystemLog['type']) => void;
  clearLogs: () => void;
}

// ─── Store ─────────────────────────────────────────────
export const useGameStore = create<ExtendedState & GameActions>()((set, get) => ({
  ...initialState,

  // ══════════════════════════════════════════════════
  // 副本載入
  // ══════════════════════════════════════════════════
  loadInstance: (manifest) => {
    set({
      // 清空所有 local 狀態
      localTags: [],
      localInventory: [],
      solvedPuzzles: [],
      dialogueQueue: [],
      activeDialogueId: null,
      dialogueTotalLines: 0,
      pendingNextScene: null,
      activePuzzle: null,
      instanceFortune: null,
      fortuneIsReversed: false,
      usingItemId: null,
      inspectingItemId: null,
      currentSceneId: null,
      stats: { inspiration: 50, constitution: 50, karma: 0 },
      systemLogs: [],

      // 注入副本資料
      itemRegistry: manifest.items.item_defs,
      combinationRegistry: manifest.items.combinations,
      puzzleRegistry: manifest.puzzles,
      sceneRegistry: manifest.scenes,
      dialogueRegistry: manifest.dialogues,

      currentInstanceId: manifest.id,
      entryScene: manifest.entry_scene,
      ritualDef: manifest.fortune_ritual,
      instanceHook: manifest.hook ?? null,
      // 強制進入儀式畫面
      gamePhase: 'RITUAL',
    });
  },

  exitInstance: () => {
    set({
      localTags: [],
      localInventory: [],
      solvedPuzzles: [],
      dialogueQueue: [],
      activeDialogueId: null,
      dialogueTotalLines: 0,
      pendingNextScene: null,
      activePuzzle: null,
      instanceFortune: null,
      fortuneIsReversed: false,
      usingItemId: null,
      inspectingItemId: null,
      currentSceneId: null,
      currentInstanceId: null,
      stats: { inspiration: 50, constitution: 50, karma: 0 },
      systemLogs: [],
      itemRegistry: {},
      combinationRegistry: [],
      puzzleRegistry: {},
      sceneRegistry: {},
      dialogueRegistry: {},
      ritualDef: null,
      entryScene: null,
      instanceHook: null,
      gamePhase: 'HUB',
    });
  },

  // ══════════════════════════════════════════════════
  // 運勢儀式
  // ══════════════════════════════════════════════════
  drawFortune: (card, isReversed = false) => {
    const state = get();
    const reversed = isReversed && Boolean(card.reversed_stat_modifier);

    const modifiers = reversed
      ? (card.reversed_stat_modifier ?? [])
      : (card.stat_modifier ?? []);
    const tags = reversed
      ? (card.reversed_grant_tags ?? [])
      : (card.grant_tags ?? []);

    const newStats = applyStatEffects(state.stats, modifiers);
    const newTags = [...new Set([...state.localTags, ...tags])];

    set({
      stats: newStats,
      localTags: newTags,
      instanceFortune: card,
      fortuneIsReversed: reversed,
    });

    if (card.system_msg) {
      get().pushLog(card.system_msg, card.system_msg_type ?? 'BUFF');
    }

    // 設定 PLAYING 後，GameEngine 的 useEffect 會自動呼叫 navigateTo(entry_scene)
    set({ gamePhase: 'PLAYING' });
  },

  // ══════════════════════════════════════════════════
  // 場景導覽
  // ══════════════════════════════════════════════════
  navigateTo: (sceneId) => {
    const state = get();
    const scene = state.sceneRegistry[sceneId];
    if (!scene) {
      console.warn(`[Engine] 場景 "${sceneId}" 不存在`);
      return;
    }

    // cursed 道具 karma -1
    let nextStats = { ...state.stats };
    for (const itemId of state.localInventory) {
      const itemDef = state.itemRegistry[itemId];
      if (itemDef?.is_cursed) {
        nextStats = applyStatEffects(nextStats, [{ stat: 'karma', delta: -1 }]);
      }
    }

    set({
      currentSceneId: sceneId,
      pendingNextScene: null,
      stats: nextStats,
      gamePhase: 'PLAYING',
      usingItemId: null,
      // 清除任何殘留的對話狀態，讓 GameEngine 的 phase 機制重新接管
      dialogueQueue: [],
      activeDialogueId: null,
      dialogueTotalLines: 0,
    });

    // 副本 hook：onEnterScene
    const hook = get().instanceHook;
    if (hook?.onEnterScene) {
      const s = get();
      hook.onEnterScene(
        { sceneId, localTags: s.localTags, localInventory: s.localInventory, solvedPuzzles: s.solvedPuzzles, stats: s.stats },
        buildHookActions(set, get)
      );
    }
  },

  // ══════════════════════════════════════════════════
  // 選項執行
  // ══════════════════════════════════════════════════
  applyOption: (option) => {
    const state = get();

    // 1. 死亡觸發判斷
    if (option.is_death_trigger) {
      const result = interceptDeath(
        option,
        state.localInventory,
        state.globalInventory,
        state.itemRegistry
      );

      if (result.survived) {
        // 消耗保命道具
        const consumedId = result.consumedItemId;
        if (result.consumedFrom === 'local') {
          set((s) => ({
            localInventory: s.localInventory.filter((id) => id !== consumedId),
          }));
        } else {
          set((s) => ({
            globalInventory: s.globalInventory.filter((id) => id !== consumedId),
          }));
        }
        get().pushLog('命盤庇護·死劫已消', 'DIVINE');
        get().navigateTo(result.targetScene);
        return;
      } else {
        set({ gamePhase: 'DEAD' });
        return;
      }
    }

    // 2. 套用所有 effect_*
    let nextStats = { ...state.stats };
    if (option.effect_stat) {
      nextStats = applyStatEffects(nextStats, option.effect_stat);
    }

    let nextLocalTags = [...state.localTags];
    if (option.effect_add_tags) {
      nextLocalTags = [...new Set([...nextLocalTags, ...option.effect_add_tags])];
    }
    if (option.effect_remove_tags) {
      nextLocalTags = nextLocalTags.filter(
        (t) => !option.effect_remove_tags!.includes(t)
      );
    }

    let nextLocalInventory = [...state.localInventory];
    if (option.effect_add_items) {
      nextLocalInventory = [
        ...new Set([...nextLocalInventory, ...option.effect_add_items]),
      ];
    }
    if (option.effect_remove_items) {
      nextLocalInventory = nextLocalInventory.filter(
        (id) => !option.effect_remove_items!.includes(id)
      );
    }

    set({
      stats: nextStats,
      localTags: nextLocalTags,
      localInventory: nextLocalInventory,
    });

    // 2.5 副本 hook：onOptionApplied
    const hookOpt = get().instanceHook;
    if (hookOpt?.onOptionApplied) {
      const s = get();
      hookOpt.onOptionApplied(
        option.id,
        { sceneId: s.currentSceneId ?? '', localTags: s.localTags, localInventory: s.localInventory, solvedPuzzles: s.solvedPuzzles, stats: s.stats },
        buildHookActions(set, get)
      );
    }

    // 3. trigger_puzzle
    if (option.trigger_puzzle) {
      set({ pendingNextScene: option.next_scene });
      get().openPuzzle(option.trigger_puzzle, option.id);
      return;
    }

    // 4. trigger_dialogue
    if (option.trigger_dialogue) {
      set({ pendingNextScene: option.next_scene });
      get().startDialogue(option.trigger_dialogue);
      return;
    }

    // 5. 直接跳轉
    get().navigateTo(option.next_scene);
  },

  // ══════════════════════════════════════════════════
  // 對話
  // ══════════════════════════════════════════════════
  startDialogue: (dialogueId) => {
    const state = get();
    const seq: DialogueSequence | undefined = state.dialogueRegistry[dialogueId];
    if (!seq) {
      console.warn(`[Engine] 對話 "${dialogueId}" 不存在`);
      return;
    }
    set({
      dialogueQueue: [...seq.lines],
      activeDialogueId: dialogueId,
      dialogueTotalLines: seq.lines.length,
    });
  },

  advanceDialogue: () => {
    const state = get();
    if (state.dialogueQueue.length === 0) {
      get().endDialogue();
      return;
    }

    const currentLine = state.dialogueQueue[0];

    // 套用 effect_on_display
    if (currentLine.effect_on_display) {
      const eff = currentLine.effect_on_display;
      if (eff.stat) {
        set((s) => ({
          stats: applyStatEffects(s.stats, [eff.stat!]),
        }));
      }
      if (eff.add_tags) {
        set((s) => ({
          localTags: [...new Set([...s.localTags, ...(eff.add_tags ?? [])])],
        }));
      }
    }

    const remaining = state.dialogueQueue.slice(1);
    if (remaining.length === 0) {
      get().endDialogue();
    } else {
      set({ dialogueQueue: remaining });
    }
  },

  endDialogue: () => {
    const state = get();
    const dialogueId = state.activeDialogueId;
    const seq = dialogueId ? state.dialogueRegistry[dialogueId] : null;

    set({ dialogueQueue: [], activeDialogueId: null, dialogueTotalLines: 0 });

    // 副本 hook：onDialogueEnd
    if (dialogueId) {
      const hook = get().instanceHook;
      if (hook?.onDialogueEnd) {
        const s = get();
        hook.onDialogueEnd(
          dialogueId,
          { sceneId: s.currentSceneId ?? '', localTags: s.localTags, localInventory: s.localInventory, solvedPuzzles: s.solvedPuzzles, stats: s.stats },
          buildHookActions(set, get)
        );
      }
    }

    if (seq?.on_complete?.unlock_option_id) {
      const optionTag = `unlocked_option_${seq.on_complete.unlock_option_id}`;
      set((s) => ({
        localTags: [...new Set([...s.localTags, optionTag])],
      }));
    }

    if (seq?.on_complete?.next_scene) {
      get().navigateTo(seq.on_complete.next_scene);
      return;
    }

    const pending = get().pendingNextScene;
    if (pending) {
      set({ pendingNextScene: null });
      get().navigateTo(pending);
    }
  },

  // ══════════════════════════════════════════════════
  // 道具
  // ══════════════════════════════════════════════════
  inspectItem: (itemId) => {
    set({ inspectingItemId: itemId });
  },

  closeInspect: () => {
    set({ inspectingItemId: null });
  },

  startUseItem: (itemId) => {
    set({ inspectingItemId: null, usingItemId: itemId });
  },

  cancelUseItem: () => {
    set({ usingItemId: null });
  },

  confirmUseItem: () => {
    const state = get();
    const itemId = state.usingItemId;
    if (!itemId) return;

    const itemDef: ItemDefinition | undefined = state.itemRegistry[itemId];
    if (!itemDef?.use_effect) return;

    const currentScene = state.currentSceneId;
    if (
      itemDef.usable_in_scenes &&
      currentScene &&
      !itemDef.usable_in_scenes.includes(currentScene)
    ) {
      get().pushLog(`此場景無法使用「${itemDef.name}」`, 'WARNING');
      return;
    }

    const eff = itemDef.use_effect;

    // 套用效果
    if (eff.effect_stat) {
      set((s) => ({
        stats: applyStatEffects(s.stats, eff.effect_stat!),
      }));
    }
    if (eff.add_tags) {
      set((s) => ({
        localTags: [...new Set([...s.localTags, ...(eff.add_tags ?? [])])],
      }));
    }
    if (eff.add_items) {
      set((s) => ({
        localInventory: [
          ...new Set([...s.localInventory, ...(eff.add_items ?? [])]),
        ],
      }));
    }
    if (eff.unlock_option_ids) {
      const tags = eff.unlock_option_ids.map((id) => `unlocked_option_${id}`);
      set((s) => ({
        localTags: [...new Set([...s.localTags, ...tags])],
      }));
    }
    if (eff.consume_item) {
      set((s) => ({
        localInventory: s.localInventory.filter((id) => id !== itemId),
      }));
    }

    set({ usingItemId: null });

    if (eff.dialogue_id) {
      get().startDialogue(eff.dialogue_id);
    }
  },

  combineItems: (itemIdA, itemIdB) => {
    const state = get();

    const combo = state.combinationRegistry.find(
      (c) =>
        (c.ingredients[0] === itemIdA && c.ingredients[1] === itemIdB) ||
        (c.ingredients[0] === itemIdB && c.ingredients[1] === itemIdA)
    );

    if (!combo) {
      get().pushLog('這兩樣東西無法合成任何物品。', 'INFO');
      return;
    }

    if (combo.req_scene_id && combo.req_scene_id !== state.currentSceneId) {
      if (combo.fail_dialogue_id) {
        get().startDialogue(combo.fail_dialogue_id);
      } else {
        get().pushLog('此處無法進行合成。', 'WARNING');
      }
      return;
    }

    // 合成成功
    if (combo.consume_ingredients) {
      set((s) => ({
        localInventory: s.localInventory.filter(
          (id) => id !== itemIdA && id !== itemIdB
        ),
      }));
    }

    set((s) => ({
      localInventory: [...new Set([...s.localInventory, combo.result_item])],
    }));

    if (combo.dialogue_id) {
      get().startDialogue(combo.dialogue_id);
    }

    get().pushLog('合成成功！', 'BUFF');
  },

  // ══════════════════════════════════════════════════
  // 謎題
  // ══════════════════════════════════════════════════
  openPuzzle: (puzzleId, triggeredByOptionId) => {
    const state = get();
    const puzzle = state.puzzleRegistry[puzzleId];
    if (!puzzle) {
      console.warn(`[Engine] 謎題 "${puzzleId}" 不存在`);
      return;
    }

    set({
      activePuzzle: {
        puzzle_id: puzzleId,
        triggered_by_option_id: triggeredByOptionId,
        is_gate: puzzle.is_gate,
        attempts: 0,
      },
      gamePhase: 'PUZZLE',
    });
  },

  submitPuzzleAnswer: (answer) => {
    const state = get();
    if (!state.activePuzzle) return;

    const puzzle = state.puzzleRegistry[state.activePuzzle.puzzle_id];
    if (!puzzle) return;

    const correct = validatePuzzle(puzzle, answer);

    if (correct) {
      // 加入已解謎題
      set((s) => ({
        solvedPuzzles: [...new Set([...s.solvedPuzzles, puzzle.puzzle_id])],
      }));

      // 套用獎勵
      const reward = puzzle.on_solve;
      if (reward.add_tags) {
        set((s) => ({
          localTags: [...new Set([...s.localTags, ...(reward.add_tags ?? [])])],
        }));
      }
      if (reward.add_items) {
        set((s) => ({
          localInventory: [
            ...new Set([...s.localInventory, ...(reward.add_items ?? [])]),
          ],
        }));
      }
      if (reward.effect_stat) {
        set((s) => ({
          stats: applyStatEffects(s.stats, reward.effect_stat!),
        }));
      }

      get().pushLog('封印解除 ✦', 'BUFF');
      get().closePuzzle();

      // 副本 hook：onPuzzleSolved
      const hookPz = get().instanceHook;
      if (hookPz?.onPuzzleSolved) {
        const s = get();
        hookPz.onPuzzleSolved(
          puzzle.puzzle_id,
          { sceneId: s.currentSceneId ?? '', localTags: s.localTags, localInventory: s.localInventory, solvedPuzzles: s.solvedPuzzles, stats: s.stats },
          buildHookActions(set, get)
        );
      }

      if (reward.dialogue_id && get().dialogueRegistry[reward.dialogue_id]) {
        set({
          pendingNextScene: reward.next_scene ?? state.pendingNextScene,
        });
        get().startDialogue(reward.dialogue_id);
      } else {
        const target = reward.next_scene ?? state.pendingNextScene;
        if (target) {
          set({ pendingNextScene: null });
          get().navigateTo(target);
        }
      }
    } else {
      // 答案錯誤
      const newAttempts = (state.activePuzzle.attempts ?? 0) + 1;
      set((s) => ({
        activePuzzle: s.activePuzzle
          ? { ...s.activePuzzle, attempts: newAttempts }
          : null,
      }));

      if (puzzle.max_attempts && newAttempts >= puzzle.max_attempts && puzzle.fail_scene) {
        get().closePuzzle();
        get().navigateTo(puzzle.fail_scene);
        return;
      }

      get().pushLog('答案有誤，深淵在等待…', 'WARNING');
    }
  },

  skipPuzzle: () => {
    const state = get();
    if (!state.activePuzzle || state.activePuzzle.is_gate) return;

    const pending = state.pendingNextScene;
    get().closePuzzle();

    if (pending) {
      set({ pendingNextScene: null });
      get().navigateTo(pending);
    }
  },

  closePuzzle: () => {
    set({ activePuzzle: null, gamePhase: 'PLAYING' });
  },

  // ══════════════════════════════════════════════════
  // 系統日誌
  // ══════════════════════════════════════════════════
  pushLog: (message, type) => {
    const log: SystemLog = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type,
      message,
      timestamp: Date.now(),
    };
    set((s) => ({
      systemLogs: [...s.systemLogs, log].slice(-50), // 最多保留 50 條
    }));
  },

  clearLogs: () => {
    set({ systemLogs: [] });
  },
}));

// 讓 Engine 以外的程式碼可直接取得快照
export default useGameStore;
