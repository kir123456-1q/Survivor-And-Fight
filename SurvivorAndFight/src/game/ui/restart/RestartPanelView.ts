import { RESTART_PANEL_PREFAB } from '../../../defines';

export class RestartPanelView {
    private node: any = null;
    private clickTarget: any = null;
    private onRestart: (() => void) | null = null;

    async initialize(): Promise<void> {
        if (this.node) return;
        this.node = await Laya.Prefab.instantiate(RESTART_PANEL_PREFAB);
        this.clickTarget = this.findRestartButton(this.node) ?? this.node;
    }

    show(): void {
        if (!this.node) return;
        if (!this.node.parent) {
            Laya.stage.addChild(this.node);
        }
        if (this.clickTarget) {
            this.clickTarget.off(Laya.Event.CLICK, this, this.handleClick);
            this.clickTarget.on(Laya.Event.CLICK, this, this.handleClick);
        }
    }

    hide(): void {
        if (this.clickTarget) {
            this.clickTarget.off(Laya.Event.CLICK, this, this.handleClick);
        }
        if (this.node?.parent?.removeChild) {
            this.node.parent.removeChild(this.node);
        }
    }

    dispose(): void {
        this.hide();
        if (this.node?.destroy) {
            this.node.destroy();
        }
        this.node = null;
        this.clickTarget = null;
        this.onRestart = null;
    }

    setOnRestart(handler: (() => void) | null): void {
        this.onRestart = handler;
    }

    private handleClick(): void {
        this.onRestart?.();
    }

    private findRestartButton(root: any): any | null {
        const queue: any[] = [root];
        while (queue.length > 0) {
            const node = queue.shift();
            if (!node) continue;
            const name = String(node.name ?? '').toLowerCase();
            if (name.includes('restart') || name.includes('revive') || name.includes('again')) {
                return node;
            }
            const childCount = typeof node.numChildren === 'number' ? node.numChildren : 0;
            for (let i = 0; i < childCount; i++) {
                queue.push(node.getChildAt(i));
            }
        }
        return null;
    }
}

