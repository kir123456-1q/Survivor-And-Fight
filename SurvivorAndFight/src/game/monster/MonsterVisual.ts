import { MONSTER_BODY_IMAGE_NAME, MONSTER_WORLD_ICON_SIZE } from '../../defines';
import { findDescendantByName } from '../ui/UiNodeUtil';

const textureCache = new Map<string, unknown>();

async function loadTexture(url: string): Promise<unknown> {
    if (textureCache.has(url)) return textureCache.get(url)!;
    const tex = await Laya.loader.load(url);
    textureCache.set(url, tex);
    return tex;
}

/** 将 MonsterBody 的 img 节点换为对应怪物 icon。 */
export async function applyMonsterIconSkin(
    bodyRoot: unknown,
    iconPath: string | undefined,
    size: number = MONSTER_WORLD_ICON_SIZE,
): Promise<void> {
    if (!bodyRoot || !iconPath) return;
    const root = bodyRoot as { width?: number; height?: number; numChildren?: number; getChildAt?: (i: number) => unknown };
    let img = findDescendantByName(root, MONSTER_BODY_IMAGE_NAME) as {
        visible?: boolean;
        width?: number;
        height?: number;
        autoSize?: boolean;
        texture?: unknown;
        src?: string;
        x?: number;
        y?: number;
    } | null;
    if (!img) return;

    const tex = await loadTexture(iconPath);
    img.visible = true;
    img.width = size;
    img.height = size;
    if (img.autoSize !== undefined) img.autoSize = false;
    const pw = Number(root.width) || size;
    const ph = Number(root.height) || size;
    img.x = Math.round((pw - size) * 0.5);
    img.y = Math.round((ph - size) * 0.5);
    if (img.texture !== undefined) {
        img.texture = tex;
    } else if (img.src !== undefined) {
        img.src = iconPath;
    }
}
