// src/instances/gan_ku_office/index.ts
// 肝苦辦公室：在職中 — 含場景訪問計數系統

import type { InstanceManifest } from '../../types/game.types';
import scenes        from './scenes.json';
import dialogues     from './dialogues.json';
import itemsData     from './items.json';
import puzzles       from './puzzles.json';
import fortuneRitual from './fortune_ritual.json';

// ── 場景訪問計數（只在本副本作用域） ──────────────────────────────────────────
const visitCounts: Record<string, number> = {};

function resetVisitCounts() {
  Object.keys(visitCounts).forEach((k) => delete visitCounts[k]);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveScene(rawScene: any, sceneId: string): any {
  const count = visitCounts[sceneId] ?? 0;

  // 找 visit_variants 中 min_visit <= count 的最高版本
  let description = rawScene.description;
  if (Array.isArray(rawScene.visit_variants) && rawScene.visit_variants.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const matched = [...rawScene.visit_variants]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((v: any) => count >= v.min_visit)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => b.min_visit - a.min_visit)[0];
    if (matched) description = matched.description;
  }

  // 過濾選項（依 max_visits / min_visits）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const options = (rawScene.options ?? []).filter((opt: any) => {
    if (opt.max_visits !== undefined && count > opt.max_visits) return false;
    if (opt.min_visits !== undefined && count < opt.min_visits) return false;
    return true;
  });

  const patch: Record<string, unknown> = { description, options };
  if (sceneId === 'office_entry') patch.day_number = count;
  return { ...rawScene, ...patch };
}

// ── navigateTo 包裝 ────────────────────────────────────────────────────────────
function wrapNavigateTo(
  original: (sceneId: string) => void
): (sceneId: string) => void {
  return (sceneId: string) => {
    // 只對本副本場景計數
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((scenes as any)[sceneId]) {
      visitCounts[sceneId] = (visitCounts[sceneId] ?? 0) + 1;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resolved = resolveScene((scenes as any)[sceneId], sceneId);
      // 使用動態 import 避免模組層級循環依賴；
      // 模組已快取，.then() 在下一個 microtask 立即執行，
      // 早於任何 React re-render，確保 patchScene 在 navigateTo 之前生效。
      import('../../store/useGameStore').then(({ default: store }) => {
        store.getState().patchScene(sceneId, resolved);
        original(sceneId);
      });
    } else {
      original(sceneId);
    }
  };
}

// ── InstanceManifest ───────────────────────────────────────────────────────────
const manifest: InstanceManifest = {
  id:             'gan_ku_office',
  name:           '肝苦辦公室：在職中',
  entry_scene:    'office_entry',
  fortune_ritual: fortuneRitual as InstanceManifest['fortune_ritual'],
  scenes:         scenes        as InstanceManifest['scenes'],
  dialogues:      dialogues     as InstanceManifest['dialogues'],
  items:          itemsData     as unknown as InstanceManifest['items'],
  puzzles:        puzzles       as InstanceManifest['puzzles'],
  onLoad:         resetVisitCounts,
  onUnload:       resetVisitCounts,
  wrapNavigateTo,
};

export default manifest;
