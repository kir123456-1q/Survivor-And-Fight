import { BULLET_SKIN_IMAGE_NAME, BULLET_WORLD_ICON_SIZE } from '../../defines';
import { findDescendantByName } from '../ui/UiNodeUtil';

const textureCache = new Map<string, any>();

async function loadTexture(url: string): Promise<any> {
    if (textureCache.has(url)) return textureCache.get(url);
    const tex = await Laya.loader.load(url);
    textureCache.set(url, tex);
    return tex;
}

function findFirstImageNode(root: any): any | null {
    if (!root) return null;
    if (root.texture !== undefined || root.src !== undefined) return root;
    const childCount = typeof root.numChildren === 'number' ? root.numChildren : 0;
    for (let i = 0; i < childCount; i++) {
        const found = findFirstImageNode(root.getChildAt(i));
        if (found) return found;
    }
    return null;
}

function resolveSkinImage(node: any): any {
    const named = findDescendantByName(node, BULLET_SKIN_IMAGE_NAME);
    if (named) return named;
    const first = findFirstImageNode(node);
    if (first) return first;
    const img = new Laya.GImage();
    img.name = BULLET_SKIN_IMAGE_NAME;
    node.addChild(img);
    return img;
}

/** 将子弹节点贴图换成与技能/Effect 图标一致的 png。 */
export async function applyBulletIconSkin(
    node: any,
    iconPath: string | undefined,
    size: number = BULLET_WORLD_ICON_SIZE,
): Promise<void> {
    if (!node || !iconPath) return;

    const img = resolveSkinImage(node);
    const tex = await loadTexture(iconPath);
    if (img.gears) {
        for (let i = 0; i < img.gears.length; i++) {
            const g = img.gears[i];
            if (g && typeof g.pages !== 'undefined') g.pages = null;
        }
    }
    img.visible = true;
    if (typeof img.displayed !== 'undefined') img.displayed = true;
    img.width = size;
    img.height = size;
    if (img.autoSize !== undefined) img.autoSize = false;
    const parentW = Number(node.width) || size;
    const parentH = Number(node.height) || size;
    img.x = Math.round((parentW - size) * 0.5);
    img.y = Math.round((parentH - size) * 0.5);
    if (img.texture !== undefined) {
        img.texture = tex;
    } else if (img.src !== undefined) {
        img.src = iconPath;
    }
}
