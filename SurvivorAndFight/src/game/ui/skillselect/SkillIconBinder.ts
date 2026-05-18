import { getEffectIconPath, getSkillIconPath } from '../../skill/SkillLoadoutModel';
import {
    EFFECT_ICON_NAME,
    EFFECT_ICON_SIZE,
    SKILL_ICON_CHILD_NAME,
    SKILL_ICON_SIZE,
} from '../../../defines';
import { applyTextureToImage } from '../../render/TextureAtlasService';
import { findDescendantByName } from '../UiNodeUtil';

function bringToFront(parent: any, child: any): void {
    if (!parent || !child || typeof parent.setChildIndex !== 'function') return;
    const idx = typeof parent.numChildren === 'number' ? parent.numChildren - 1 : -1;
    if (idx >= 0) parent.setChildIndex(child, idx);
}

export function getSkillIconNode(parent: any): any | null {
    return findDescendantByName(parent, SKILL_ICON_CHILD_NAME);
}

export function getEffectIconNode(effectBtnRoot: any): any | null {
    return findDescendantByName(effectBtnRoot, EFFECT_ICON_NAME);
}

export function setSkillSlotIconVisible(parent: any, visible: boolean): void {
    const icon = getSkillIconNode(parent);
    if (icon) icon.visible = visible;
}

export function setEffectSlotIconVisible(effectBtnRoot: any, visible: boolean): void {
    const icon = getEffectIconNode(effectBtnRoot);
    if (icon) icon.visible = visible;
}

/** 跟随鼠标的拖拽幽灵图（挂在 stage 上）。 */
export async function createDragGhost(iconPath: string, size: number): Promise<any> {
    const ghost = new Laya.GImage();
    ghost.name = '__dragGhost';
    ghost.mouseEnabled = false;
    await applyTextureToImage(ghost, iconPath, size);
    return ghost;
}

/** 在 SkillBaseBar（GImage）上挂载 80×80 技能图标。 */
export async function bindSkillIcon(parent: any, skillId: string | null): Promise<void> {
    if (!parent) return;

    let icon = getSkillIconNode(parent);
    if (!skillId) {
        if (icon) icon.visible = false;
        return;
    }

    const path = getSkillIconPath(skillId);
    if (!path) return;

    if (!icon) {
        icon = new Laya.GImage();
        icon.name = SKILL_ICON_CHILD_NAME;
        parent.addChild(icon);
    }

    const pw = Number(parent.width) || SKILL_ICON_SIZE;
    const ph = Number(parent.height) || SKILL_ICON_SIZE;
    icon.x = Math.round((pw - SKILL_ICON_SIZE) * 0.5);
    icon.y = Math.round((ph - SKILL_ICON_SIZE) * 0.5);
    bringToFront(parent, icon);
    await applyTextureToImage(icon, path, SKILL_ICON_SIZE);
}

/** EffectBtn 内 EffectIcon：有 effect 显示 47×47，无则隐藏。 */
export async function bindEffectIcon(effectBtnRoot: any, effectId: string | null): Promise<void> {
    if (!effectBtnRoot) return;
    const icon = getEffectIconNode(effectBtnRoot);
    if (!icon) return;

    if (!effectId) {
        icon.visible = false;
        return;
    }

    const path = getEffectIconPath(effectId);
    if (!path) {
        icon.visible = false;
        return;
    }

    bringToFront(effectBtnRoot, icon);
    await applyTextureToImage(icon, path, EFFECT_ICON_SIZE);
}
