import type { EntityId } from '../../ecs/core/EntityManager';
import type { EcsWorld } from '../../ecs/core/World';
import { System } from '../../ecs/core/System';
import { Position } from '../../ecs/components/TransformComponents';
import { Attribute } from '../../ecs/components/Attribute';
import { PlayerTag } from '../../ecs/components/PlayerTag';
import { MonsterTag } from '../../ecs/components/MonsterTag';
import type { BulletPool } from './BulletPool';
import { HIT_RADIUS, BULLET_PREFAB_2D, BULLET_3D_PATHS_TO_2D, COMBAT_DEBUG_LOG } from '../../defines';

export type GetBulletRowFn = (id: string) => Record<string, unknown> | undefined;
export type InstantiateBulletFn = (prefabPath: string) => any;

interface BulletInstance {
    bulletId: string;
    node: any;
    prefabPath: string;
    x: number;
    y: number;
    z: number;
    dir: { x: number; y: number; z: number };
    speed: number;
    damage: number;
    penetration: number;
    ownerType: string;
    age: number;
    duration: number;
    splitCount: number;
    splitRemaining: number;
    collisionDelay: number;
}

/**
 * 子弹系统：实例化或从子弹池取节点、飞行、基于距离的碰撞检测与阵营过滤。
 * 可选 bulletPool：回收时节点回池而非销毁，spawn 时优先从池中取。
 * 玩家子弹仅对 MonsterTag 生效，怪物子弹仅对 PlayerTag 生效。
 */
export class BulletSystem implements System {
    readonly group = 'logic' as const;
    readonly priority = 1;

    private readonly bullets: BulletInstance[] = [];
    private spawnLogCount = 0;
    private hitLogCount = 0;

    constructor(
        private readonly world: EcsWorld,
        private readonly sceneParent: any,
        private readonly getBulletRow: GetBulletRowFn,
        private readonly instantiateBullet: InstantiateBulletFn,
        private readonly bulletPool?: BulletPool,
        private readonly isPaused?: () => boolean,
    ) {}

    /**
     * 根据子弹表 id 生成子弹，position 与 direction 为世界坐标/方向，ownerType 为 "player" | "monster"。
     */
    spawnBullet(bulletId: string, position: { x: number; y: number; z?: number }, direction: { x: number; y: number; z?: number }, ownerType: string): void {
        this.spawnBulletWithOptions(bulletId, position, direction, ownerType, {});
    }

    spawnBulletWithOptions(
        bulletId: string,
        position: { x: number; y: number; z?: number },
        direction: { x: number; y: number; z?: number },
        ownerType: string,
        options: {
            damageScale?: number;
            splitCount?: number;
            splitRemaining?: number;
            collisionDelaySec?: number;
        },
    ): void {
        const row = this.getBulletRow(bulletId);
        if (!row) {
            if (COMBAT_DEBUG_LOG && this.spawnLogCount < 40) {
                this.spawnLogCount += 1;
                console.log('[BulletSystem] bullet row not found', { bulletId, ownerType });
            }
            return;
        }
        let prefabPath = (row.prefabPath as string) ?? BULLET_PREFAB_2D;
        if (BULLET_3D_PATHS_TO_2D[prefabPath]) prefabPath = BULLET_3D_PATHS_TO_2D[prefabPath];
        const duration = Number(row.duration) || 2;
        const speed = Number(row.speed) || 10;
        const damage = (Number(row.damage) || 5) * (options.damageScale ?? 1);
        const penetration = Number(row.penetration) ?? 0;
        const node = this.bulletPool?.get(prefabPath) ?? this.instantiateBullet(prefabPath);
        if (!node) return;
        const len = Math.sqrt(direction.x * direction.x + direction.y * direction.y) || 1;
        const dir = {
            x: direction.x / len,
            y: direction.y / len,
            z: 0,
        };
        if (typeof (node as any)?.then === 'function') {
            (node as Promise<any>).then((resolvedNode) => {
                if (!resolvedNode) return;
                this.addBulletInstance(
                    bulletId,
                    resolvedNode,
                    prefabPath,
                    position,
                    dir,
                    speed,
                    damage,
                    penetration,
                    ownerType,
                    duration,
                    options.splitCount ?? 0,
                    options.splitRemaining ?? 0,
                    options.collisionDelaySec ?? 0,
                );
            }).catch(() => {});
            return;
        }
        this.addBulletInstance(
            bulletId,
            node,
            prefabPath,
            position,
            dir,
            speed,
            damage,
            penetration,
            ownerType,
            duration,
            options.splitCount ?? 0,
            options.splitRemaining ?? 0,
            options.collisionDelaySec ?? 0,
        );
    }

