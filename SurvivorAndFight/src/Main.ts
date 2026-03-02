const { regClass, property } = Laya;

import { SimpleEcsDemo } from './game/demo/SimpleEcsDemo';

@regClass()
export class Main extends Laya.Script {

    private demo: SimpleEcsDemo | null = null;

    onStart() {
        console.log("Game start");
        this.demo = new SimpleEcsDemo();
        Laya.timer.frameLoop(1, this, this.onFrameLoop);
    }

    private onFrameLoop(): void {
        if (!this.demo) return;
        const deltaTimeSeconds = Laya.timer.delta / 1000;
        this.demo.update(deltaTimeSeconds);
    }
}