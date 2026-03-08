/**
 * 玩家实体标记组件。用于筛选器查询所有玩家实体。
 * 典型组合：PlayerTag + Position + Velocity + Attribute + Skill + Control
 */
export class PlayerTag {
    readonly _tag = 'player' as const;
}
