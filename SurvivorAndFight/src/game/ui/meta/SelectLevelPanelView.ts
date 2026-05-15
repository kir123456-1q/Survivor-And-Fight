import {
    ESC_BTN_NAME,
    LEVEL1_BTN_NAME,
    LEVEL2_BTN_NAME,
    LEVEL3_BTN_NAME,
    SELECT_LEVEL_PANEL_PREFAB,
} from '../../../defines';
import type { RunDifficulty } from '../../../defines';
import { bindClick, findDescendantByName, unbindClick } from '../UiNodeUtil';

export class SelectLevelPanelView {
    private root: any = null;
    private escBtn: any = null;
    private level1Btn: any = null;
    private level2Btn: any = null;
    private level3Btn: any = null;
    private onEsc: (() => void) | null = null;
    private onLevelSelected: ((difficulty: RunDifficulty) => void) | null = null;

    async initialize(): Promise<void> {
        if (this.root) return;
        this.root = await Laya.Prefab.instantiate(SELECT_LEVEL_PANEL_PREFAB);
        this.escBtn = findDescendantByName(this.root, ESC_BTN_NAME);
        this.level1Btn = findDescendantByName(this.root, LEVEL1_BTN_NAME);
        this.level2Btn = findDescendantByName(this.root, LEVEL2_BTN_NAME);
        this.level3Btn = findDescendantByName(this.root, LEVEL3_BTN_NAME);
    }

    setOnEsc(handler: (() => void) | null): void {
        this.onEsc = handler;
    }

    setOnLevelSelected(handler: ((difficulty: RunDifficulty) => void) | null): void {
        this.onLevelSelected = handler;
    }

    show(): void {
        if (!this.root) return;
        if (!this.root.parent) {
            Laya.stage.addChild(this.root);
        }
        bindClick(this.escBtn, this, this.handleEsc);
        bindClick(this.level1Btn, this, this.handleLevel1);
        bindClick(this.level2Btn, this, this.handleLevel2);
        bindClick(this.level3Btn, this, this.handleLevel3);
    }

    hide(): void {
        unbindClick(this.escBtn, this, this.handleEsc);
        unbindClick(this.level1Btn, this, this.handleLevel1);
        unbindClick(this.level2Btn, this, this.handleLevel2);
        unbindClick(this.level3Btn, this, this.handleLevel3);
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
        this.onLevelSelected = null;
    }

    private handleEsc(): void {
        this.onEsc?.();
    }

    private handleLevel1(): void {
        this.onLevelSelected?.(1);
    }

    private handleLevel2(): void {
        this.onLevelSelected?.(2);
    }

    private handleLevel3(): void {
        this.onLevelSelected?.(3);
    }
}
