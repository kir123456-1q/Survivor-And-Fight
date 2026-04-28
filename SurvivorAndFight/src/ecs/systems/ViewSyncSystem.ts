import { EcsWorld } from '../core/World';
import { System } from '../core/System';
import { Position, Rotation, ViewComponent } from '../components/TransformComponents';

export class ViewSyncSystem implements System {
    readonly group = 'render' as const;
    readonly priority = 0;

    constructor(private readonly world: EcsWorld) {}

    update(_deltaTime: number): void {
        const pairs = this.world.getAllOfType(ViewComponent);
        for (const [entity, view] of pairs) {
            const node = view?.node as any;
            if (node == null || (node.destroyed === true)) continue;
            const position = this.world.getComponent(entity, Position);
            const rotation = this.world.getComponent(entity, Rotation);

            if (position) {
                if (typeof node.x === 'number') node.x = position.x;
                if (typeof node.y === 'number') node.y = position.y;
                try {
                    const tr = (node as any).transform;
                    if (tr) {
                        tr.position = new Laya.Vector3(position.x, position.y, 0);
                    }
                } catch (_) { /* 2D 节点可能无 transform */ }
            }

            if (rotation) {
                try {
                    const tr = (node as any).transform;
                    if (tr) {
                        tr.rotationEuler = new Laya.Vector3(rotation.pitch, rotation.yaw, rotation.roll);
                    }
                } catch (_) { /* 2D 节点可能无 rotationEuler */ }
            }
        }
    }
}

