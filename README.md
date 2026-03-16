# 深淵載入中 · Abyss Loading

> 無限流文字冒險遊戲引擎 — 以副本為單位的命格敘事系統

---

## 專案概覽

《深淵載入中》是一個以 React + TypeScript 構建的視覺小說 / 文字冒險遊戲引擎。玩家在「主祠空間」選擇副本後，進入儀式抽取命格，再進入副本展開敘事冒險。系統以純 JSON 資料驅動場景、對話、謎題與道具，無需修改引擎程式碼即可擴充新副本。

---

## 技術棧

| 層次 | 技術 |
|------|------|
| UI 框架 | React 18 + TypeScript |
| 狀態管理 | Zustand |
| 動畫 | Framer Motion |
| 樣式 | CSS + Inline Styles |
| 建構工具 | Create React App |

---

## 目錄結構

```
src/
├── hub/                    # 主祠空間大廳
│   ├── HubScene.tsx        # 主畫面 UI
│   ├── InstanceSelector.ts # 副本載入邏輯
│   └── hub.config.json     # 副本列表設定
│
├── components/             # 引擎 UI 元件
│   ├── GameEngine.tsx      # 遊戲主引擎（場景 / 選項 / 狀態）
│   ├── DialogueBox.tsx     # 對話框（打字機效果）
│   ├── OptionButton.tsx    # 選項按鈕（含條件判斷）
│   ├── ItemInspectModal.tsx
│   ├── PlayerPanel.tsx
│   ├── SystemToast.tsx
│   ├── puzzle/             # 謎題元件
│   └── ritual/             # 儀式元件（塔羅 / 星盤 / 御籤 / 骨卦）
│
├── engine/                 # 核心引擎邏輯
│   ├── DeathInterceptor.ts # 保命道具攔截死亡
│   ├── InstanceHook.ts     # 副本自訂 Hook 介面
│   ├── InstanceLoader.ts   # 副本模組載入
│   └── PuzzleValidator.ts  # 謎題答案驗證
│
├── store/
│   └── useGameStore.ts     # Zustand 全域狀態
│
├── types/
│   └── game.types.ts       # 所有型別定義
│
└── instances/
    └── song_wang/          # 副本：永安鎮·送王
        ├── index.ts
        ├── scenes.json     # 場景與選項
        ├── dialogues.json  # 對話序列
        ├── items.json      # 道具定義
        ├── puzzles.json    # 謎題定義
        └── fortune_ritual.json  # 運勢儀式卡池
```

---

## 核心系統

### 場景系統
每個場景（`SceneNode`）包含：描述文字、背景圖、氛圍（NORMAL / TENSE / EERIE / DIVINE）、入場對話、選項列表。場景以 JSON 定義，無需改程式碼。

### 選項條件系統
選項支援多種前置條件：
- `req_tags` — 需持有指定標籤（隱藏不符合的選項）
- `req_item` — 需持有指定道具
- `req_stat` — 需數值達標（顯示但 disabled）
- `req_puzzle_solved` — 需已解開指定謎題

### 對話系統
對話序列（`DialogueSequence`）支援多說話者、聲調標記、打字機效果、自動推進（`pause_after_ms`）、對話中觸發效果（`effect_on_display`）。

### 謎題系統
支援三種謎題類型：
- `CODE_INPUT` — 數字 / 文字密碼輸入
- `SEQUENCE` — 符號排序
- `SYMBOL_MATCH` — 符號配對

### 運勢儀式
副本開始前進行命格抽取，支援四種風格：
- `TAROT` — 塔羅牌（含逆位）
- `STAR_CHART` — 命盤星曜
- `OMIKUJI` — 御神籤
- `COIN_DIVINATION` — 銅錢卦

### 道具系統
道具支援查看、使用、合成。特殊道具：
- `is_revive: true` — 保命道具，死亡時自動消耗復活
- `is_cursed: true` — 詛咒道具，每次場景切換 karma -1

---

## 新增副本

1. 在 `src/instances/` 下建立新資料夾（如 `my_instance/`）
2. 建立以下 JSON 檔：`scenes.json`、`dialogues.json`、`items.json`、`puzzles.json`、`fortune_ritual.json`
3. 建立 `index.ts`，匯出符合 `InstanceManifest` 介面的物件
4. 在 `src/hub/hub.config.json` 的 `instances` 陣列加入新副本 ID

詳細型別定義參見 `src/types/game.types.ts`。

---

## 背景圖片

場景背景圖放在 `public/backgrounds/`，檔名格式為 `{background_key}.png`。若無對應圖片，自動 fallback 至 `atmosphere` 對應的漸層色。

---

## 本地開發

```bash
npm install
npm start
```

---

## 現有副本

### 永安鎮·送王 (`song_wang`)
台灣南部漁村，七年一度的燒王船儀式。外地訪客在鎮中度過七天，逐步揭開三百年輪迴的真相。

- **結局 S**：解開血契，終止輪迴
- **結局 A**：帶著印記逃離
- **結局 E**：成為第 412 次祭品
