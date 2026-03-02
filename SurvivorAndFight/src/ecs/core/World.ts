import { EntityManager, EntityId } from './EntityManager';
import { ComponentStore } from './ComponentStore';
import { System, SystemGroup } from './System';

interface RegisteredSystem {
    system: System;
    group: SystemGroup;
    priority: number;
}

/**
 * EcsWorld is the main façade used by game code.
 * It coordinates entities, components, and systems, and exposes a single
 * update(deltaTime) entry point to be called from the Laya main loop.
 */
export class EcsWorld {
    readonly entities = new EntityManager();
    readonly components = new ComponentStore(this.entities);

    private systems: RegisteredSystem[] = [];

    createEntity(): EntityId {
        return this.entities.createEntity();
    }

    destroyEntity(id: EntityId): void {
        this.entities.destroyEntity(id);
        // ComponentStore relies on destroy/remove being called explicitly;
        // for MVP we don't auto-scan all component buckets here.
    }

    addComponent<T>(entity: EntityId, type: new (...args: any[]) => T, instance: T): void {
        this.components.addComponent(entity, type, instance);
    }

    removeComponent<T>(entity: EntityId, type: new (...args: any[]) => T): void {
        this.components.removeComponent(entity, type);
    }

    getComponent<T>(entity: EntityId, type: new (...args: any[]) => T): T | undefined {
        return this.components.getComponent(entity, type);
    }

    getComponentTypes(entity: EntityId): Set<Function> {
        return this.entities.getComponentTypes(entity);
    }

    getAllOfType<T>(type: new (...args: any[]) => T): Array<[EntityId, T]> {
        return this.components.getAllOfType(type);
    }

    registerSystem(system: System, group: SystemGroup = 'logic', priority = 0): void {
        this.systems.push({ system, group, priority });
        this.sortSystems();
    }

    update(deltaTime: number): void {
        for (const { system } of this.systems) {
            system.update(deltaTime);
        }
    }

    private sortSystems(): void {
        const groupOrder: SystemGroup[] = ['input', 'logic', 'physics', 'render'];
        const groupIndex = (g: SystemGroup) => groupOrder.indexOf(g);

        this.systems.sort((a, b) => {
            const ga = groupIndex(a.group);
            const gb = groupIndex(b.group);
            if (ga !== gb) return ga - gb;
            return (b.priority ?? 0) - (a.priority ?? 0);
        });
    }
}

