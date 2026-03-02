export type SystemGroup = 'input' | 'logic' | 'physics' | 'render';

/**
 * Base interface for all ECS systems.
 * Systems are expected to be lightweight and injected with the world
 * or entity manager they operate on.
 */
export interface System {
    /**
     * Optional group hint to control coarse execution order.
     * Groups are ordered as: input -> logic -> physics -> render.
     */
    readonly group?: SystemGroup;

    /**
     * Optional fine-grained priority within the same group.
     * Higher priority systems run earlier.
     */
    readonly priority?: number;

    /**
     * Update hook called once per frame.
     * @param deltaTime Seconds elapsed since last frame.
     */
    update(deltaTime: number): void;
}

