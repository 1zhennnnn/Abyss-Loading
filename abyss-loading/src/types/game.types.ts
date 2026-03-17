// ════════════════════════════════════════════════════
// 基礎數值
// ════════════════════════════════════════════════════

export interface PlayerStats {
  inspiration: number;    // 靈感值 0–100
  constitution: number;   // 體質值 0–100
  karma: number;          // 因果值（可為負）
}

export interface StatEffect {
  stat: keyof PlayerStats;
  delta: number;           // 正數加，負數減
}

// ════════════════════════════════════════════════════
// 系統日誌
// ════════════════════════════════════════════════════

export interface SystemLog {
  id: string;
  type: 'INFO' | 'WARNING' | 'DANGER' | 'BUFF' | 'DEBUFF' | 'DIVINE';
  message: string;
  timestamp: number;
}

// ════════════════════════════════════════════════════
// 運勢儀式系統
// ════════════════════════════════════════════════════

export type RitualStyle =
  | 'STAR_CHART'        // 命盤星曜（中式）
  | 'OMIKUJI'           // 御神籤（日式）
  | 'TAROT'             // 塔羅牌（西式）
  | 'COIN_DIVINATION'   // 骨卦／銅錢卦（古典）
  | 'PUNCH_CLOCK';      // 電子打卡機（職場）

export interface FortuneCard {
  fortune_id: string;
  name: string;
  icon_emoji: string;
  description: string;              // 儀式畫面氛圍描述
  rarity: 'COMMON' | 'RARE' | 'CURSED';
  // 實際效果（純 Buff/Debuff，不影響故事身份）
  grant_tags?: string[];
  stat_modifier?: StatEffect[];
  system_msg?: string;
  system_msg_type?: SystemLog['type'];
  // 塔羅專用逆位欄位（TAROT 風格隨機判定正逆位）
  reversed_name?: string;
  reversed_description?: string;
  reversed_stat_modifier?: StatEffect[];
  reversed_grant_tags?: string[];
}

export interface FortuneRitualDef {
  ritual_style: RitualStyle;
  ritual_title: string;             // 儀式大標題（如「命盤起卦」「御籤占卜」）
  ritual_subtitle?: string;         // 副標（如「本回運勢」「今日御籤」）
  confirm_label?: string;           // 確認按鈕文字（如「承受命運」「奉籤」「揭示」）
  draw_count: number;               // 展示幾張／籤
  player_choice: boolean;           // true=玩家選；OMIKUJI/COIN_DIVINATION 固定 false
  cards: FortuneCard[];             // 本副本專屬卡池
}

// ════════════════════════════════════════════════════
// 對話系統
// ════════════════════════════════════════════════════

export type SpeakerType = 'npc' | 'narrator' | 'system' | 'player';

export interface DialogueLine {
  line_id: string;
  speaker: SpeakerType;
  speaker_name?: string;
  avatar_key?: string;
  avatar_side?: 'left' | 'right';
  text: string;                     // 支援 \n 換行
  voice_tone?: 'CALM' | 'TENSE' | 'ANGRY' | 'EERIE' | 'DIVINE';
  pause_after_ms?: number;          // 0 或未設 = 手動點擊推進
  effect_on_display?: {
    stat?: StatEffect;
    add_tags?: string[];
  };
}

export interface DialogueSequence {
  dialogue_id: string;
  lines: DialogueLine[];
  on_complete?: {
    next_scene?: string;
    unlock_option_id?: string;
  };
}

// ════════════════════════════════════════════════════
// 道具系統
// ════════════════════════════════════════════════════

export type ItemRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'CURSED';
export type ItemType = 'TOOL' | 'RELIC' | 'CONSUMABLE' | 'KEY' | 'FORBIDDEN';

export interface ItemDefinition {
  item_id: string;
  name: string;
  icon_emoji: string;
  rarity: ItemRarity;
  item_type: ItemType;
  short_desc: string;               // 背包列表顯示，20 字內
  lore_text: string;                // 點擊後展示的完整詞條敘事
  passive_effect?: string;          // 持有時的持續效果文字（純展示）
  usable_in_scenes?: string[];      // 可使用此道具的場景 ID 清單
  use_effect?: {
    consume_item: boolean;
    add_tags?: string[];
    add_items?: string[];
    effect_stat?: StatEffect[];
    dialogue_id?: string;
    unlock_option_ids?: string[];
  };
  is_revive?: boolean;              // true = 保命道具，持有時死亡自動消耗並復活
  is_cursed?: boolean;              // true = 持有時 karma 每場景 -1
}

export interface ItemCombination {
  combo_id: string;
  ingredients: [string, string];
  result_item: string;
  consume_ingredients: boolean;
  req_scene_id?: string;            // 僅在此場景可合成
  dialogue_id?: string;
  fail_dialogue_id?: string;
}

// ════════════════════════════════════════════════════
// 謎題系統
// ════════════════════════════════════════════════════

export type PuzzleType = 'CODE_INPUT' | 'SEQUENCE' | 'SYMBOL_MATCH';

export interface PuzzleReward {
  add_tags?: string[];
  add_items?: string[];
  effect_stat?: StatEffect[];
  dialogue_id?: string;
  next_scene?: string;
}

export interface PuzzleNode {
  puzzle_id: string;
  puzzle_type: PuzzleType;
  title: string;
  flavour_text: string;
  is_gate: boolean;                 // true = 主線必解；false = 支線可跳過
  max_attempts?: number;
  fail_scene?: string;
  hint_tag?: string;
  hint_text?: string;
  hint_item?: string | null;        // 持有此道具時顯示進階提示
  hint_text_with_item?: string;     // 有道具時的提示文字
  hint_text_without_item?: string;  // 無道具時的基本提示文字
  on_solve: PuzzleReward;
  config: CodeInputConfig | SequenceConfig | SymbolMatchConfig;
}

