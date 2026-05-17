export type RewardKind = 'heal' | 'effect' | 'skill' | 'strengthen';

/** 奖励池上下文：决定三选一池规则。 */
export type RewardPoolContext = 'rest' | 'unknown' | 'combat' | 'boss';

export interface RewardOption {
    kind: RewardKind;
    /** effectId / skillId / upgradeEffectId；回血无 id。 */
    id?: string;
    title: string;
    description: string;
    iconPath?: string;
}

export interface RewardPanelPayload {
    context: RewardPoolContext;
    /** 战斗内发奖时由 Main 注入，用于直接改 ECS。 */
    applyInCombat?: boolean;
}
