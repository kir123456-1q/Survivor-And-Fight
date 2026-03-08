import type { EntityId } from '../core/EntityManager';

export type ModifierType = 'add' | 'multiply';

export interface AttributeModifier {
    sourceId: string;
    type: ModifierType;
    key: string;
    value: number;
}

/**
 * 属性组件。持有基础属性与 Modifier 列表。
 * 合并顺序：先加算后乘算。最终值由 AttributeSystem 提供 getFinalValue / getModifierContributions。
 */
export class Attribute {
    constructor(
        public base: Record<string, number> = {},
        public modifiers: AttributeModifier[] = [],
    ) {}
}
