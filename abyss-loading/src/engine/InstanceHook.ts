import type { PlayerStats, SystemLog } from '../types/game.types';

/** 傳入 hook 的唯讀狀態快照 */
export interface HookContext {
  sceneId: string;
  localTags: string[];
  localInventory: string[];
  solvedPuzzles: string[];
  stats: PlayerStats;
}

/** hook 可以呼叫的有限動作集合（避免循環依賴） */
export interface HookActions {
  pushLog: (message: string, type: SystemLog['type']) => void;
  addTag: (tag: string) => void;
  addItem: (itemId: string) => void;
  navigateTo: (sceneId: string) => void;
  startDialogue: (dialogueId: string) => void;
}

/**
 * 每個副本可以 export 一個實作此介面的物件，
 * Engine 會在對應的生命週期節點自動呼叫。
 */
export interface InstanceHook {
  /** 每次進入場景後觸發（在 entry_dialogue 之後） */
  onEnterScene?: (ctx: HookContext, actions: HookActions) => void;

  /** 選項套用完成後（在跳轉/對話/謎題開始之前） */
  onOptionApplied?: (optionId: string, ctx: HookContext, actions: HookActions) => void;

  /** 謎題解答正確、on_solve 套用完成後觸發 */
  onPuzzleSolved?: (puzzleId: string, ctx: HookContext, actions: HookActions) => void;

  /** 對話序列結束後、pendingNextScene 跳轉之前觸發 */
  onDialogueEnd?: (dialogueId: string, ctx: HookContext, actions: HookActions) => void;
}
