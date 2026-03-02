import { EcsWorld } from '../core/World';
import { System } from '../core/System';
import { Position, Velocity } from '../components/TransformComponents';

export class MovementSystem implements System {
    readonly group = 'logic' as const;
    readonly priority = 0;

    constructor(private readonly world: EcsWorld) {}

    update(deltaTime: number): void {
        const pairs = this.world.getAllOfType(Velocity);
        for (const [entity, velocity] of pairs) {
            const position = this.world.getComponent(entity, Position);
            if (!position) continue;
            position.x += velocity.vx * deltaTime;
            position.y += velocity.vy * deltaTime;
            position.z += velocity.vz * deltaTime;
        }
    }
}

