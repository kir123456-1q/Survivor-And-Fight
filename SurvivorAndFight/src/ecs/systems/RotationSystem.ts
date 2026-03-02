import { EcsWorld } from '../core/World';
import { System } from '../core/System';
import { Rotation } from '../components/TransformComponents';

export class RotationSystem implements System {
    readonly group = 'logic' as const;
    readonly priority = -1;

    constructor(private readonly world: EcsWorld) {}

    update(deltaTime: number): void {
        const pairs = this.world.getAllOfType(Rotation);
        for (const [, rotation] of pairs) {
            rotation.yaw += 0.5 * deltaTime;
        }
    }
}

