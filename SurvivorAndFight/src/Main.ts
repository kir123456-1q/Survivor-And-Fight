const { regClass, property } = Laya;

import { SimpleEcsDemo } from './game/demo/SimpleEcsDemo';
import { InputService } from './input/InputService';
import { CameraController } from './camera/CameraController';
import { CameraMoveByInput } from './camera/CameraMoveByInput';

@regClass()
export class Main extends Laya.Script {

    private demo: SimpleEcsDemo | null = null;
    private input: InputService | null = null;
    private cameraMove: CameraMoveByInput | null = null;

    onStart() {
        const scene3D = this.owner && (this.owner as any).addChild ? (this.owner as Laya.Scene3D) : null;
        this.demo = new SimpleEcsDemo(scene3D);

        this.input = new InputService();
        const camera = scene3D ? (scene3D.getChildByName('Main Camera') as Laya.Camera) : null;
        const cameraController = new CameraController();
        cameraController.bind(camera);
        this.cameraMove = new CameraMoveByInput(cameraController, this.input);

        Laya.timer.frameLoop(1, this, this.onFrameLoop);
    }

    private onFrameLoop(): void {
        const deltaTimeSeconds = Laya.timer.delta / 1000;
        if (this.input) this.input.update();
        if (this.cameraMove) this.cameraMove.update(deltaTimeSeconds);
        if (this.demo) this.demo.update(deltaTimeSeconds);
    }
}