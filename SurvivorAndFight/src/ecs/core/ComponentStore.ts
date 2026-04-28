import { EntityId, EntityManager } from './EntityManager';

type ComponentCtor<T> = new (...args: any[]) => T;

/**
 * Stores component instances grouped by component type, then by EntityId.
 * This matches the spec requirement of "以组件类型为维度的存储结构" and
 * allows efficient iteration over all entities that have a given component.
 */
export class ComponentStore {
    private readonly store = new Map<Function, Map<EntityId, unknown>>();

    constructor(private readonly entities: EntityManager) {}

    addComponent<T>(entity: EntityId, type: ComponentCtor<T>, instance: T): void {
        if (!this.entities.isAlive(entity)) return;
        let bucket = this.store.get(type);
        if (!bucket) {
            bucket = new Map<EntityId, unknown>();
            this.store.set(type, bucket);
        }
        bucket.set(entity, instance);
        this.entities.markHasComponent(entity, type);
    }

    removeComponent<T>(entity: EntityId, type: ComponentCtor<T>): void {
        const bucket = this.store.get(type);
        if (!bucket) return;
        bucket.delete(entity);
        this.entities.unmarkHasComponent(entity, type);
    }

    getComponent<T>(entity: EntityId, type: ComponentCtor<T>): T | undefined {
        const bucket = this.store.get(type);
        if (!bucket) return undefined;
        return bucket.get(entity) as T | undefined;
    }

    /**
     * Returns an array view of [entityId, component] pairs for a given type.
     * This provides the "按组件类型遍历实体" capability.
     */
    getAllOfType<T>(type: ComponentCtor<T>): Array<[EntityId, T]> {
        const bucket = this.store.get(type);
        if (!bucket) return [];
        const result: Array<[EntityId, T]> = [];
        bucket.forEach((value, id) => {
            result.push([id, value as T]);
        });
        return result;
    }

    /**
     * Removes all components attached to an entity.
     * Used by world.destroyEntity to satisfy "销毁实体时移除其所有组件".
     */
    removeAllComponents(entity: EntityId): void {
        for (const [type, bucket] of this.store) {
            if (!bucket.has(entity)) continue;
            bucket.delete(entity);
            this.entities.unmarkHasComponent(entity, type);
            if (bucket.size === 0) {
                this.store.delete(type);
            }
        }
    }

    /**
     * Minimal multi-component query helper for future systems.
     * MVP keeps this simple and map-based.
     */
    getEntitiesWith(types: Function[]): EntityId[] {
        if (types.length === 0) return [];
        const buckets = types
            .map((type) => this.store.get(type))
            .filter((bucket): bucket is Map<EntityId, unknown> => !!bucket);
        if (buckets.length !== types.length) return [];

        const [smallest, ...rest] = buckets.sort((a, b) => a.size - b.size);
        const result: EntityId[] = [];
        for (const entityId of smallest.keys()) {
            if (rest.every((bucket) => bucket.has(entityId))) {
                result.push(entityId);
            }
        }
        return result;
    }
}

