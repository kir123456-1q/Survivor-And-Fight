/**
 * 怪物实体标记组件。用于筛选器查询所有怪物实体。
 * 典型组合：MonsterTag + Position + Velocity + Attribute + Skill
 */
export class MonsterTag {
    readonly _tag = 'monster' as const;
}
