import { EcsWorld } from '../../ecs/core/World';
import { Position, Velocity, Rotation, ViewComponent, Tag } from '../../ecs/components/TransformComponents';
import { MovementSystem } from '../../ecs/systems/MovementSystem';
import { RotationSystem } from '../../ecs/systems/RotationSystem';
import { ViewSyncSystem } from '../../ecs/systems/ViewSyncSystem';

/**
 * SimpleEcsDemo sets up a minimal scene with a handful of entities
 * that move and rotate, to validate the ECS core and Laya bindings.
 */
export class SimpleEcsDemo {
    readonly world = new EcsWorld();

    constructor() {
        this.setupSystems();
        this.spawnEntities(32);
    }

    private setupSystems(): void {
        this.world.registerSystem(new MovementSystem(this.world), 'logic', 0);
        this.world.registerSystem(new RotationSystem(this.world), 'logic', -1);
        this.world.registerSystem(new ViewSyncSystem(this.world), 'render', 0);
    }

    private spawnEntities(count: number): void {
        for (let i = 0; i < count; i++) {
            const entity = this.world.createEntity();

            const x = (Math.random() - 0.5) * 10;
            const z = (Math.random() - 0.5) * 10;
            const y = 0;

            this.world.addComponent(entity, Position, new Position(x, y, z));
            this.world.addComponent(entity, Velocity, new Velocity(
                (Math.random() - 0.5) * 2,
                0,
                (Math.random() - 0.5) * 2,
            ));
            this.world.addComponent(entity, Rotation, new Rotation());
            this.world.addComponent(entity, Tag, new Tag('demo'));

            const node = this.createVisualNode();
            this.world.addComponent(entity, ViewComponent, new ViewComponent(entity, node));
        }
    }

    private createVisualNode(): any {
        // MVP：先全部用 2D 精灵，避免错误地把 3D 节点挂到 stage 上导致 _addRenderObject 异常。
        const sprite2D = new Laya.Sprite();
        sprite2D.graphics.drawCircle(0, 0, 5, '#ffcc00');
        Laya.stage.addChild(sprite2D);
        return sprite2D;
    }

    update(deltaTime: number): void {
        this.world.update(deltaTime);
    }
}

