import {
    EFFECT_BTN_BASE_BAR_PATH,
    EFFECT_BTN_HEIGHT,
    EFFECT_BTN_PREFAB_RES,
    EFFECT_BTN_WIDTH,
    EFFECT_ICON_NAME,
    EFFECT_ICON_SIZE,
    SKILL_ICON_SIZE,
} from '../../../defines';
import { findDescendantByName } from '../UiNodeUtil';
import { enableSlotPointer } from './SkillSlotHitTest';

const EFFECT_BTN_STATE_NAMES = ['normal', 'over', 'down'] as const;

/**
 * 实例化 EffectBtn（UI2 GWidget 无 clone，优先 Prefab.instantiate）。
 */
export async function createEffectBtn(name: string, template?: any): Promise<any> {
    let btn: any = null;
    try {
        btn = await Laya.Prefab.instantiate(EFFECT_BTN_PREFAB_RES);
    } catch (e) {
        console.warn('UiWidgetFactory: EffectBtn prefab instantiate failed', EFFECT_BTN_PREFAB_RES, e);
    }

    if (!btn && template && typeof template.create === 'function') {
        btn = template.create();
    }
    if (!btn) {
        btn = createEffectBtnFallback(name, template);
    }

    btn.name = name;
    btn.width = EFFECT_BTN_WIDTH;
    btn.height = EFFECT_BTN_HEIGHT;
    ensureEffectIconChild(btn);
    applyEffectBtnStyle(btn);
    enableSlotPointer(btn);
    return btn;
}

export function createSkillBar(name: string, template?: any): any {
    if (template && typeof template.create === 'function') {
        const bar = template.create();
        bar.name = name;
        enableSlotPointer(bar);
        return bar;
    }

    const bar = new Laya.GImage();
    bar.name = name;
    bar.width = SKILL_ICON_SIZE;
    bar.height = SKILL_ICON_SIZE;
    if (template) {
        if (template.src) bar.src = template.src;
        if (template.skin) bar.skin = template.skin;
    }
    enableSlotPointer(bar);
    return bar;
}

/** 克隆后统一三态底图与空标题。 */
export function applyEffectBtnStyle(btn: any): void {
    if (!btn) return;

    if (typeof btn.title === 'string') btn.title = '';
    if (typeof btn.selectedTitle === 'string') btn.selectedTitle = '';

    const titleField = findDescendantByName(btn, 'title');
    if (titleField && typeof titleField.text !== 'undefined') {
        titleField.text = '';
    }

    for (const stateName of EFFECT_BTN_STATE_NAMES) {
        const img = findDescendantByName(btn, stateName);
        if (!img) continue;
        if (typeof img.src !== 'undefined') {
            img.src = EFFECT_BTN_BASE_BAR_PATH;
        }
        void Laya.loader.load(EFFECT_BTN_BASE_BAR_PATH).then((tex) => {
            if (img.texture !== undefined) img.texture = tex;
        }).catch(() => {});
    }
}

function ensureEffectIconChild(btn: any): void {
    const existing = findChildByName(btn, EFFECT_ICON_NAME);
    if (existing) return;
    const icon = new Laya.GImage();
    icon.name = EFFECT_ICON_NAME;
    icon.width = EFFECT_ICON_SIZE;
    icon.height = EFFECT_ICON_SIZE;
    icon.x = -4;
    icon.y = -2;
    icon.visible = false;
    btn.addChild(icon);
}

function createEffectBtnFallback(name: string, template?: any): any {
    const btn = new Laya.GBox();
    btn.name = name;
    btn.width = EFFECT_BTN_WIDTH;
    btn.height = EFFECT_BTN_HEIGHT;

    if (template) {
        const bgSrc = template.src ?? template.skin;
        if (bgSrc) {
            btn.src = bgSrc;
        }
    }

    ensureEffectIconChild(btn);
    return btn;
}

function findChildByName(root: any, name: string): any | null {
    if (!root) return null;
    const queue: any[] = [root];
    while (queue.length > 0) {
        const node = queue.shift();
        if (!node) continue;
        if (String(node.name ?? '') === name) return node;
        const childCount = typeof node.numChildren === 'number' ? node.numChildren : 0;
        for (let i = 0; i < childCount; i++) {
            queue.push(node.getChildAt(i));
        }
    }
    return null;
}
