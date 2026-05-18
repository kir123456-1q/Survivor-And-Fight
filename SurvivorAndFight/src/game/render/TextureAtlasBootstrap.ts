/**
 * 自动图集生命周期：GameRoot 合批、进战预加载、离战清缓存。
 * 由 Main 在 onStart 调用 install，在战斗进出时调用 onCombatEnter / onCombatLeave。
 */

import {
    AUTO_CLEAR_TEXTURE_CACHE_ON_LEAVE_COMBAT,
    COMBAT_DRAW_CALL_OPTIMIZE,
} from '../../defines';
import { clearTextureCache, preloadCombatIcons } from './TextureAtlasService';

let installed = false;

function setDrawCallOptimize(gameRoot: { drawCallOptimize?: boolean } | null): void {
    if (!COMBAT_DRAW_CALL_OPTIMIZE || !gameRoot) return;
    if (typeof gameRoot.drawCallOptimize !== 'undefined') {
        gameRoot.drawCallOptimize = true;
    }
}

/** 挂载到 GameRoot（Area2D）：开启 drawCallOptimize。可重复调用，仅首次打日志。 */
export function installTextureAtlasLifecycle(gameRoot: unknown): void {
    setDrawCallOptimize(gameRoot as { drawCallOptimize?: boolean } | null);
    if (!installed) {
        installed = true;
        console.log('[TextureAtlas] lifecycle installed', {
            drawCallOptimize: COMBAT_DRAW_CALL_OPTIMIZE,
            clearOnLeave: AUTO_CLEAR_TEXTURE_CACHE_ON_LEAVE_COMBAT,
        });
    }
}

/** 进入战斗前：预热配表内全部图标（含自动图集大图）。 */
export function onCombatEnter(): void {
    void preloadCombatIcons().catch(() => {});
}

/** 离开战斗视图：释放 TextureAtlasService 侧缓存。 */
export function onCombatLeave(): void {
    if (!AUTO_CLEAR_TEXTURE_CACHE_ON_LEAVE_COMBAT) return;
    clearTextureCache();
}
