import { START_BTN_NAME, START_PANEL_PREFAB } from '../../../defines';
import { bindClick, findDescendantByName, unbindClick } from '../UiNodeUtil';

export class StartPanelView {
    private root: any = null;
    private startBtn: any = null;
    private onStart: (() => void) | null = null;

    async initialize(): Promise<void> {
        if (this.root) return;
        this.root = await Laya.Prefab.instantiate(START_PANEL_PREFAB);
        this.startBtn = findDescendantByName(this.root, START_BTN_NAME);
    }

    setOnStart(handler: (() => void) | null): void {
        this.onStart = handler;
    }

    show(): void {
        if (!this.root) return;
        if (!this.root.parent) {
            Laya.stage.addChild(this.root);
        }
        bindClick(this.startBtn, this, this.handleStart);
    }

    hide(): void {
        unbindClick(this.startBtn, this, this.handleStart);
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
        this.startBtn = null;
        this.onStart = null;
    }

    private handleStart(): void {
        this.onStart?.();
    }
}
