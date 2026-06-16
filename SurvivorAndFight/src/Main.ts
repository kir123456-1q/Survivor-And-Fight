const { regClass } = Laya;

import {
    BOSS_COMBAT_SURVIVE_VICTORY_SEC,
    COMBAT_SURVIVE_VICTORY_SEC,
    DESIGN_WIDTH,
    DESIGN_HEIGHT,
    META_MENU_ENABLED,
    REWARD_PANEL_ROUTE_ID,
    SELECT_LEVEL_PANEL_ROUTE_ID,
    START_PANEL_ROUTE_ID,
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
import {
    installTextureAtlasLifecycle,
    onCombatEnter,
    onCombatLeave,
} from './game/render/TextureAtlasBootstrap';

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
    private combatFailed = false;
    private defeatExitInProgress = false;
    private enteringCombat = false;
    /** 2D 相机跟随：平滑系数 0~1，越大跟得越紧；0 表示不跟随。 */
    private cameraFollowSmooth = 0.12;

    onStart() {
        // 2D：this.owner 为场景中的 Area2D（GameRoot），用作游戏根容器
        const container = this.owner && (this.owner as any).addChild ? this.owner : null;
        installTextureAtlasLifecycle(container);
        this.input = new InputService();
        this.controlInput = new ControlInputAdapter(this.input);
        this.demo = new SimpleEcsDemo(container, null, this.controlInput);
        this.demo.setOnTabPauseChange((paused) => this.handleTabPauseChange(paused));
        this.demo.setOnCombatFailed(() => this.handleCombatFailed());
        this.demo.setOnDefeatExitRequested(() => this.onCombatDefeated());

        Laya.timer.frameLoop(1, this, this.onFrameLoop);
        this.loadConfigAndInitDemo();
    }

    /** 加载配表（Character 等）后按预制体生成玩家与怪物。预览需 tools/sync-config-to-bin.ps1。 */
    private async loadConfigAndInitDemo(): Promise<void> {
        await ensureGameConfigLoaded();
        if (META_MENU_ENABLED) {
            await this.startMetaMenu();
        } else if (this.demo) {
            onCombatEnter();
            await this.demo.init();
        }
    }

    private async startMetaMenu(): Promise<void> {
        const container = this.owner as any;
        if (container) container.visible = false;

        this.metaUiStack = new UIStackManager();
        this.metaFlow = new MetaFlowController({
            onEnterCombat: async (payload?: CombatEnterPayload) => {
                if (this.enteringCombat) return;
                this.enteringCombat = true;
                try {
                    this.stopCombatSurvivalTimer();
                    MetaMenuBootstrap.hideSceneEmbeddedStartPanel();

                    const testMode = !!payload?.testMode;
                    if (testMode) {
                        MetaRunSession.testMode = true;
                        MetaRunSession.testWaveIndex = 0;
                        MetaRunSession.testWaveAwaitingClear = false;
                        await this.metaUiStack?.clearAll();
                    } else {
                        MetaRunSession.resetTestSession();
                        this.demo?.resetCombatEntry();
                    }

                    if (container) container.visible = true;

                    onCombatEnter();

                    if (this.demo) {
                        MetaRunSession.combatDemo = this.demo;
                        this.combatFailed = false;
                        this.demo.resetSessionForCombatStart();
                        await this.demo.init();
                        this.demo.setSessionPaused(false);
                    }

                    if (testMode) {
                        MetaRunSession.onTestCombatComplete = () => this.onTestCombatComplete();
                        return;
                    }

                    this.pendingBossVictory = !!payload?.isBoss;
                    this.combatSurvivalDurationSec = payload?.isBoss
                        ? BOSS_COMBAT_SURVIVE_VICTORY_SEC
                        : COMBAT_SURVIVE_VICTORY_SEC;
                    this.startCombatSurvivalTimer();
                } finally {
                    this.enteringCombat = false;
                }
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
        if (this.combatFailed || !this.combatSurvivalTimer.isRunning()) return;
        if (paused) {
            this.combatSurvivalTimer.pause();
        } else {
            this.combatSurvivalTimer.reset();
        }
    }

    /** 玩家阵亡：立即停止生存倒计时，本局判定失败。 */
    private handleCombatFailed(): void {
        if (this.combatFailed) return;
        this.combatFailed = true;
        this.stopCombatSurvivalTimer();
    }

    /** 生存胜利：暂停战斗并弹出三选一奖励。 */
    private async onCombatSurvived(): Promise<void> {
        if (this.combatFailed) return;
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

    /** 战败：点击复活面板后返回开始界面。 */
    private async onCombatDefeated(): Promise<void> {
        if (this.defeatExitInProgress) return;
        this.defeatExitInProgress = true;
        try {
            this.combatFailed = true;
            this.stopCombatSurvivalTimer();
            await this.demo?.clearDefeatSession();
            MetaRunSession.resetTestSession();
            MetaRunSession.resetRunRewards();
            MetaRunSession.runMapState = null;
            MetaRunSession.resumeRunMap = null;
            MetaRunSession.combatDemo = null;
            this.demo?.clearCombatScene();
            this.demo?.resetCombatEntry();
            onCombatLeave();

            const container = this.owner as any;
            if (container) container.visible = false;

            if (META_MENU_ENABLED && this.metaUiStack) {
                await this.metaUiStack.clearAll();
                MetaMenuBootstrap.hideSceneEmbeddedStartPanel();
                await this.metaUiStack.push(START_PANEL_ROUTE_ID);
            } else {
                MetaMenuBootstrap.showSceneEmbeddedStartPanel();
            }
        } finally {
            this.combatFailed = false;
            this.defeatExitInProgress = false;
        }
    }

    /** 测试三关全部清场后返回选关界面。 */
    private async onTestCombatComplete(): Promise<void> {
        this.stopCombatSurvivalTimer();
        this.demo?.setSessionPaused(true);
        MetaRunSession.onTestCombatComplete = null;
        MetaRunSession.resetTestSession();
        this.demo?.clearCombatScene();
        this.demo?.resetCombatEntry();
        onCombatLeave();

        const container = this.owner as any;
        if (container) container.visible = false;

        if (!this.metaUiStack) return;
        await this.metaUiStack.clearAll();
        MetaMenuBootstrap.hideSceneEmbeddedStartPanel();
        await this.metaUiStack.push(START_PANEL_ROUTE_ID);
    }

    private async afterCombatReward(_picked: boolean): Promise<void> {
        const container = this.owner as any;
        if (container) container.visible = false;
        this.demo?.clearCombatScene();
        onCombatLeave();
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
