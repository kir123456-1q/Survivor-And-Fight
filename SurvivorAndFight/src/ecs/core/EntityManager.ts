export type EntityId = number;

/**
 * Manages entity lifecycle and tracks which component types are attached.
 * Component data itself is stored in separate per-type containers.
 */
export class EntityManager {
    private nextId: EntityId = 1;
    private readonly freeIds: EntityId[] = [];
    private readonly aliveEntities = new Set<EntityId>();
    private readonly entityComponents = new Map<EntityId, Set<Function>>();

    createEntity(): EntityId {
        const id = this.freeIds.length > 0 ? (this.freeIds.pop() as EntityId) : this.nextId++;
        this.aliveEntities.add(id);
        if (!this.entityComponents.has(id)) {
            this.entityComponents.set(id, new Set());
        }
        return id;
    }

    destroyEntity(id: EntityId): void {
        if (!this.aliveEntities.has(id)) return;
        this.aliveEntities.delete(id);
        this.freeIds.push(id);
        // Actual component instances are removed by the component store;
        // we only clear the type set here.
        this.entityComponents.delete(id);
    }

    isAlive(id: EntityId): boolean {
        return this.aliveEntities.has(id);
    }

    /** Internal: track that an entity now has a component of given type. */
    markHasComponent(id: EntityId, type: Function): void {
        let set = this.entityComponents.get(id);
        if (!set) {
            set = new Set();
            this.entityComponents.set(id, set);
        }
        set.add(type);
    }

    /** Internal: track that an entity no longer has a component of given type. */
    unmarkHasComponent(id: EntityId, type: Function): void {
        const set = this.entityComponents.get(id);
        if (!set) return;
        set.delete(type);
        if (set.size === 0) {
            this.entityComponents.delete(id);
        }
    }

    /**
     * Returns the set of component constructor functions attached to the entity.
     * A new Set is returned to avoid external mutation of internal state.
     */
    getComponentTypes(id: EntityId): Set<Function> {
        const set = this.entityComponents.get(id);
        return set ? new Set(set) : new Set();
    }

    /** Returns all currently alive entity ids. */
    getAllEntities(): EntityId[] {
        return Array.from(this.aliveEntities);
    }
}

