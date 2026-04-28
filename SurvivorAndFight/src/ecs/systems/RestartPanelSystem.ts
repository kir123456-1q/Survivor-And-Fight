import { System } from '../core/System';
import type { EcsWorld } from '../core/World';
import type { EntityId } from '../core/EntityManager';
import { GameSession } from '../components/GameSession';
import { UIStackManager } from '../../game/ui/mvc/UIStackManager';
import { RESTART_PANEL_ROUTE_ID } from '../../game/ui/restart/RestartPanelController';

/**
 * ECS-owned restart panel lifecycle via MVC UI stack:
 * - show/hide through UIStackManager
 * - restart click writes restartRequested in GameSession
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
    ) {}

    update(_deltaTime: number): void {
        const session = this.world.getComponent(this.sessionEntity, GameSession);
        if (!session) return;

        if (session.paused) {
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
}

