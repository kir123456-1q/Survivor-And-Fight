import { EcsWorld } from './World';
import type { System } from './System';

class Position {
    constructor(public x = 0, public y = 0) {}
}

class Velocity {
    constructor(public vx = 0, public vy = 0) {}
}

class Marker {}

class TraceSystem implements System {
    constructor(
        private readonly trace: string[],
        private readonly name: string,
        public readonly group: 'input' | 'logic' | 'physics' | 'render',
        public readonly priority: number,
    ) {}

    update(): void {
        this.trace.push(this.name);
    }
}

function assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(message);
}

function main(): void {
    const world = new EcsWorld();

    const e1 = world.createEntity();
    const e2 = world.createEntity();
    world.destroyEntity(e1);
    const e3 = world.createEntity();
    assert(e3 === e1, 'Entity id should be reused after destroy');

    world.addComponent(e2, Position, new Position(10, 20));
    world.addComponent(e2, Velocity, new Velocity(1, 2));
    assert(world.getComponentTypes(e2).size === 2, 'Entity should track component types');
    assert(world.getEntitiesWith([Position]).includes(e2), 'Single type query should find entity');
    assert(world.getEntitiesWith([Position, Velocity]).includes(e2), 'Multi type query should find entity');

    world.destroyEntity(e2);
    assert(!world.entities.isAlive(e2), 'Destroyed entity should not be alive');
    assert(world.getComponent(e2, Position) == null, 'Destroyed entity should not keep components');
    assert(world.getComponentTypes(e2).size === 0, 'Destroyed entity should clear component type index');

    const e4 = world.createEntity();
    world.addComponent(e4, Marker, new Marker());
    const trace: string[] = [];
    world.registerSystem(new TraceSystem(trace, 'logic-low', 'logic', 0));
    world.registerSystem(new TraceSystem(trace, 'input', 'input', 0));
    world.registerSystem(new TraceSystem(trace, 'logic-high', 'logic', 10));
    world.registerSystem(new TraceSystem(trace, 'render', 'render', 0));
    world.update(0.016);

    assert(trace.join(',') === 'input,logic-high,logic-low,render', 'System order should follow group and priority');

    console.log('ecsCorePhase1.verify OK');
}

main();
