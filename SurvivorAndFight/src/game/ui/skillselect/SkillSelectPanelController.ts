import type { EcsWorld } from '../../../ecs/core/World';
import { GameSession } from '../../../ecs/components/GameSession';
import { SkillLoadoutState } from '../../../ecs/components/SkillLoadoutState';
import { TAB_KEY_CODE } from '../../../defines';
import { SkillSelectPanelView } from './SkillSelectPanelView';
import { SkillDragService } from './SkillDragService';

export class SkillSelectPanelController {
    private readonly view = new SkillSelectPanelView();
    private readonly drag = new SkillDragService();
    private world: EcsWorld | null = null;
    private sessionEntity = -1;
    private playerEntity = -1;
    private tabDown = false;
    private initialized = false;
    private keyHandler: ((e: KeyboardEvent) => void) | null = null;
    private useDocumentKeys = false;
    private onTabPauseChange: ((paused: boolean) => void) | null = null;

    setOnTabPauseChange(handler: ((paused: boolean) => void) | null): void {
        this.onTabPauseChange = handler;
    }

    init(panelRoot: any, sessionEntity: number, world: EcsWorld, playerEntity: number): void {
        this.world = world;
        this.sessionEntity = sessionEntity;
        this.playerEntity = playerEntity;
        this.view.init(panelRoot);
        this.view.setPanelVisible(false);
        this.drag.setCoordinateRoot(panelRoot);
        this.drag.setOnStateChanged(() => this.refreshAll());
        this.drag.attachStageListeners();
        this.registerTabKey();
        this.initialized = true;
        void this.refreshAll();
    }

    private registerTabKey(): void {
        this.keyHandler = (e: KeyboardEvent) => {
            if (e.keyCode !== TAB_KEY_CODE) return;
            if (e.type === 'keydown') {
                if (this.tabDown) return;
                this.tabDown = true;
                e.preventDefault();
                this.togglePanel();
            } else if (e.type === 'keyup') {
                this.tabDown = false;
            }
        };
        if (typeof document !== 'undefined') {
            this.useDocumentKeys = true;
            document.addEventListener('keydown', this.keyHandler, true);
            document.addEventListener('keyup', this.keyHandler, true);
            return;
        }
        this.useDocumentKeys = false;
        const layaHandler = this.keyHandler as unknown as (e: any) => void;
        Laya.stage.on(Laya.Event.KEY_DOWN, this, layaHandler);
        Laya.stage.on(Laya.Event.KEY_UP, this, layaHandler);
    }

    setPanelVisible(visible: boolean): void {
        const state = this.getLoadout();
        if (!state || !this.world) return;
        state.panelOpen = visible;
        this.view.setPanelVisible(visible);
        const session = this.world.getComponent(this.sessionEntity, GameSession);
        if (session) session.paused = visible;
        this.onTabPauseChange?.(visible);
        if (visible) {
            this.onOpen();
        } else {
            this.rebindDrag();
        }
    }

    togglePanel(): void {
        const state = this.getLoadout();
        if (!state) return;
        this.setPanelVisible(!state.panelOpen);
    }

    onOpen(): void {
        const state = this.getLoadout();
        if (!state) return;
        void this.view.onOpen(state).then(() => this.rebindDrag());
    }

    refreshAll(): void {
        const state = this.getLoadout();
        if (!state) return;
        state.dirty = true;
        void this.view.refreshAll(state).then(() => {
            this.rebindDrag();
        });
    }

    private rebindDrag(): void {
        const state = this.getLoadout();
        if (!state) return;
        this.drag.clearBindings();
        this.drag.loadoutState = state;
        const bindings = this.view.collectDragBindings(state);
        for (const b of bindings) {
            this.drag.registerSlot(b);
        }
    }

    private getLoadout(): SkillLoadoutState | undefined {
        if (!this.world || this.playerEntity < 0) return undefined;
        return this.world.getComponent(this.playerEntity, SkillLoadoutState);
    }

    dispose(): void {
        if (this.keyHandler) {
            if (this.useDocumentKeys && typeof document !== 'undefined') {
                document.removeEventListener('keydown', this.keyHandler, true);
                document.removeEventListener('keyup', this.keyHandler, true);
            } else {
                const layaHandler = this.keyHandler as unknown as (e: any) => void;
                Laya.stage.off(Laya.Event.KEY_DOWN, this, layaHandler);
                Laya.stage.off(Laya.Event.KEY_UP, this, layaHandler);
            }
            this.keyHandler = null;
        }
        this.drag.detachStageListeners();
        this.drag.clearBindings();
        this.view.dispose();
        this.onTabPauseChange = null;
        this.initialized = false;
    }

    isInitialized(): boolean {
        return this.initialized;
    }
}
