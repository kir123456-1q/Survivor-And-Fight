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
            const node = view.node as any;
            if (!node) continue;
            const position = this.world.getComponent(entity, Position);
            const rotation = this.world.getComponent(entity, Rotation);

            if (position && node.transform && node.transform.position) {
                node.transform.position.setValue(position.x, position.y, position.z);
            } else if (position) {
                // Fallback for 2D nodes
                if ('x' in node) node.x = position.x;
                if ('y' in node) node.y = position.y;
            }

            if (rotation && node.transform && node.transform.rotationEuler) {
                node.transform.rotationEuler.setValue(rotation.pitch, rotation.yaw, rotation.roll);
            }
        }
    }
}

