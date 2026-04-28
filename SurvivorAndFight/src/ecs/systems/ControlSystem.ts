import type { EcsWorld } from '../core/World';
import { System } from '../core/System';
import { Velocity } from '../components/TransformComponents';
import { Skill } from '../components/Skill';
import type { FilterRegistry } from '../filters/FilterRegistry';
import { PLAYER_MOVE_SPEED } from '../../defines';

/**
 * 输入抽象：移动轴与技能释放请求。由 input-abstraction 或 InputService 适配实现。
 */
export interface ControlInputSource {
    getMoveAxis(): { x: number; y: number };
    getSkillCastRequest(): { skillId: string; targetPos?: { x: number; y: number; z?: number } } | null;
}

/**
 * ControlSystem：根据输入抽象向带 Control 的实体写入移动意图与 pendingCast。
 * 仅对筛选器 Controllable 返回的实体应用输入；若有多个则取第一个。
 */
export class ControlSystem implements System {
    readonly group = 'input' as const;
    readonly priority = 0;

    constructor(
        private readonly world: EcsWorld,
        private readonly filters: FilterRegistry,
        private readonly input: ControlInputSource | null,
        private readonly isPaused?: () => boolean,
    ) {}

    update(_deltaTime: number): void {
        if (this.isPaused?.()) return;
        if (!this.input) return;
        const controllable = this.filters.getNamedFilter('Controllable');
        if (controllable.length === 0) return;
        const entity = controllable[0];
        const axis = this.input.getMoveAxis();
        const velocity = this.world.getComponent(entity, Velocity);
        if (velocity) {
            velocity.vx = axis.x * PLAYER_MOVE_SPEED;
            velocity.vy = axis.y * PLAYER_MOVE_SPEED;
            if (velocity.vz !== undefined) velocity.vz = 0;
        }
        const cast = this.input.getSkillCastRequest();
        if (cast) {
            const skill = this.world.getComponent(entity, Skill);
            if (skill) {
                skill.pendingCast = { skillId: cast.skillId, targetPos: cast.targetPos };
            }
        }
    }
}
