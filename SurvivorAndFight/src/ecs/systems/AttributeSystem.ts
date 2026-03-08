import type { EntityId } from '../core/EntityManager';
import type { EcsWorld } from '../core/World';
import { System } from '../core/System';
import { Attribute, type AttributeModifier } from '../components/Attribute';

/**
 * 属性合并顺序：先加算后乘算。base + sum(add) 再 * product(multiply).
 * 提供 getFinalValue、addModifier、removeModifiersBySource、getModifierContributions 供外部调用。
 */
export class AttributeSystem implements System {
    readonly group = 'logic' as const;
    readonly priority = -1;

    constructor(private readonly world: EcsWorld) {}

    update(_deltaTime: number): void {
        // 按需计算，无每帧缓存；getFinalValue 实时合并
    }

    getFinalValue(entityId: EntityId, key: string): number {
        const attr = this.world.getComponent(entityId, Attribute);
        if (!attr) return 0;
        let value = attr.base[key] ?? 0;
        const adds: AttributeModifier[] = [];
        const muls: AttributeModifier[] = [];
        for (const m of attr.modifiers) {
            if (m.key !== key) continue;
            if (m.type === 'add') adds.push(m);
            else muls.push(m);
        }
        for (const m of adds) value += m.value;
        for (const m of muls) value *= m.value;
        return value;
    }

    getModifierContributions(entityId: EntityId, key: string): { sourceId: string; value: number }[] {
        const attr = this.world.getComponent(entityId, Attribute);
        if (!attr) return [];
        return attr.modifiers
            .filter((m) => m.key === key)
            .map((m) => ({ sourceId: m.sourceId, value: m.value }));
    }

    addModifier(entityId: EntityId, mod: AttributeModifier): void {
        const attr = this.world.getComponent(entityId, Attribute);
        if (!attr) return;
        attr.modifiers.push(mod);
    }

    removeModifiersBySource(entityId: EntityId, sourceId: string): void {
        const attr = this.world.getComponent(entityId, Attribute);
        if (!attr) return;
        attr.modifiers = attr.modifiers.filter((m) => m.sourceId !== sourceId);
    }
}
