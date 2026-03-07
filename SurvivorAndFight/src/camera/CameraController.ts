/**
 * 相机控制接口：绑定 Laya Camera 节点，提供位置/朝向的读写及 move、zoom（沿视线前后移动）接口。
 * 位置修改通过 transform.position 的 setter 或 translate，确保引擎真正更新（getter 可能返回副本，直接 setValue 不生效）。
 */
export class CameraController {
    private _camera: Laya.Camera | null = null;
    private _forwardTemp: Laya.Vector3 = new Laya.Vector3();
    private _translateTemp: Laya.Vector3 = new Laya.Vector3();

    /** 绑定场景中的 Camera 节点；传 null 则解除绑定。 */
    bind(camera: Laya.Camera | null): void {
        this._camera = camera;
    }

    get camera(): Laya.Camera | null {
        return this._camera;
    }

    /** 是否已绑定有效相机 */
    get isBound(): boolean {
        return this._camera != null && this._camera.transform != null;
    }

    /** 世界位置（只读副本由调用方保证不长期持有） */
    getPosition(out: Laya.Vector3): void {
        if (!this.isBound) return;
        const t = this._camera!.transform;
        out.x = t.position.x;
        out.y = t.position.y;
        out.z = t.position.z;
    }

    /** 设置世界位置 */
    setPosition(x: number, y: number, z: number): void {
        if (!this.isBound) return;
        this._camera!.transform.position = new Laya.Vector3(x, y, z);
    }

    /** 世界空间平移 (dx, dy, dz)。使用 translate(_, false) 确保世界坐标位移生效。 */
    move(dx: number, dy: number, dz: number): void {
        if (!this.isBound) return;
        const t = this._camera!.transform;
        this._translateTemp.setValue(dx, dy, dz);
        t.translate(this._translateTemp, false);
    }

    /** 沿相机视线方向前后移动，delta 为正向前（相机前方），为负向后。使用 translate(_, true) 沿自身前方。 */
    zoom(delta: number): void {
        if (!this.isBound) return;
        const t = this._camera!.transform;
        t.getForward(this._forwardTemp);
        Laya.Vector3.scale(this._forwardTemp, -delta, this._forwardTemp);
        t.translate(this._forwardTemp, false);
    }
}
