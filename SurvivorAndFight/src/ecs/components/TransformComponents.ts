import type { EntityId } from '../core/EntityManager';

export class Position {
    constructor(
        public x: number = 0,
        public y: number = 0,
        public z: number = 0,
    ) {}
}

export class Velocity {
    constructor(
        public vx: number = 0,
        public vy: number = 0,
        public vz: number = 0,
    ) {}
}

export class Rotation {
    constructor(
        public yaw: number = 0,
        public pitch: number = 0,
        public roll: number = 0,
    ) {}
}

/**
 * ViewComponent binds an entity to a Laya visual node.
 * We intentionally type the node as `any` to avoid requiring the full Laya
 * TypeScript definitions in this MVP.
 */
export class ViewComponent {
    constructor(
        public readonly entity: EntityId,
        public node: any, // e.g. Laya.Sprite3D or Laya.Sprite
    ) {}
}

/** Simple tag component for filtering entities (e.g. player/enemy). */
export class Tag {
    constructor(public readonly name: string) {}
}

