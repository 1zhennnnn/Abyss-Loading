import type { InstanceManifest } from '../types/game.types';

/**
 * 依 instanceId 動態載入副本模組並回傳 InstanceManifest。
 * 引擎永遠不直接 import 任何具體副本。
 */
export async function loadInstanceById(instanceId: string): Promise<InstanceManifest> {
  const mod = await import(`../instances/${instanceId}/index`);
  return mod.default as InstanceManifest;
}
