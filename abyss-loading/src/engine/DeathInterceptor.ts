import type { Option, ItemDefinition } from '../types/game.types';

export type DeathInterceptResult =
  | { survived: true; targetScene: string; consumedFrom: 'local' | 'global'; consumedItemId: string }
  | { survived: false };

/**
 * 純函式，不依賴任何 Store，可單獨測試。
 * 在 localInventory / globalInventory 中找出第一個 is_revive:true 的道具並消耗它。
 */
export function interceptDeath(
  option: Option,
  localInventory: string[],
  globalInventory: string[],
  itemRegistry: Record<string, ItemDefinition>
): DeathInterceptResult {
  const targetScene = option.survive_scene_id ?? option.next_scene;

  const localRevive = localInventory.find((id) => itemRegistry[id]?.is_revive);
  if (localRevive) {
    return { survived: true, targetScene, consumedFrom: 'local', consumedItemId: localRevive };
  }

  const globalRevive = globalInventory.find((id) => itemRegistry[id]?.is_revive);
  if (globalRevive) {
    return { survived: true, targetScene, consumedFrom: 'global', consumedItemId: globalRevive };
  }

  return { survived: false };
}
