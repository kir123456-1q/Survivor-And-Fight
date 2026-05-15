import {
    MAP_ICON_BOSS,
    MAP_ICON_COMBAT,
    MAP_ICON_REST,
    MAP_ICON_TREASURE,
    MAP_ICON_UNKNOWN,
    RUN_MAP_NODE_SIZE,
} from '../../../defines';
import type { RunNodeType } from '../../run/RunTypes';
import { findDescendantByName } from '../UiNodeUtil';

const ICON_BY_TYPE: Record<RunNodeType, string> = {
    Boss: MAP_ICON_BOSS,
    Treasure: MAP_ICON_TREASURE,
    Rest: MAP_ICON_REST,
    Combat: MAP_ICON_COMBAT,
    Unknown: MAP_ICON_UNKNOWN,
};

const textureCache = new Map<string, any>();

async function loadTexture(url: string): Promise<any> {
    if (textureCache.has(url)) return textureCache.get(url);
    const tex = await Laya.loader.load(url);
    textureCache.set(url, tex);
    return tex;
}

async function applyTextureToImage(img: any, url: string, size: number): Promise<void> {
    if (!img) return;
    const tex = await loadTexture(url);
    img.width = size;
    img.height = size;
    if (img.autoSize !== undefined) img.autoSize = false;
    if (img.texture !== undefined) {
        img.texture = tex;
    } else if (img.src !== undefined) {
        img.src = url;
    }
}

/** 为 MapNode 三态 GImage 设置类型图标，尺寸与按钮一致。 */
export async function applyMapNodeIcon(button: any, type: RunNodeType, size = RUN_MAP_NODE_SIZE): Promise<void> {
    const url = ICON_BY_TYPE[type] ?? MAP_ICON_UNKNOWN;
    button.width = size;
    button.height = size;

    for (const stateName of ['normal', 'over', 'down']) {
        const img = findDescendantByName(button, stateName);
        await applyTextureToImage(img, url, size);
    }
}