    private addBulletInstance(
        bulletId: string,
        node: any,
        prefabPath: string,
        position: { x: number; y: number; z?: number },
        dir: { x: number; y: number; z: number },
        speed: number,
        damage: number,
        penetration: number,
        ownerType: string,
        duration: number,
        splitCount: number,
        splitRemaining: number,
        collisionDelay: number,
    ): void {
        if (this.sceneParent && node.parent !== this.sceneParent) {
            this.sceneParent.addChild(node);
        }
        const x = position.x, y = position.y ?? 0;
        try {
            const tr = node && (node as any).transform;
            if (tr && tr.position) {
                const pos = tr.position;
                if (typeof pos.set === 'function') pos.set(x, y, 0);
                else { pos.x = x; pos.y = y; if ('z' in pos) pos.z = 0; }
            } else if (node && typeof (node as any).x === 'number') { (node as any).x = x; (node as any).y = y; }
        } catch (_) {
            if (node && typeof (node as any).x === 'number') { (node as any).x = x; (node as any).y = y; }
        }
        this.applyBulletFacing(node, dir);
        this.bullets.push({
            bulletId,
            node,
            prefabPath,
            x: position.x,
            y: position.y ?? 0,
            z: 0,
            dir,
            speed,
            damage,
            penetration,
            ownerType,
            age: 0,
            duration,
            splitCount,
            splitRemaining,
            collisionDelay,
        });
        if (COMBAT_DEBUG_LOG && this.spawnLogCount < 40) {
            this.spawnLogCount += 1;
            console.log('[BulletSystem] bullet spawned', {
                prefabPath,
                speed,
                damage,
                penetration,
                ownerType,
                x: position.x,
                y: position.y ?? 0,
                dir,
                aliveCount: this.bullets.length,
            });
        }
    }

