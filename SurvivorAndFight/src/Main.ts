const { regClass } = Laya;

import {
    BOSS_COMBAT_SURVIVE_VICTORY_SEC,
    COMBAT_SURVIVE_VICTORY_SEC,
    DESIGN_WIDTH,
    DESIGN_HEIGHT,
    META_MENU_ENABLED,
    REWARD_PANEL_ROUTE_ID,
} from './defines';
import { CombatSurvivalTimer } from './game/combat/CombatSurvivalTimer';
import { SimpleEcsDemo } from './game/demo/SimpleEcsDemo';
import type { CombatEnterPayload } from './game/meta/MetaFlowController';
import { MetaFlowController } from './game/meta/MetaFlowController';
import { MetaRunSession } from './game/meta/MetaRunSession';
import { MetaMenuBootstrap } from './game/ui/meta/MetaMenuBootstrap';
import { UIStackManager } from './game/ui/mvc/UIStackManager';
import { InputService } from './input/InputService';
import { ControlInputAdapter } from './input/ControlInputAdapter';
import { ensureGameConfigLoaded } from './config/ConfigBootstrap';

/** 参考 LayaProject2：脚本挂在 Area2D 子节点上，不挂在场景根，避免 3D 管线（_addRenderObject / cullInfoCamera）。 */
@regClass()
export class Main extends Laya.Script {
    declare owner: Laya.Area2D;

    private demo: SimpleEcsDemo | null = null;
    private metaUiStack: UIStackManager | null = null;
    private metaFlow: MetaFlowController | null = null;
    private input: InputService | null = null;
    private controlInput: ControlInputAdapter | null = null;
    private readonly combatSurvivalTimer = new CombatSurvivalTimer();
    private combatSurvivalDurationSec = COMBAT_SURVIVE_VICTORY_SEC;
    private pendingBossVictory = false;
    /** 2D 相机跟随：平滑系数 0~1，越大跟得越紧；0 表示不跟随。 */
    private cameraFollowSmooth = 0.12;

    onStart() {
        // 2D：this.owner 为场景中的 Area2D（GameRoot），用作游戏根容器
        const container = this.owner && (this.owner as any).addChild ? this.owner : null;
        this.input = new InputService();
        this.controlInput = new ControlInputAdapter(this.input);
        this.demo = new SimpleEcsDemo(container, null, this.controlInput);
        this.demo.setOnTabPauseChange((paused) => this.handleTabPauseChange(paused));

        Laya.timer.frameLoop(1, this, this.onFrameLoop);
        this.loadConfigAndInitDemo();
    }

    /** 加载配表（Character 等）后按预制体生成玩家与怪物。预览需 tools/sync-config-to-bin.ps1。 */
    private async loadConfigAndInitDemo(): Promise<void> {
        await ensureGameConfigLoaded();
        if (META_MENU_ENABLED) {
            await this.startMetaMenu();
        } else if (this.demo) {
            await this.demo.init();
        }
    }

    private async startMetaMenu(): Promise<void> {
        const container = this.owner as any;
        if (container) container.visible = false;

        this.metaUiStack = new UIStackManager();
        this.metaFlow = new MetaFlowController({
            onEnterCombat: async (payload?: CombatEnterPayload) => {
                this.stopCombatSurvivalTimer();
                if (container) container.visible = true;
                if (this.demo) {
                    MetaRunSession.combatDemo = this.demo;
                    await this.demo.init();
                    this.demo.setSessionPaused(false);
                }
                this.pendingBossVictory = !!payload?.isBoss;
                this.combatSurvivalDurationSec = payload?.isBoss
                    ? BOSS_COMBAT_SURVIVE_VICTORY_SEC
                    : COMBAT_SURVIVE_VICTORY_SEC;
                this.startCombatSurvivalTimer();
            },
        });
        MetaMenuBootstrap.registerRoutes(this.metaUiStack, this.metaFlow);
        await MetaMenuBootstrap.start(this.metaUiStack);
    }

    private startCombatSurvivalTimer(): void {
        this.combatSurvivalTimer.start(this.combatSurvivalDurationSec, () => {
            void this.onCombatSurvived();
        });
    }

    private stopCombatSurvivalTimer(): void {
        this.combatSurvivalTimer.stop();
    }

    private handleTabPauseChange(paused: boolean): void {
        if (!this.combatSurvivalTimer.isRunning()) return;
        if (paused) {
            this.combatSurvivalTimer.pause();
        } else {
            this.combatSurvivalTimer.reset();
        }
    }

    /** 生存胜利：暂停战斗并弹出三选一奖励。 */
    private async onCombatSurvived(): Promise<void> {
        this.stopCombatSurvivalTimer();
        this.demo?.setSessionPaused(true);

        const context = this.pendingBossVictory ? 'boss' : 'combat';
        if (!this.metaUiStack) return;

        MetaRunSession.onRewardPanelClosed = (picked) => {
            MetaRunSession.onRewardPanelClosed = null;
            void this.afterCombatReward(picked);
        };
        await this.metaUiStack.push(REWARD_PANEL_ROUTE_ID, { context, applyInCombat: true });
    }

    private async afterCombatReward(_picked: boolean): Promise<void> {
        const container = this.owner as any;
        if (container) container.visible = false;
        this.demo?.setSessionPaused(false);

        if (this.pendingBossVictory) {
            this.pendingBossVictory = false;
            MetaRunSession.completeBossVictory();
            return;
        }
        await MetaRunSession.resumeRunMap?.();
    }

    private onFrameLoop(): void {
        const deltaTimeSeconds = Laya.timer.delta / 1000;
        if (this.input) this.input.update();
        if (this.demo) this.demo.update(deltaTimeSeconds);
        this.updateCameraFollow(deltaTimeSeconds);
    }

    /** 2D 相机跟随：移动游戏根容器使玩家保持在屏幕中心。 */
    private updateCameraFollow(deltaTime: number): void {
        const container = this.owner as any;
        if (!container || !this.demo) return;
        const pos = this.demo.getPlayerPosition();
        if (!pos) return;
        const centerX = (typeof Laya.stage.designWidth === 'number' ? Laya.stage.designWidth : DESIGN_WIDTH) * 0.5;
        const centerY = (typeof Laya.stage.designHeight === 'number' ? Laya.stage.designHeight : DESIGN_HEIGHT) * 0.5;
        const targetX = centerX - pos.x;
        const targetY = centerY - pos.y;
        if (this.cameraFollowSmooth <= 0) {
            container.x = targetX;
            container.y = targetY;
        } else {
            const t = 1 - Math.pow(1 - this.cameraFollowSmooth, deltaTime * 60);
            container.x += (targetX - container.x) * t;
            container.y += (targetY - container.y) * t;
        }
    }
}
