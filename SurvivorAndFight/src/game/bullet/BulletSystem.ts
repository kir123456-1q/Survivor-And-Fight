import type { EntityId } from '../../ecs/core/EntityManager';
import type { EcsWorld } from '../../ecs/core/World';
import { System } from '../../ecs/core/System';
import { Position } from '../../ecs/components/TransformComponents';
import { Attribute } from '../../ecs/components/Attribute';
import { PlayerTag } from '../../ecs/components/PlayerTag';
import { MonsterTag } from '../../ecs/components/MonsterTag';
import type { BulletPool } from './BulletPool';
import {
    BULLET_PREFAB_2D,
    BULLET_3D_PATHS_TO_2D,
    CHAIN_HIT_RADIUS,
    COMBAT_DEBUG_LOG,
} from '../../defines';
import { hitRadiusSq, segmentHitsCircle } from './BulletHitTest';
import type { CombatDataPrepareSystem } from '../combat/CombatDataPrepareSystem';
import type { CombatBulletSnapshot } from '../combat/CombatDataBridge';
import type { CombatWorkerComputeResponse } from '../combat/combatWorkerProtocol';
import { applyBulletIconSkin } from './BulletVisual';

export type GetBulletRowFn = (id: string) => Record<string, unknown> | undefined;
export type InstantiateBulletFn = (prefabPath: string) => any;

