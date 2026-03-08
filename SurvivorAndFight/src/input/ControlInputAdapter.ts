import type { InputService } from './InputService';
import { KeyCode } from './KeyCode';
import type { ControlInputSource } from '../ecs/systems/ControlSystem';

/**
 * 将 InputService 适配为 ControlSystem 所需的 ControlInputSource。
 * 移动：WASD -> 轴；技能释放：指定键（默认 J）按下时返回当前技能 id，需由业务配置。
 */
export class ControlInputAdapter implements ControlInputSource {
    private _currentSkillId: string | null = null;
    private _skillKey = 74; // J

    constructor(
        private readonly input: InputService,
        options?: { skillKey?: number; defaultSkillId?: string },
    ) {
        if (options?.skillKey != null) this._skillKey = options.skillKey;
        if (options?.defaultSkillId != null) this._currentSkillId = options.defaultSkillId;
    }

    setCurrentSkillId(id: string | null): void {
        this._currentSkillId = id;
    }

    getMoveAxis(): { x: number; y: number } {
        let x = 0;
        let y = 0;
        if (this.input.isKeyDown(KeyCode.W)) y += 1;
        if (this.input.isKeyDown(KeyCode.S)) y -= 1;
        if (this.input.isKeyDown(KeyCode.A)) x -= 1;
        if (this.input.isKeyDown(KeyCode.D)) x += 1;
        return { x, y };
    }

    getSkillCastRequest(): { skillId: string; targetPos?: { x: number; y: number; z?: number } } | null {
        if (!this.input.isKeyDown(this._skillKey) || !this._currentSkillId) return null;
        return { skillId: this._currentSkillId };
    }
}
