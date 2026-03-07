import { CameraController } from './CameraController';
import { InputService } from '../input/InputService';
import { KeyCode } from '../input/KeyCode';

const _forward = new Laya.Vector3();
const _right = new Laya.Vector3();

/** 基于输入的相机移动逻辑：WASD 沿相机朝向水平平移 + 滚轮缩放，速度与灵敏度可配置。 */
export class CameraMoveByInput {
    /** 平移速度（单位/秒） */
    moveSpeed = 8;
    /** 滚轮缩放灵敏度（沿视线移动距离/每单位滚轮增量） */
    wheelSensitivity = 0.5;

    constructor(
        private readonly controller: CameraController,
        private readonly input: InputService,
    ) {}

    update(deltaTime: number): void {
        if (!this.controller.isBound) return;

        const dt = deltaTime;
        const speed = this.moveSpeed * dt;
        const cam = this.controller.camera!;
        const t = cam.transform;
        t.getForward(_forward);
        t.getRight(_right);
        _forward.y = 0;
        _right.y = 0;
        const lenF = Math.sqrt(_forward.x * _forward.x + _forward.z * _forward.z);
        const lenR = Math.sqrt(_right.x * _right.x + _right.z * _right.z);
        if (lenF > 1e-6) {
            _forward.x /= lenF;
            _forward.z /= lenF;
        }
        if (lenR > 1e-6) {
            _right.x /= lenR;
            _right.z /= lenR;
        }

        const keyW = this.input.isKeyDown(KeyCode.W);
        const keyA = this.input.isKeyDown(KeyCode.A);
        const keyS = this.input.isKeyDown(KeyCode.S);
        const keyD = this.input.isKeyDown(KeyCode.D);

        let dx = 0,
            dz = 0;
        if (keyW) {
            dx -= _forward.x * speed;
            dz -= _forward.z * speed;
        }
        if (keyS) {
            dx += _forward.x * speed;
            dz += _forward.z * speed;
        }
        if (keyA) {
            dx -= _right.x * speed;
            dz -= _right.z * speed;
        }
        if (keyD) {
            dx += _right.x * speed;
            dz += _right.z * speed;
        }

        if (dx !== 0 || dz !== 0) {
            this.controller.move(dx, 0, dz);
        }

        const wheel = this.input.getMouseWheelDelta();
        if (wheel !== 0) {
            this.controller.zoom(wheel * this.wheelSensitivity);
        }
    }
}
