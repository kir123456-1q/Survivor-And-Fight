import { EcsWorld } from '../../ecs/core/World';
import { Position, Velocity, Rotation, ViewComponent } from '../../ecs/components/TransformComponents';
import { PlayerTag } from '../../ecs/components/PlayerTag';
import { MonsterTag } from '../../ecs/components/MonsterTag';
import { Attribute } from '../../ecs/components/Attribute';
import { Skill } from '../../ecs/components/Skill';
import { Control } from '../../ecs/components/Control';
import { Experience } from '../../ecs/components/Experience';
import { ExperienceReward } from '../../ecs/components/ExperienceReward';
import { MovementSystem } from '../../ecs/systems/MovementSystem';
import { RotationSystem } from '../../ecs/systems/RotationSystem';
import { ViewSyncSystem } from '../../ecs/systems/ViewSyncSystem';
import { AttributeSystem } from '../../ecs/systems/AttributeSystem';
import { BodyUIComponent } from '../../ecs/components/BodyUIComponent';
import { ControlSystem, type ControlInputSource } from '../../ecs/systems/ControlSystem';
import { MonsterChaseSystem } from '../../ecs/systems/MonsterChaseSystem';
import { MonsterContactDamageSystem } from '../../ecs/systems/MonsterContactDamageSystem';
import { MonsterRecycleSystem } from '../../ecs/systems/MonsterRecycleSystem';
import { PlayerDeathSystem } from '../../ecs/systems/PlayerDeathSystem';
import { RestartPanelSystem } from '../../ecs/systems/RestartPanelSystem';
import { BloodBarSyncSystem } from '../ui/BloodBarSyncSystem';
import { SkillSystem } from '../../ecs/systems/SkillSystem';
import { BulletSystem } from '../bullet/BulletSystem';
import { BulletPool } from '../bullet/BulletPool';
import { MonsterPool } from '../monster/MonsterPool';
import { PlayerAutoCastSystem } from '../../ecs/systems/PlayerAutoCastSystem';
import { ExperienceSystem } from '../../ecs/systems/ExperienceSystem';
import { MonsterWaveSpawnSystem } from '../../ecs/systems/MonsterWaveSpawnSystem';
import { FilterRegistry } from '../../ecs/filters/FilterRegistry';
import { registerNamedFilters } from '../../ecs/filters/NamedFilters';
import { GameSession } from '../../ecs/components/GameSession';
import { UIStackManager } from '../ui/mvc/UIStackManager';
import { RESTART_PANEL_ROUTE_ID, RestartPanelController } from '../ui/restart/RestartPanelController';
import { Data } from '../../config/Data';
import { MainHudSystem } from '../ui/MainHudSystem';
import {
    DEFAULT_PLAYER_HP,
    DEFAULT_PLAYER_MAX_HP,
    DEFAULT_MONSTER_HP,
    DEFAULT_MONSTER_MAX_HP,
    DEFAULT_PLAYER_PREFAB,
    DEFAULT_MONSTER_PREFAB,
    MONSTER_SPAWN_RADIUS,
    MONSTER_SPAWN_MIN_DISTANCE,
    MONSTER_COUNT,
    PLACEHOLDER_RADIUS,
    DEFAULT_PLAYER_AUTO_SKILL_ID,
    DEFAULT_PLAYER_AUTO_EFFECT_ID,
    DEFAULT_PLAYER_AUTO_COOLDOWN_SEC,
    DEFAULT_PLAYER_AUTO_BULLET_ID,
    BULLET_PREFAB_2D,
    MONSTER_EXP_REWARD_BASE,
    MONSTER_EXP_REWARD_LEVEL_BONUS,
} from '../../defines';

