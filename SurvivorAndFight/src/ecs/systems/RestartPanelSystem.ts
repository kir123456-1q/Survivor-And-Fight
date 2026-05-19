import { System } from '../core/System';
import type { EcsWorld } from '../core/World';
import type { EntityId } from '../core/EntityManager';
import type { FilterRegistry } from '../filters/FilterRegistry';
import { Attribute } from '../components/Attribute';
import { GameSession } from '../components/GameSession';
import { UIStackManager } from '../../game/ui/mvc/UIStackManager';
import { RESTART_PANEL_ROUTE_ID } from '../../game/ui/restart/RestartPanelController';

/**
 * ECS-owned restart panel lifecycle via MVC UI stack:
 * - show/hide through UIStackManager
 * - 复活/重开点击写入 restartRequested，由 Main 处理为返回开始界面（不再原地复活）
 */
export class RestartPanelSystem implements System {
    readonly group = 'render' as const;
    readonly priority = 5;

    private openPending = false;
    private closePending = false;

    constructor(
        private readonly world: EcsWorld,
        private readonly sessionEntity: EntityId,
        private readonly uiStack: UIStackManager,
        private readonly filters: FilterRegistry,
    ) {}

    update(_deltaTime: number): void {
        const session = this.world.getComponent(this.sessionEntity, GameSession);
        if (!session) return;

        const shouldShowRestart = session.paused && this.isPlayerDead();

        if (shouldShowRestart) {
            if (!session.restartPanelVisible && !this.openPending) {
                this.openPending = true;
                void this.uiStack.push(RESTART_PANEL_ROUTE_ID, {
                    onRestart: () => {
                        const s = this.world.getComponent(this.sessionEntity, GameSession);
                        if (!s) return;
                        s.restartRequested = true;
                    },
                }).then(() => {
                    const s = this.world.getComponent(this.sessionEntity, GameSession);
                    if (s) s.restartPanelVisible = true;
                }).catch((e) => {
                    console.warn('RestartPanelSystem: open panel failed', e);
                    const s = this.world.getComponent(this.sessionEntity, GameSession);
                    if (s) s.restartRequested = true;
                }).finally(() => {
                    this.openPending = false;
                });
            }
        } else {
            if (session.restartPanelVisible && !this.closePending) {
                this.closePending = true;
                void this.uiStack.pop(RESTART_PANEL_ROUTE_ID).then(() => {
                    const s = this.world.getComponent(this.sessionEntity, GameSession);
                    if (s) s.restartPanelVisible = false;
                }).finally(() => {
                    this.closePending = false;
                });
            }
        }
    }

    /** 仅死亡暂停时弹出重启面板；技能装配 Tab 暂停（hp>0）不触发。 */
    private isPlayerDead(): boolean {
        const players = this.filters.getNamedFilter('Players');
        if (players.length === 0) return false;
        const attr = this.world.getComponent(players[0], Attribute);
        if (!attr || typeof attr.base.hp !== 'number') return false;
        return attr.base.hp <= 0;
    }
}

