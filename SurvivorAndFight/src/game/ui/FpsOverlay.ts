import {
    DESIGN_HEIGHT,
    FPS_FONT_SIZE,
    FPS_MARGIN_BOTTOM,
    FPS_MARGIN_LEFT,
    FPS_TEXT_NAME,
    FPS_Z_ORDER,
} from '../../defines';

/**
 * 主界面左下角 FPS 显示（UI2 GTextField，与 MainUIPanel 内 SKillTxt 一致）。
 */
export class FpsOverlay {
    private textField: any = null;

    attach(parent: any): void {
        if (!parent || this.textField) return;

        const field = new Laya.GTextField();
        field.name = FPS_TEXT_NAME;
        field.text = 'FPS: --';
        field.fontSize = FPS_FONT_SIZE;
        field.color = '#FFFFFF';
        field.width = 140;
        field.height = FPS_FONT_SIZE + 8;
        if (typeof field.mouseEnabled !== 'undefined') field.mouseEnabled = false;
        if (typeof field.zOrder !== 'undefined') field.zOrder = FPS_Z_ORDER;

        const parentH =
            typeof parent.height === 'number' && parent.height > 0 ? parent.height : DESIGN_HEIGHT;
        field.x = FPS_MARGIN_LEFT;
        field.y = parentH - FPS_MARGIN_BOTTOM - field.height;

        parent.addChild(field);
        this.textField = field;
        this.bringToFront();
        this.update();
    }

    update(): void {
        if (!this.textField) return;
        this.textField.text = `FPS: ${this.readFps()}`;
        this.bringToFront();
    }

    dispose(): void {
        if (this.textField?.destroy) this.textField.destroy();
        this.textField = null;
    }

    /** Laya.Stat.FPS 在未开启统计面板时可能为 0，用帧间隔回退计算。 */
    private readFps(): number {
        const statFps = Laya.Stat?.FPS;
        if (typeof statFps === 'number' && statFps > 0) {
            return Math.round(statFps);
        }
        const deltaMs = Laya.timer?.delta ?? 0;
        if (deltaMs > 0) {
            return Math.round(1000 / deltaMs);
        }
        return 0;
    }

    private bringToFront(): void {
        const field = this.textField;
        const parent = field?.parent;
        if (!field || !parent || typeof parent.numChildren !== 'number') return;
        if (typeof field.zOrder !== 'undefined') field.zOrder = FPS_Z_ORDER;
        if (typeof parent.setChildIndex === 'function' && parent.numChildren > 0) {
            parent.setChildIndex(field, parent.numChildren - 1);
        }
    }
}