interface BulletInstance {
    bulletId: string;
    node: any;
    prefabPath: string;
    iconPath?: string;
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
    chainCount: number;
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
        private combatPrepare?: CombatDataPrepareSystem,
    ) {}

    setCombatPrepare(prepare: CombatDataPrepareSystem): void {
        this.combatPrepare = prepare;
    }

    collectSnapshots(): CombatBulletSnapshot[] {
        return this.bullets.map((b) => ({
            x: b.x,
            y: b.y,
            dirX: b.dir.x,
            dirY: b.dir.y,
            speed: b.speed,
            age: b.age,
            duration: b.duration,
            penetration: b.penetration,
            ownerSide: b.ownerType === 'player' ? 0 : 1,
            collisionDelay: b.collisionDelay,
        }));
    }

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
            speedScale?: number;
            penetration?: number;
            splitCount?: number;
            splitRemaining?: number;
            chainCount?: number;
            collisionDelaySec?: number;
            damageOverride?: number;
            iconPath?: string;
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
        const speed = (Number(row.speed) || 10) * (options.speedScale ?? 1);
        const baseDamage = options.damageOverride ?? (Number(row.damage) || 5);
        const damage = baseDamage * (options.damageScale ?? 1);
        const penetration = options.penetration ?? (Number(row.penetration) ?? 0);
        const chainCount = Math.max(0, Math.floor(options.chainCount ?? 0));
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
                    chainCount,
                    options.collisionDelaySec ?? 0,
                    options.iconPath,
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
            chainCount,
            options.collisionDelaySec ?? 0,
            options.iconPath,
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
        chainCount: number,
        collisionDelay: number,
        iconPath?: string,
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
        if (iconPath && ownerType === 'player') {
            void applyBulletIconSkin(node, iconPath).catch(() => {});
        }
        this.bullets.push({
            bulletId,
            node,
            prefabPath,
            iconPath,
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
            chainCount,
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

        const frameResult = this.combatPrepare?.getFrameResult();
        const hasChain = this.bullets.some((b) => b.chainCount > 0);
        if (frameResult && !hasChain && this.applyWorkerFrame(frameResult)) {
            return;
        }

        const radiusSq = hitRadiusSq();
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            const prevX = b.x;
            const prevY = b.y;
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
            const hits = b.collisionDelay > 0 ? [] : this.getHits(b, prevX, prevY, radiusSq);
            for (const primaryEid of hits) {
                if (b.penetration < 0) break;
                const chainTargets = this.getChainTargets(b, primaryEid);
                let splitSpawned = false;
                for (const eid of chainTargets) {
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
                                chain: eid !== primaryEid,
                            });
                        }
                    }
                    if (
                        eid === primaryEid &&
                        hitPos &&
                        b.splitCount > 0 &&
                        b.splitRemaining > 0 &&
                        !splitSpawned
                    ) {
                        this.spawnSplitBullets(b, { x: hitPos.x, y: hitPos.y ?? 0 });
                        splitSpawned = true;
                    }
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
                chainCount: 0,
                collisionDelaySec: 0.06,
                iconPath: parent.iconPath,
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

    private applyWorkerFrame(frameResult: CombatWorkerComputeResponse): boolean {
        if (frameResult.bulletX.length !== this.bullets.length) return false;

        for (let i = 0; i < this.bullets.length; i++) {
            const b = this.bullets[i];
            b.x = frameResult.bulletX[i];
            b.y = frameResult.bulletY[i];
            b.age = frameResult.bulletAge[i];
            b.collisionDelay = frameResult.bulletCollisionDelay[i];
            b.penetration = frameResult.bulletPenetration[i];
            this.syncBulletNodePosition(b);
        }

        for (const hit of frameResult.hits) {
            const b = this.bullets[hit.bulletIndex];
            if (!b || b.penetration < 0) continue;
            const chainTargets = this.getChainTargets(b, hit.targetEntityId);
            let splitSpawned = false;
            for (const eid of chainTargets) {
                const hitPos = this.world.getComponent(eid, Position);
                const attr = this.world.getComponent(eid, Attribute);
                if (attr && typeof attr.base.hp === 'number') {
                    attr.base.hp = Math.max(0, attr.base.hp - b.damage);
                }
                if (
                    eid === hit.targetEntityId &&
                    hitPos &&
                    b.splitCount > 0 &&
                    b.splitRemaining > 0 &&
                    !splitSpawned
                ) {
                    this.spawnSplitBullets(b, { x: hitPos.x, y: hitPos.y ?? 0 });
                    splitSpawned = true;
                }
            }
        }

        const expired = [...frameResult.expiredBulletIndices].sort((a, b) => b - a);
        for (const index of expired) {
            const b = this.bullets[index];
            if (!b) continue;
            this.destroyBullet(b);
            this.bullets.splice(index, 1);
        }

        return true;
    }

    private syncBulletNodePosition(b: BulletInstance): void {
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
    }

    private getHits(
        b: BulletInstance,
        prevX: number,
        prevY: number,
        radiusSq: number,
    ): EntityId[] {
        const out: EntityId[] = [];
        const targets = this.getTargets();
        for (const [eid, pos] of targets) {
            if (b.ownerType === 'player' && !this.world.getComponent(eid, MonsterTag)) continue;
            if (b.ownerType === 'monster' && !this.world.getComponent(eid, PlayerTag)) continue;
            const cx = pos.x;
            const cy = pos.y ?? 0;
            if (segmentHitsCircle(prevX, prevY, b.x, b.y, cx, cy, radiusSq)) {
                out.push(eid);
            }
        }
        return out;
    }

    /** 主目标 + 连锁额外目标（按距离排序）。 */
    private getChainTargets(b: BulletInstance, primaryEid: EntityId): EntityId[] {
        const result: EntityId[] = [primaryEid];
        const extra = b.chainCount;
        if (extra <= 0) return result;

        const radiusSq = CHAIN_HIT_RADIUS * CHAIN_HIT_RADIUS;
        const candidates: Array<{ eid: EntityId; d2: number }> = [];
        for (const [eid, pos] of this.getTargets()) {
            if (eid === primaryEid) continue;
            if (b.ownerType === 'player' && !this.world.getComponent(eid, MonsterTag)) continue;
            if (b.ownerType === 'monster' && !this.world.getComponent(eid, PlayerTag)) continue;
            const dx = b.x - pos.x;
            const dy = b.y - (pos.y ?? 0);
            const d2 = dx * dx + dy * dy;
            if (d2 <= radiusSq) candidates.push({ eid, d2 });
        }
        candidates.sort((a, c) => a.d2 - c.d2);
        for (let i = 0; i < extra && i < candidates.length; i++) {
            result.push(candidates[i].eid);
        }
        return result;
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