    update(deltaTime: number): void {
        if (this.isPaused?.()) return;
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.x += b.dir.x * b.speed * deltaTime;
            b.y += b.dir.y * b.speed * deltaTime;
            b.age += deltaTime;
            if (b.collisionDelay > 0) {
                b.collisionDelay = Math.max(0, b.collisionDelay - deltaTime);
            }
            const n = b.node;
            try {
                const tr = n && (n as any).transform;
                if (tr && tr.position) {
                    const p = tr.position;
                    if (typeof p.set === 'function') p.set(b.x, b.y, 0);
                    else { p.x = b.x; p.y = b.y; if ('z' in p) p.z = 0; }
                } else if (n && typeof (n as any).x === 'number') {
                    (n as any).x = b.x;
                    (n as any).y = b.y;
                }
            } catch (_) {
                if (n && typeof (n as any).x === 'number') { (n as any).x = b.x; (n as any).y = b.y; }
            }
            if (b.age >= b.duration) {
                this.destroyBullet(b);
                this.bullets.splice(i, 1);
                continue;
            }
            const hits = b.collisionDelay > 0 ? [] : this.getHits(b);
            for (const eid of hits) {
                if (b.penetration < 0) break;
                const hitPos = this.world.getComponent(eid, Position);
                const attr = this.world.getComponent(eid, Attribute);
                if (attr && typeof attr.base.hp === 'number') {
                    attr.base.hp = Math.max(0, attr.base.hp - b.damage);
                    if (COMBAT_DEBUG_LOG && this.hitLogCount < 80) {
                        this.hitLogCount += 1;
                        console.log('[BulletSystem] hit target', {
                            target: eid,
                            ownerType: b.ownerType,
                            damage: b.damage,
                            targetHp: attr.base.hp,
                            penetrationLeftBeforeDec: b.penetration,
                        });
                    }
                }
                if (hitPos && b.splitCount > 0 && b.splitRemaining > 0) {
                    this.spawnSplitBullets(b, { x: hitPos.x, y: hitPos.y ?? 0 });
                }
                b.penetration--;
            }
            if (b.penetration < 0) {
                this.destroyBullet(b);
                this.bullets.splice(i, 1);
            }
        }
    }

    private spawnSplitBullets(parent: BulletInstance, hitPos: { x: number; y: number }): void {
        // Rule: splitCount=1 means spawn 2 bullets (same as parent bullet),
        // then distribute evenly within [-60°, +60°] around parent direction.
        const splitLevel = Math.max(0, Math.round(parent.splitCount));
        const cnt = splitLevel + 1;
        if (cnt <= 0) return;
        const remaining = parent.splitRemaining - 1;
        const baseAngle = Math.atan2(parent.dir.y, parent.dir.x);
        const spreadRad = 120 * Math.PI / 180;
        const start = baseAngle - spreadRad * 0.5;
        const step = cnt > 1 ? spreadRad / (cnt - 1) : 0;
        for (let i = 0; i < cnt; i++) {
            const a = start + step * i;
            const dir = { x: Math.cos(a), y: Math.sin(a), z: 0 };
            this.spawnBulletWithOptions(parent.bulletId, {
                x: hitPos.x,
                y: hitPos.y,
                z: 0,
            }, dir, parent.ownerType, {
                damageScale: 1,
                splitCount: parent.splitCount,
                splitRemaining: remaining,
                // Spawned at hit point: arm collision shortly after launch
                // to avoid immediate self-collision disappearance.
                collisionDelaySec: 0.06,
            });
        }
    }

    private destroyBullet(b: BulletInstance): void {
        if (this.bulletPool && b.node) {
            this.bulletPool.put(b.prefabPath, b.node);
        } else if (b.node && b.node.destroy) {
            b.node.destroy();
        } else if (b.node && b.node.parent) {
            b.node.parent.removeChild(b.node);
        }
    }

    private getHits(b: BulletInstance): EntityId[] {
        const out: EntityId[] = [];
        const targets = this.getTargets();
        for (const [eid, pos] of targets) {
            if (b.ownerType === 'player' && !this.world.getComponent(eid, MonsterTag)) continue;
            if (b.ownerType === 'monster' && !this.world.getComponent(eid, PlayerTag)) continue;
            const dx = b.x - pos.x;
            const dy = b.y - (pos.y ?? 0);
            const d2 = dx * dx + dy * dy;
            if (d2 < HIT_RADIUS * HIT_RADIUS) out.push(eid);
        }
        return out;
    }

    private getTargets(): Array<[EntityId, { x: number; y?: number; z?: number }]> {
        const out: Array<[EntityId, { x: number; y?: number; z?: number }]> = [];
        const posPairs = this.world.getAllOfType(Position);
        for (const [eid, pos] of posPairs) {
            if (this.world.getComponent(eid, PlayerTag) || this.world.getComponent(eid, MonsterTag)) {
                out.push([eid, pos]);
            }
        }
        return out;
    }

    private applyBulletFacing(node: any, dir: { x: number; y: number }): void {
        const angle = Math.atan2(dir.y, dir.x) * 180 / Math.PI;
        try {
            if (node && typeof node.rotation === 'number') {
                node.rotation = angle;
            }
            const tr = node && (node as any).transform;
            if (tr) {
                tr.rotationEuler = new Laya.Vector3(0, 0, angle);
            }
        } catch (_) {
            // ignore orientation failures for node types without rotation support
        }
    }
}
