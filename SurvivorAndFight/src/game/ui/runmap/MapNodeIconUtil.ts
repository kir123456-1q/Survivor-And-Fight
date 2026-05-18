import {
    MAP_ICON_BOSS,
    MAP_ICON_COMBAT,
    MAP_ICON_REST,
    MAP_ICON_TREASURE,
    MAP_ICON_UNKNOWN,
    RUN_MAP_NODE_SIZE,
} from '../../../defines';
import type { RunNodeType } from '../../run/RunTypes';
import { applyTextureToImage } from '../../render/TextureAtlasService';
import { findDescendantByName } from '../UiNodeUtil';

const ICON_BY_TYPE: Record<RunNodeType, string> = {
    Boss: MAP_ICON_BOSS,
    Treasure: MAP_ICON_TREASURE,
    Rest: MAP_ICON_REST,
    Combat: MAP_ICON_COMBAT,
    Unknown: MAP_ICON_UNKNOWN,
};

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
