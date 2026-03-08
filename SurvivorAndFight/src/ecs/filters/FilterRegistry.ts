import type { EntityId } from '../core/EntityManager';
import type { EcsWorld } from '../core/World';

type ComponentType = new (...args: any[]) => any;

/**
 * 按组件组合查询实体。返回拥有全部指定组件类型的实体 ID 列表。
 * 与 ecs-core 的按组件类型遍历能力对齐。
 */
export class FilterRegistry {
    private readonly named = new Map<string, ComponentType[]>();

    constructor(private readonly world: EcsWorld) {}

    /**
     * 返回拥有全部指定组件类型的实体 ID 列表。
     */
    query(componentTypes: readonly ComponentType[]): EntityId[] {
        if (componentTypes.length === 0) return [];
        const [first, ...rest] = componentTypes;
        const pairs = this.world.getAllOfType(first);
        const result: EntityId[] = [];
        for (const [entity] of pairs) {
            let hasAll = true;
            for (const type of rest) {
                if (!this.world.getComponent(entity, type)) {
                    hasAll = false;
                    break;
                }
            }
            if (hasAll) result.push(entity);
        }
        return result;
    }

    registerNamedFilter(name: string, componentTypes: readonly ComponentType[]): void {
        this.named.set(name, [...componentTypes]);
    }

    getNamedFilter(name: string): EntityId[] {
        const types = this.named.get(name);
        if (!types) return [];
        return this.query(types);
    }
}
