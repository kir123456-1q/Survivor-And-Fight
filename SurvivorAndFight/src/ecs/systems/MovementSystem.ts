import { EcsWorld } from '../core/World';
import { System } from '../core/System';
import { Position, Velocity } from '../components/TransformComponents';

/** 2D 平面移动：仅更新 x、y，z 保持不变。 */
export class MovementSystem implements System {
    readonly group = 'logic' as const;
    readonly priority = 0;

    constructor(
        private readonly world: EcsWorld,
        private readonly isPaused?: () => boolean,
    ) {}

    update(deltaTime: number): void {
        if (this.isPaused?.()) return;
        const pairs = this.world.getAllOfType(Velocity);
        for (const [entity, velocity] of pairs) {
            const position = this.world.getComponent(entity, Position);
            if (!position) continue;
            position.x += velocity.vx * deltaTime;
            position.y += velocity.vy * deltaTime;
        }
    }
}