export interface CodeInputConfig {
  puzzle_type: 'CODE_INPUT';
  answer: string;
  input_length: number;
  input_type: 'number' | 'text';
  display_hint?: string;
  case_sensitive?: boolean;
}

export interface SequenceConfig {
  puzzle_type: 'SEQUENCE';
  items: { item_id: string; label: string; icon_emoji: string }[];
  correct_order: string[];
  display_hint?: string;
}

export interface SymbolMatchConfig {
  puzzle_type: 'SYMBOL_MATCH';
  pairs: {
    pair_id: string;
    symbol_a: { label: string; icon_emoji: string };
    symbol_b: { label: string; icon_emoji: string };
  }[];
  clue_text: string;
  display_hint?: string;
}

// ════════════════════════════════════════════════════
// 場景與選項
// ════════════════════════════════════════════════════

export interface Option {
  id: string;
  label: string;
  flavor_text?: string;
  req_tags?: string[];
  req_stat?: { stat: keyof PlayerStats; min?: number; max?: number };
  req_item?: string;
  req_puzzle_solved?: string;
  effect_stat?: StatEffect[];
  effect_add_tags?: string[];
  effect_add_global_tags?: string[];    // 跨副本永久 tags
  effect_remove_tags?: string[];
  effect_add_items?: string[];
  effect_remove_items?: string[];
  is_death_trigger?: boolean;
  survive_scene_id?: string;
  trigger_dialogue?: string;
  trigger_puzzle?: string;
  next_scene: string;
}

export interface SceneNode {
  id: string;
  title: string;
  description: string;
  atmosphere?: 'NORMAL' | 'TENSE' | 'EERIE' | 'DIVINE';
  background_key?: string;
  entry_dialogue?: string;
  /** 副本邏輯注入：顯示第幾天入場卡（由 wrapNavigateTo patch 寫入） */
  day_number?: number;
  /** 進入場景時自動套用的效果 */
  effect_add_tags?: string[];
  effect_stat?: StatEffect[];
  options: Option[];
}

// ════════════════════════════════════════════════════
// 副本模組契約（InstanceManifest）
// Engine 只認識這個介面，不 import 任何具體副本
// ════════════════════════════════════════════════════

export interface InstanceManifest {
  id: string;
  name: string;
  entry_scene: string;
  fortune_ritual: FortuneRitualDef;
  scenes: Record<string, SceneNode>;
  dialogues: Record<string, DialogueSequence>;
  items: {
    item_defs: Record<string, ItemDefinition>;
    combinations: ItemCombination[];
  };
  puzzles: Record<string, PuzzleNode>;
  /** 每個副本可選的自訂邏輯模組，Engine 自動呼叫其生命週期 hook */
  hook?: import('../engine/InstanceHook').InstanceHook;
  /** 副本載入時呼叫（重設內部狀態） */
  onLoad?:         () => void;
  /** 副本卸載時呼叫（清理內部狀態） */
  onUnload?:       () => void;
  /** 包裝 navigateTo，可在場景切換前插入自訂邏輯（如計數、patch scene） */
  wrapNavigateTo?: (original: (sceneId: string) => void) => (sceneId: string) => void;
}

// ════════════════════════════════════════════════════
// 主神空間（Hub）型別
// ════════════════════════════════════════════════════

export interface HubInstanceEntry {
  id: string;
  name: string;
  unlock_condition: null | {
    req_global_tag?: string;
    req_global_item?: string;
  };
}

export interface HubConfig {
  instances: HubInstanceEntry[];
}

// ════════════════════════════════════════════════════
// 謎題系統進行狀態
// ════════════════════════════════════════════════════

export interface ActivePuzzleState {
  puzzle_id: string;
  triggered_by_option_id: string;
  is_gate: boolean;
  attempts: number;
}

// ════════════════════════════════════════════════════
// 全域 Store 型別
// ════════════════════════════════════════════════════

export interface GameState {
  // 玩家狀態
  stats: PlayerStats;
  localTags: string[];
  localInventory: string[];
  globalInventory: string[];
  globalTags: string[];             // 跨副本永久 tags
  clearedInstances: Record<string, { ending: string; clearedAt: string }>;  // 通關紀錄

  // 運勢
  instanceFortune: FortuneCard | null;
  fortuneIsReversed: boolean;

  // 場景
  currentSceneId: string | null;
  currentInstanceId: string | null;
  gamePhase: 'HUB' | 'RITUAL' | 'PLAYING' | 'PUZZLE' | 'DEAD' | 'CLEARED';

  // 系統
  systemLogs: SystemLog[];

  // 對話
  dialogueQueue: DialogueLine[];
  activeDialogueId: string | null;
  dialogueTotalLines: number;       // 本次對話序列總行數（含合成的場景描述行）
  pendingNextScene: string | null;  // 對話或謎題結束後才跳轉的目標

  // 道具
  itemRegistry: Record<string, ItemDefinition>;
  combinationRegistry: ItemCombination[];
  inspectingItemId: string | null;
  usingItemId: string | null;

  // 謎題
  solvedPuzzles: string[];
  activePuzzle: ActivePuzzleState | null;
  puzzleRegistry: Record<string, PuzzleNode>;

  // 副本場景快取（Engine 使用）
  sceneRegistry: Record<string, SceneNode>;
  dialogueRegistry: Record<string, DialogueSequence>;
}
