/**
 * InstanceLoader — 動態載入副本模組的輔助工具。
 * Engine 透過此模組進行 dynamic import，保持對具體副本零依賴。
 *
 * 使用方式：
 *   const manifest = await loadInstanceById('tribunal');
 *   useGameStore.getState().loadInstance(manifest);
 */

import type { InstanceManifest } from '../types/game.types';

/**
 * 依 instanceId 動態載入副本模組並回傳 InstanceManifest。
 * 若模組不存在或格式不符，拋出 Error。
 */
export async function loadInstanceById(instanceId: string): Promise<InstanceManifest> {
  try {
    // Dynamic import — Webpack 會根據路徑模式自動建立 chunk
    const module = await import(`../instances/${instanceId}/index`);
    const manifest: InstanceManifest = module.default;

    if (!manifest || !manifest.id || !manifest.entry_scene) {
      throw new Error(`副本模組 "${instanceId}" 格式不符 InstanceManifest 契約`);
    }

    return manifest;
  } catch (err) {
    throw new Error(`無法載入副本 "${instanceId}"：${(err as Error).message}`);
  }
}
