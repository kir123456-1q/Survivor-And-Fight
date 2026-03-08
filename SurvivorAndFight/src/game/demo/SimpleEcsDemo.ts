import { EcsWorld } from '../../ecs/core/World';
import { Position, Velocity, Rotation, ViewComponent } from '../../ecs/components/TransformComponents';
import { PlayerTag } from '../../ecs/components/PlayerTag';
import { MonsterTag } from '../../ecs/components/MonsterTag';
import { Attribute } from '../../ecs/components/Attribute';
import { Skill } from '../../ecs/components/Skill';
import { Control } from '../../ecs/components/Control';
import { MovementSystem } from '../../ecs/systems/MovementSystem';
import { RotationSystem } from '../../ecs/systems/RotationSystem';
import { ViewSyncSystem } from '../../ecs/systems/ViewSyncSystem';
import { AttributeSystem } from '../../ecs/systems/AttributeSystem';
import { FilterRegistry } from '../../ecs/filters/FilterRegistry';
import { registerNamedFilters } from '../../ecs/filters/NamedFilters';
import type { MonsterPool } from '../monster/MonsterPool';
import {
    DEFAULT_PLAYER_HP,
    DEFAULT_PLAYER_MAX_HP,
    DEFAULT_MONSTER_HP,
    DEFAULT_MONSTER_MAX_HP,
    DEFAULT_PLAYER_PREFAB,
    DEFAULT_MONSTER_PREFAB,
    MONSTER_SPAWN_RADIUS,
    MONSTER_COUNT,
    PLACEHOLDER_RADIUS,
} from '../../defines';

function getCharacterRow(roleType: 'player' | 'monster'): Record<string, unknown> | undefined {
    const Data = (globalThis as any).Data;
    if (!Data?.Character?.GetByID) return undefined;
    return Data.Character.GetByID(roleType) as Record<string, unknown> | undefined;
}

/**
 * 按配表（Data.Character）的 prefabPath 加载预制体并生成角色与怪物（2D）。
 * 须先初始化 Data（initData）并确保 Character 表已加载；预制体通过 Laya.Prefab.instantiate 按路径加载。
 * container：2D 根容器（如 Laya.Sprite），为 null 时使用 Laya.stage。
 */
export class SimpleEcsDemo {
    readonly world = new EcsWorld();
    private readonly container: any;
    private readonly filters: FilterRegistry;
    private readonly monsterPool: MonsterPool | null;
    private initDone = false;

    constructor(container?: any, monsterPool?: MonsterPool | null) {
        this.container = container ?? null;
        this.monsterPool = monsterPool ?? null;
        this.filters = new FilterRegistry(this.world);
        registerNamedFilters(this.filters);
        this.setupSystems();
    }

    /**
     * 异步加载配表指定的预制体并生成玩家与怪物。在 Main 中于 new SimpleEcsDemo 后调用。
     */
    async init(): Promise<void> {
        if (this.initDone) return;
        await this.spawnPlayer();
        await this.spawnMonsters(MONSTER_COUNT);
        this.initDone = true;
    }

    private setupSystems(): void {
        this.world.registerSystem(new MovementSystem(this.world), 'logic', 0);
        this.world.registerSystem(new RotationSystem(this.world), 'logic', -1);
        this.world.registerSystem(new AttributeSystem(this.world), 'logic', -1);
        this.world.registerSystem(new ViewSyncSystem(this.world), 'render', 0);
    }

    private async spawnPlayer(): Promise<void> {
        const entity = this.world.createEntity();
        const row = getCharacterRow('player');
        const hp = (row?.hp as number) ?? DEFAULT_PLAYER_HP;
        const maxHp = (row?.maxHp as number) ?? DEFAULT_PLAYER_MAX_HP;
        const prefabPath = (row?.prefabPath as string) ?? DEFAULT_PLAYER_PREFAB;

        this.world.addComponent(entity, PlayerTag, new PlayerTag());
        this.world.addComponent(entity, Position, new Position(0, 0, 0)); // 2D: z=0
        this.world.addComponent(entity, Velocity, new Velocity(0, 0, 0));
        this.world.addComponent(entity, Rotation, new Rotation());
        this.world.addComponent(entity, Attribute, new Attribute({ hp, maxHp }));
        this.world.addComponent(entity, Skill, new Skill(null, {}));
        this.world.addComponent(entity, Control, new Control());

        let node = await this.instantiateCharacterNode(prefabPath);
        if (!node) node = this.createPlaceholderNode();
        const parent = this.container ?? Laya.stage;
        if (node && parent) parent.addChild(node);
        this.world.addComponent(entity, ViewComponent, new ViewComponent(entity, node));
    }

    private async spawnMonsters(count: number): Promise<void> {
        const row = getCharacterRow('monster');
        const hp = (row?.hp as number) ?? DEFAULT_MONSTER_HP;
        const maxHp = (row?.maxHp as number) ?? DEFAULT_MONSTER_MAX_HP;
        const prefabPath = (row?.prefabPath as string) ?? DEFAULT_MONSTER_PREFAB;

        for (let i = 0; i < count; i++) {
            const entity = this.world.createEntity();
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
            const r = MONSTER_SPAWN_RADIUS * (0.6 + Math.random() * 0.4);
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;

            this.world.addComponent(entity, MonsterTag, new MonsterTag());
            this.world.addComponent(entity, Position, new Position(x, y, 0));
            this.world.addComponent(entity, Velocity, new Velocity(0, 0, 0));
            this.world.addComponent(entity, Rotation, new Rotation());
            this.world.addComponent(entity, Attribute, new Attribute({ hp, maxHp }));
            this.world.addComponent(entity, Skill, new Skill(null, {}));

            let node: any = this.monsterPool?.get() ?? null;
            if (!node) node = await this.instantiateCharacterNode(prefabPath);
            if (!node) node = this.createPlaceholderNode();
            const parent = this.container ?? Laya.stage;
            if (node && parent) parent.addChild(node);
            this.world.addComponent(entity, ViewComponent, new ViewComponent(entity, node));
        }
    }

    /**
     * 按配表预制体路径实例化节点；失败时返回 null。
     */
    private async instantiateCharacterNode(prefabPath: string): Promise<any> {
        try {
            const node = await Laya.Prefab.instantiate(prefabPath);
            return node;
        } catch (e) {
            console.warn('SimpleEcsDemo: prefab load failed, path=', prefabPath, e);
            return null;
        }
    }

    /** 预制体加载失败时的占位节点（2D 圆）。 */
    private createPlaceholderNode(): any {
        const sprite = new Laya.Sprite();
        const r = Math.max(6, PLACEHOLDER_RADIUS * 20);
        sprite.graphics.drawCircle(0, 0, r, '#888888');
        return sprite;
    }

    update(deltaTime: number): void {
        this.world.update(deltaTime);
    }

    getWorld(): EcsWorld {
        return this.world;
    }

    getFilters(): FilterRegistry {
        return this.filters;
    }

    isInitDone(): boolean {
        return this.initDone;
    }

    /** 获取玩家实体位置（2D：x, y），无玩家或未初始化时返回 null。用于相机跟随等。 */
    getPlayerPosition(): { x: number; y: number } | null {
        const players = this.filters.getNamedFilter('Players');
        if (players.length === 0) return null;
        const pos = this.world.getComponent(players[0], Position);
        if (!pos) return null;
        return { x: pos.x, y: pos.y ?? 0 };
    }
}