function getCharacterRow(roleType: 'player' | 'monster'): Record<string, unknown> | undefined {
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
    private readonly attributeSystem: AttributeSystem;
    private readonly bulletPool = new BulletPool();
    private readonly bulletSystem: BulletSystem;
    private readonly skillSystem: SkillSystem;
    private readonly experienceSystem: ExperienceSystem;
    private readonly monsterWaveSpawnSystem: MonsterWaveSpawnSystem;
    private readonly mainHudSystem: MainHudSystem;
    private readonly container: any;
    private readonly filters: FilterRegistry;
    private readonly monsterPool: MonsterPool;
    private readonly controlInput: ControlInputSource | null;
    private readonly sessionEntity: number;
    private readonly uiStack = new UIStackManager();
    private initDone = false;
    private restarting = false;
    private readonly missingConfigLogged = new Set<string>();

    constructor(container?: any, monsterPool?: MonsterPool | null, controlInput?: ControlInputSource | null) {
        this.container = container ?? null;
        this.monsterPool = monsterPool ?? new MonsterPool();
        this.controlInput = controlInput ?? null;
        this.filters = new FilterRegistry(this.world);
        registerNamedFilters(this.filters);
        this.uiStack.register(RESTART_PANEL_ROUTE_ID, () => new RestartPanelController());
        this.sessionEntity = this.world.createEntity();
        this.world.addComponent(this.sessionEntity, GameSession, new GameSession());
        this.attributeSystem = new AttributeSystem(this.world);
        this.experienceSystem = new ExperienceSystem(this.world);
        this.bulletSystem = new BulletSystem(
            this.world,
            this.container ?? Laya.stage,
            (id) => this.getBulletRow(id),
            (prefabPath) => this.instantiateBulletNode(prefabPath),
            this.bulletPool,
            () => this.isPaused(),
        );
        this.skillSystem = new SkillSystem(
            this.world,
            this.attributeSystem,
            this.filters,
            (skillId) => this.getSkillEffects(skillId),
            (skillId) => this.getSkillCooldown(skillId),
            (effectId) => this.getEffectRow(effectId),
            this.bulletSystem,
            (id) => this.getBulletRow(id),
            () => this.isPaused(),
        );
        this.monsterWaveSpawnSystem = new MonsterWaveSpawnSystem(
            this.world,
            this.filters,
            (count, monsterLevel) => this.spawnMonsters(count, monsterLevel),
            () => this.isPaused(),
        );
        this.mainHudSystem = new MainHudSystem(this.world, this.filters, this.container ?? Laya.stage);
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
        const isPaused = () => this.isPaused();
        this.world.registerSystem(new ControlSystem(this.world, this.filters, this.controlInput, isPaused), 'input', 0);
        this.world.registerSystem(new MonsterChaseSystem(this.world, this.filters, isPaused), 'logic', 1);
        this.world.registerSystem(new MovementSystem(this.world, isPaused), 'logic', 0);
        this.world.registerSystem(new RotationSystem(this.world, isPaused), 'logic', -1);
        this.world.registerSystem(this.attributeSystem, 'logic', -1);
        this.world.registerSystem(new PlayerAutoCastSystem(this.world, this.filters, isPaused), 'logic', 3);
        this.world.registerSystem(this.skillSystem, 'logic', 2);
        this.world.registerSystem(this.bulletSystem, 'logic', 1);
        this.world.registerSystem(new MonsterContactDamageSystem(this.world, this.filters, isPaused), 'logic', -5);
        this.world.registerSystem(new MonsterRecycleSystem(this.world, this.filters, this.monsterPool, this.experienceSystem, isPaused), 'logic', -6);
        this.world.registerSystem(this.experienceSystem, 'logic', -7);
        this.world.registerSystem(this.monsterWaveSpawnSystem, 'logic', -8);
        this.world.registerSystem(new PlayerDeathSystem(this.world, this.filters, this.sessionEntity), 'logic', -10);
        this.world.registerSystem(new RestartPanelSystem(this.world, this.sessionEntity, this.uiStack), 'render', 5);
        this.world.registerSystem(this.mainHudSystem, 'render', 20);
        this.world.registerSystem(new ViewSyncSystem(this.world), 'render', 0);
        this.world.registerSystem(new BloodBarSyncSystem(this.world, this.attributeSystem), 'render', -1);
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
        this.world.addComponent(entity, Experience, new Experience(1, 0));
        this.world.addComponent(entity, Skill, new Skill(DEFAULT_PLAYER_AUTO_SKILL_ID, {}));
        this.world.addComponent(entity, Control, new Control());

        let node = await this.instantiateCharacterNode(prefabPath);
        if (!node) node = this.createPlaceholderNode();
        const parent = this.container ?? Laya.stage;
        if (node && parent) parent.addChild(node);
        this.world.addComponent(entity, ViewComponent, new ViewComponent(entity, node));
        this.world.addComponent(entity, BodyUIComponent, new BodyUIComponent(node));
    }

    private async spawnMonsters(count: number, monsterLevel: number = 1): Promise<void> {
        const row = getCharacterRow('monster');
        const hp = (row?.hp as number) ?? DEFAULT_MONSTER_HP;
        const maxHp = (row?.maxHp as number) ?? DEFAULT_MONSTER_MAX_HP;
        const prefabPath = (row?.prefabPath as string) ?? DEFAULT_MONSTER_PREFAB;
        const spawnedPos: Array<{ x: number; y: number }> = [];

        for (let i = 0; i < count; i++) {
            const entity = this.world.createEntity();
            const spawnPos = this.pickMonsterSpawnPosition(i, count, spawnedPos);
            spawnedPos.push(spawnPos);

            this.world.addComponent(entity, MonsterTag, new MonsterTag());
            this.world.addComponent(entity, Position, new Position(spawnPos.x, spawnPos.y, 0));
            this.world.addComponent(entity, Velocity, new Velocity(0, 0, 0));
            this.world.addComponent(entity, Rotation, new Rotation());
            const levelHpScale = 1 + Math.max(0, monsterLevel - 1) * 0.2;
            const scaledMaxHp = Math.round(maxHp * levelHpScale);
            this.world.addComponent(entity, Attribute, new Attribute({
                hp: Math.max(1, Math.round(hp * levelHpScale)),
                maxHp: Math.max(1, scaledMaxHp),
            }));
            this.world.addComponent(entity, ExperienceReward, new ExperienceReward(
                MONSTER_EXP_REWARD_BASE + Math.max(0, monsterLevel - 1) * MONSTER_EXP_REWARD_LEVEL_BONUS,
            ));
            this.world.addComponent(entity, Skill, new Skill(null, {}));

            let node: any = this.monsterPool?.get() ?? null;
            if (!node) node = await this.instantiateCharacterNode(prefabPath);
            if (!node) node = this.createPlaceholderNode();
            this.resetMonsterNodeForSpawn(node);
            const parent = this.container ?? Laya.stage;
            if (node && parent) parent.addChild(node);
            this.world.addComponent(entity, ViewComponent, new ViewComponent(entity, node));
            this.world.addComponent(entity, BodyUIComponent, new BodyUIComponent(node));
        }
    }

    private pickMonsterSpawnPosition(index: number, total: number, existing: Array<{ x: number; y: number }>): { x: number; y: number } {
        let attempts = 0;
        while (attempts < 24) {
            const angle = (index / Math.max(1, total)) * Math.PI * 2 + Math.random() * 0.9 + attempts * 0.13;
            const r = MONSTER_SPAWN_RADIUS * (0.65 + Math.random() * 0.35);
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            if (this.isFarEnoughFromExisting(x, y, existing)) {
                return { x, y };
            }
            attempts += 1;
        }
        const fallback = Math.random() * Math.PI * 2;
        const r = MONSTER_SPAWN_RADIUS;
        return { x: Math.cos(fallback) * r, y: Math.sin(fallback) * r };
    }

    private isFarEnoughFromExisting(x: number, y: number, existing: Array<{ x: number; y: number }>): boolean {
        const minDistSq = MONSTER_SPAWN_MIN_DISTANCE * MONSTER_SPAWN_MIN_DISTANCE;
        for (const p of existing) {
            const dx = x - p.x;
            const dy = y - p.y;
            if (dx * dx + dy * dy < minDistSq) {
                return false;
            }
        }
        return true;
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

    private instantiateBulletNode(prefabPath: string): Promise<any> {
        return Promise.resolve(Laya.Prefab.instantiate(prefabPath)).catch((e: unknown) => {
            console.warn('SimpleEcsDemo: bullet prefab load failed, path=', prefabPath, e);
            const sprite = new Laya.Sprite();
            sprite.graphics.drawCircle(0, 0, 4, '#ffff00');
            return sprite;
        });
    }

    /** 预制体加载失败时的占位节点（2D 圆）。 */
    private createPlaceholderNode(): any {
        const sprite = new Laya.Sprite();
        const r = Math.max(6, PLACEHOLDER_RADIUS * 20);
        sprite.graphics.drawCircle(0, 0, r, '#888888');
        return sprite;
    }

    private resetMonsterNodeForSpawn(node: any): void {
        if (!node) return;
        node.visible = true;
        const bloodBar = node.getChildByName ? node.getChildByName('BloodBar') : null;
        if (bloodBar) {
            bloodBar.visible = true;
            const progress = bloodBar.getChildByName ? bloodBar.getChildByName('ProgressBar') : null;
            if (progress && typeof progress.value !== 'undefined') {
                progress.value = 100;
            }
        }
    }

    update(deltaTime: number): void {
        this.world.update(deltaTime);
        if (!this.restarting) {
            void this.tryRestartFromSession();
        }
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

    destroy(): void {
        void this.uiStack.clearAll();
        this.mainHudSystem.dispose();
        const views = this.world.getAllOfType(ViewComponent);
        for (const [, view] of views) {
            const node = view?.node as any;
            if (node?.destroy) {
                node.destroy();
            } else if (node?.parent?.removeChild) {
                node.parent.removeChild(node);
            }
        }
    }

    /** 获取玩家实体位置（2D：x, y），无玩家或未初始化时返回 null。用于相机跟随等。 */
    getPlayerPosition(): { x: number; y: number } | null {
        const players = this.filters.getNamedFilter('Players');
        if (players.length === 0) return null;
        const pos = this.world.getComponent(players[0], Position);
        if (!pos) return null;
        return { x: pos.x, y: pos.y ?? 0 };
    }

    private isPaused(): boolean {
        const session = this.world.getComponent(this.sessionEntity, GameSession);
        return !!session?.paused;
    }

    private getSkillEffects(skillId: string): string[] | undefined {
        const row = Data?.Skill?.GetByID?.(skillId) as Record<string, unknown> | undefined;
        if (!row) {
            this.logMissingConfigOnce(`Skill:${skillId}`, '[Config] Skill row missing', { skillId });
            if (skillId === DEFAULT_PLAYER_AUTO_SKILL_ID) {
                return [DEFAULT_PLAYER_AUTO_EFFECT_ID];
            }
            return undefined;
        }
        const effects = row.effectIds;
        if (Array.isArray(effects)) {
            return effects.map((v) => String(v)).filter((v) => v.length > 0);
        }
        if (typeof effects === 'string') {
            return effects.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
        }
        this.logMissingConfigOnce(`SkillEffects:${skillId}`, '[Config] Skill.effectIds missing or invalid', {
            skillId,
            effectIds: effects,
        });
        return undefined;
    }

    private getEffectRow(effectId: string): Record<string, unknown> | undefined {
        const row = Data?.SkillEffect?.GetByID?.(effectId) as Record<string, unknown> | undefined;
        if (!row) {
            this.logMissingConfigOnce(`SkillEffect:${effectId}`, '[Config] SkillEffect row missing', { effectId });
            if (effectId === DEFAULT_PLAYER_AUTO_EFFECT_ID) {
                return {
                    id: DEFAULT_PLAYER_AUTO_EFFECT_ID,
                    effect: 'bullet',
                    target: 'auto',
                    bulletSlot: DEFAULT_PLAYER_AUTO_BULLET_ID,
                };
            }
        }
        return row;
    }

    private getSkillCooldown(skillId: string): number | undefined {
        const row = Data?.Skill?.GetByID?.(skillId) as Record<string, unknown> | undefined;
        if (!row) {
            if (skillId === DEFAULT_PLAYER_AUTO_SKILL_ID) return DEFAULT_PLAYER_AUTO_COOLDOWN_SEC;
            return undefined;
        }
        const cd = Number(row.cooldownSec);
        return Number.isFinite(cd) ? cd : undefined;
    }

    private getBulletRow(bulletId: string): Record<string, unknown> | undefined {
        const row = Data?.Bullet?.GetByID?.(bulletId) as Record<string, unknown> | undefined;
        if (!row) {
            this.logMissingConfigOnce(`Bullet:${bulletId}`, '[Config] Bullet row missing', { bulletId });
            if (bulletId === DEFAULT_PLAYER_AUTO_BULLET_ID) {
                return {
                    id: DEFAULT_PLAYER_AUTO_BULLET_ID,
                    prefabPath: BULLET_PREFAB_2D,
                    duration: 2.5,
                    speed: 620,
                    damage: 10,
                    penetration: 0,
                    ownerType: 'player',
                };
            }
        }
        return row;
    }

    private logMissingConfigOnce(key: string, message: string, detail: Record<string, unknown>): void {
        if (this.missingConfigLogged.has(key)) return;
        this.missingConfigLogged.add(key);
        console.warn(message, detail);
    }

    private async tryRestartFromSession(): Promise<void> {
        const session = this.world.getComponent(this.sessionEntity, GameSession);
        if (!session || !session.restartRequested) return;
        this.restarting = true;
        try {
            session.restartRequested = false;
            this.clearAllGameplayEntities();
            session.paused = false;
            this.monsterWaveSpawnSystem.reset();
            await this.spawnPlayer();
            await this.spawnMonsters(MONSTER_COUNT);
        } finally {
            this.restarting = false;
        }
    }

    private clearAllGameplayEntities(): void {
        const all = this.world.entities.getAllEntities();
        for (const entity of all) {
            if (entity === this.sessionEntity) continue;
            const view = this.world.getComponent(entity, ViewComponent);
            const node = view?.node as any;
            if (node?.destroy) {
                node.destroy();
            } else if (node?.parent?.removeChild) {
                node.parent.removeChild(node);
            }
            this.world.destroyEntity(entity);
        }
    }
}
