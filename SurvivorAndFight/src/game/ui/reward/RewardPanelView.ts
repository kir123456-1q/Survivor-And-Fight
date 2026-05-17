import {
    ESC_BTN_NAME,
    REWARD_BTN_1_NAME,
    REWARD_BTN_2_NAME,
    REWARD_BTN_3_NAME,
    REWARD_BTN_ICON_NAME,
    REWARD_OPTION_ICON_SIZE,
    REWARD_PANEL_PREFAB,
} from '../../../defines';
import type { RewardOption } from '../../reward/RewardTypes';
import { bindClick, findDescendantByName, setNodeVisible, unbindClick } from '../UiNodeUtil';

const textureCache = new Map<string, any>();

async function loadTexture(url: string): Promise<any> {
    if (textureCache.has(url)) return textureCache.get(url);
    const tex = await Laya.loader.load(url);
    textureCache.set(url, tex);
    return tex;
}

async function applyIconToImg(img: any, iconPath: string | undefined, size: number): Promise<void> {
    if (!img) return;
    if (!iconPath) {
        setNodeVisible(img, false);
        return;
    }
    const tex = await loadTexture(iconPath);
    img.width = size;
    img.height = size;
    if (img.autoSize !== undefined) img.autoSize = false;
    setNodeVisible(img, true);
    if (img.texture !== undefined) {
        img.texture = tex;
    } else if (img.src !== undefined) {
        img.src = iconPath;
    }
}

function findTextField(root: any): any | null {
    if (!root) return null;
    if (typeof root.text === 'string' || typeof root.text !== 'undefined') return root;
    const childCount = typeof root.numChildren === 'number' ? root.numChildren : 0;
    for (let i = 0; i < childCount; i++) {
        const found = findTextField(root.getChildAt(i));
        if (found) return found;
    }
    return null;
}

function setButtonLabel(btn: any, option: RewardOption): void {
    if (!btn) return;
    const label = findTextField(btn);
    const text = `${option.title}\n${option.description}`;
    if (label && typeof label.text !== 'undefined') {
        label.text = text;
        if (typeof label.fontSize === 'number' && label.fontSize > 28) {
            label.fontSize = 28;
        }
    }
}

export class RewardPanelView {
    private root: any = null;
    private escBtn: any = null;
    private readonly choiceBtns: any[] = [];
    private onEsc: (() => void) | null = null;
    private readonly onChoiceHandlers: Array<((index: number) => void) | null> = [null, null, null];

    async initialize(): Promise<void> {
        if (this.root) return;
        this.root = await Laya.Prefab.instantiate(REWARD_PANEL_PREFAB);
        this.escBtn = findDescendantByName(this.root, ESC_BTN_NAME);
        const names = [REWARD_BTN_1_NAME, REWARD_BTN_2_NAME, REWARD_BTN_3_NAME];
        for (let i = 0; i < names.length; i++) {
            this.choiceBtns[i] = findDescendantByName(this.root, names[i]);
        }
    }

    setOnEsc(handler: (() => void) | null): void {
        this.onEsc = handler;
    }

    setOnChoice(index: number, handler: ((index: number) => void) | null): void {
        if (index < 0 || index > 2) return;
        this.onChoiceHandlers[index] = handler;
    }

    async renderOptions(options: RewardOption[]): Promise<void> {
        for (let i = 0; i < 3; i++) {
            const btn = this.choiceBtns[i];
            const opt = options[i];
            if (!btn) continue;
            if (!opt) {
                setNodeVisible(btn, false);
                continue;
            }
            setNodeVisible(btn, true);
            setButtonLabel(btn, opt);
            const img = findDescendantByName(btn, REWARD_BTN_ICON_NAME);
            if (opt.kind === 'effect' || opt.kind === 'skill') {
                await applyIconToImg(img, opt.iconPath, REWARD_OPTION_ICON_SIZE);
            } else if (img) {
                setNodeVisible(img, false);
            }
        }
    }

    show(): void {
        if (!this.root) return;
        if (!this.root.parent) {
            Laya.stage.addChild(this.root);
        }
        bindClick(this.escBtn, this, this.handleEsc);
        bindClick(this.choiceBtns[0], this, this.handleChoice0);
        bindClick(this.choiceBtns[1], this, this.handleChoice1);
        bindClick(this.choiceBtns[2], this, this.handleChoice2);
    }

    hide(): void {
        unbindClick(this.escBtn, this, this.handleEsc);
        unbindClick(this.choiceBtns[0], this, this.handleChoice0);
        unbindClick(this.choiceBtns[1], this, this.handleChoice1);
        unbindClick(this.choiceBtns[2], this, this.handleChoice2);
        if (this.root?.parent?.removeChild) {
            this.root.parent.removeChild(this.root);
        }
    }

    dispose(): void {
        this.hide();
        if (this.root?.destroy) {
            this.root.destroy();
        }
        this.root = null;
        this.onEsc = null;
        this.onChoiceHandlers.fill(null);
    }

    private handleEsc(): void {
        this.onEsc?.();
    }

    private handleChoice0(): void {
        this.onChoiceHandlers[0]?.(0);
    }

    private handleChoice1(): void {
        this.onChoiceHandlers[1]?.(1);
    }

    private handleChoice2(): void {
        this.onChoiceHandlers[2]?.(2);
    }
}
