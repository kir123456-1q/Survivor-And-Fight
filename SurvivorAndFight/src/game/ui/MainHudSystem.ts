import type { EcsWorld } from '../../ecs/core/World';
import { System } from '../../ecs/core/System';
import type { FilterRegistry } from '../../ecs/filters/FilterRegistry';
import { Experience } from '../../ecs/components/Experience';
import { SkillLoadoutState } from '../../ecs/components/SkillLoadoutState';
import { Data } from '../../config/Data';
import { buildLoadoutDetailText } from '../skill/CombatEffectSummary';
import {
    LEVEL_PROGRESS_BAR_NAME,
    SKILL_TEXT_NAME,
    LEVEL_TEXT_NAME,
    MAIN_UI_PANEL_PREFAB,
    SKILL_SELECT_PANEL_NAME,
} from '../../defines';
import type { SkillSelectPanelController } from './skillselect/SkillSelectPanelController';

function findNodeByName(root: any, name: string): any {
    if (!root || !name) return null;
    const queue: any[] = [root];
    while (queue.length > 0) {
        const node = queue.shift();
        if (!node) continue;
        if (node.name === name) return node;
        const childCount = typeof node.numChildren === 'number' ? node.numChildren : 0;
        for (let i = 0; i < childCount; i++) {
            queue.push(node.getChildAt(i));
        }
    }
    return null;
}

function progressValueByRatio(progressBar: any, ratio01: number): number {
    if (progressBar && typeof progressBar.max === 'number' && progressBar.max > 0) {
        return ratio01 * progressBar.max;
    }
    if (progressBar && typeof progressBar.value === 'number' && progressBar.value > 1) {
        return ratio01 * 100;
    }
    return ratio01;
}

/**
 * Keeps MainUIPanel visible and updates level/exp HUD.
 */
export class MainHudSystem implements System {
    readonly group = 'render' as const;
    readonly priority = 20;

    private panelNode: any = null;
    private panelLoading = false;
    private levelProgressBar: any = null;
    private levelTxt: any = null;
    private skillTxt: any = null;

    constructor(
        private readonly world: EcsWorld,
        private readonly filters: FilterRegistry,
        private readonly hudParent: any,
        private readonly skillSelectController?: SkillSelectPanelController,
        private readonly getSessionEntity?: () => number,
        private readonly getPlayerEntity?: () => number,
    ) {}

    update(_deltaTime: number): void {
        if (!this.panelNode && !this.panelLoading) {
            this.panelLoading = true;
            Promise.resolve(Laya.Prefab.instantiate(MAIN_UI_PANEL_PREFAB))
                .then((node) => {
                    this.panelNode = node;
                    const parent = this.hudParent ?? Laya.stage;
                    parent.addChild(node);
                    this.levelProgressBar = findNodeByName(node, LEVEL_PROGRESS_BAR_NAME);
                    this.levelTxt = findNodeByName(node, LEVEL_TEXT_NAME);
                    this.skillTxt = findNodeByName(node, SKILL_TEXT_NAME);
                    const selectPanel = findNodeByName(node, SKILL_SELECT_PANEL_NAME);
                    if (selectPanel) {
                        if (typeof selectPanel.visible !== 'undefined') selectPanel.visible = false;
                        if (typeof selectPanel.displayed !== 'undefined') selectPanel.displayed = false;
                    }
                    this.tryInitSkillSelect(node);
                })
                .catch((e) => {
                    console.warn('MainHudSystem: failed to load main ui panel', e);
                })
                .finally(() => {
                    this.panelLoading = false;
                });
            return;
        }

        if (!this.panelNode) return;

        this.tryInitSkillSelect(this.panelNode);

        const players = this.filters.getNamedFilter('Players');
        if (players.length === 0) return;
        const player = players[0];
        const xp = this.world.getComponent(player, Experience);
        if (!xp) return;

        const ratio = xp.expToNext > 0 ? Math.max(0, Math.min(1, xp.exp / xp.expToNext)) : 1;
        if (this.levelProgressBar && typeof this.levelProgressBar.value !== 'undefined') {
            this.levelProgressBar.value = progressValueByRatio(this.levelProgressBar, ratio);
        }
        if (this.levelTxt && typeof this.levelTxt.text !== 'undefined') {
            this.levelTxt.text = `Lv.${xp.level}`;
        }

        if (this.skillTxt && typeof this.skillTxt.text !== 'undefined') {
            this.skillTxt.text = this.buildCombatDetailText(player);
        }
    }

    dispose(): void {
        this.skillSelectController?.dispose();
        if (this.panelNode?.destroy) this.panelNode.destroy();
        this.panelNode = null;
        this.levelProgressBar = null;
        this.levelTxt = null;
        this.skillTxt = null;
    }

    private tryInitSkillSelect(panelRoot: any): void {
        if (!this.skillSelectController || this.skillSelectController.isInitialized()) return;
        const sessionEntity = this.getSessionEntity?.() ?? -1;
        const playerEntity = this.getPlayerEntity?.() ?? -1;
        if (sessionEntity < 0 || playerEntity < 0) return;
        this.skillSelectController.init(panelRoot, sessionEntity, this.world, playerEntity);
    }

    private buildCombatDetailText(playerEntity: number): string {
        const loadout = this.world.getComponent(playerEntity, SkillLoadoutState);
        if (!loadout) return '【战斗装配】\n数据未就绪';
        return buildLoadoutDetailText(loadout, (id) =>
            Data?.SkillEffect?.GetByID?.(id) as Record<string, unknown> | undefined,
        );
    }
}
