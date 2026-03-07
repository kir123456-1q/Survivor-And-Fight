import { KeyCode } from './KeyCode';

/**
 * 输入封装：键盘按键状态、鼠标滚轮增量。
 * 使用 document 级 keydown/keyup 作为键盘来源，避免因 canvas 失焦导致「仅第一次按键有效」。
 * 滚轮仍用 Laya stage 的 MOUSE_WHEEL。
 */
export class InputService {
    private _wheelDelta = 0;
    /** document 级按键状态，在 canvas 失焦时仍能收到按键 */
    private _docKeysDown = new Set<number>();
    private _boundKeyDown: (e: KeyboardEvent) => void;
    private _boundKeyUp: (e: KeyboardEvent) => void;

    constructor() {
        Laya.stage.on(Laya.Event.MOUSE_WHEEL, this, this._onMouseWheel);
        Laya.stage.on(Laya.Event.MOUSE_DOWN, this, this._onStageMouseDown);

        this._boundKeyDown = (e: KeyboardEvent) => this._onDocKeyDown(e);
        this._boundKeyUp = (e: KeyboardEvent) => this._onDocKeyUp(e);
        if (typeof document !== 'undefined') {
            document.addEventListener('keydown', this._boundKeyDown, true);
            document.addEventListener('keyup', this._boundKeyUp, true);
        }
    }

    private _onDocKeyDown(e: KeyboardEvent): void {
        this._docKeysDown.add(e.keyCode);
    }

    private _onDocKeyUp(e: KeyboardEvent): void {
        this._docKeysDown.delete(e.keyCode);
    }

    /** 点击舞台时把焦点拉回 canvas，便于其它依赖焦点的逻辑 */
    private _onStageMouseDown(): void {
        const canvas = typeof document !== 'undefined' ? document.getElementsByTagName('canvas')[0] : null;
        if (canvas) {
            if (!canvas.hasAttribute('tabindex')) {
                canvas.setAttribute('tabindex', '1');
            }
            canvas.focus();
        }
    }

    private _onMouseWheel(e: Laya.Event): void {
        this._wheelDelta += (e as Laya.Event & { delta: number }).delta;
    }

    /**
     * 查询某键当前帧是否按下。
     * 优先用 document 级状态，避免 canvas 失焦后失效；若未监听到则回退到 Laya.InputManager。
     */
    isKeyDown(keyCode: number | string): boolean {
        const code = typeof keyCode === 'string' ? parseInt(keyCode, 10) : keyCode;
        if (!isNaN(code) && this._docKeysDown.has(code)) return true;
        return Laya.InputManager.hasKeyDown(keyCode);
    }

    /**
     * 获取本帧累计的滚轮增量，读后清零。
     * 正值为向前/放大方向，负值为向后/缩小方向。
     */
    getMouseWheelDelta(): number {
        const d = this._wheelDelta;
        this._wheelDelta = 0;
        return d;
    }

    /**
     * 每帧开始时调用，用于与帧同步（当前实现滚轮在事件中累计，此处可扩展其他按帧清零逻辑）。
     */
    update(): void {
        // 滚轮在 getMouseWheelDelta 时已清零；此处预留
    }

    destroy(): void {
        Laya.stage.off(Laya.Event.MOUSE_WHEEL, this, this._onMouseWheel);
        Laya.stage.off(Laya.Event.MOUSE_DOWN, this, this._onStageMouseDown);
        if (typeof document !== 'undefined') {
            document.removeEventListener('keydown', this._boundKeyDown, true);
            document.removeEventListener('keyup', this._boundKeyUp, true);
        }
        this._docKeysDown.clear();
    }
}
