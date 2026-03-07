import { EcsWorld } from '../../ecs/core/World';
import { Position, Velocity, Rotation, ViewComponent, Tag } from '../../ecs/components/TransformComponents';
import { MovementSystem } from '../../ecs/systems/MovementSystem';
import { RotationSystem } from '../../ecs/systems/RotationSystem';
import { ViewSyncSystem } from '../../ecs/systems/ViewSyncSystem';

/**
 * SimpleEcsDemo sets up a minimal scene with a handful of entities
 * that move and rotate, to validate the ECS core and Laya bindings.
 * Pass the Scene3D node so 3D meshes are added to the scene; otherwise falls back to 2D sprites.
 */
export class SimpleEcsDemo {
    readonly world = new EcsWorld();
    private readonly scene3D: Laya.Scene3D | null;

    constructor(scene3D?: Laya.Scene3D | null) {
        this.scene3D = scene3D ?? null;
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
        if (this.scene3D) {
            const mesh = Laya.PrimitiveMesh.createSphere(0.2);
            const meshSprite = new Laya.MeshSprite3D(mesh);
            this.scene3D.addChild(meshSprite);
            return meshSprite;
        }
        const sprite2D = new Laya.Sprite();
        sprite2D.graphics.drawCircle(0, 0, 5, '#ffcc00');
        Laya.stage.addChild(sprite2D);
        return sprite2D;
    }

    update(deltaTime: number): void {
        this.world.update(deltaTime);
    }
}

