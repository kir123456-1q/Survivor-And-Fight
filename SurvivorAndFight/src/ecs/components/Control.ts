/**
 * 操控标记组件。拥有此组件的实体由玩家输入控制。
 * 典型组合：Control + Position + Velocity + Skill（ControlSystem 写入移动意图与 pendingCast）。
 */
export class Control {
    readonly _controlled = true as const;
}
