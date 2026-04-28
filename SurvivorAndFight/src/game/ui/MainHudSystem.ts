import type { EcsWorld } from '../../ecs/core/World';
import { System } from '../../ecs/core/System';
import type { FilterRegistry } from '../../ecs/filters/FilterRegistry';
import { Experience } from '../../ecs/components/Experience';
import { UpgradeState } from '../../ecs/components/UpgradeState';
import {
    LEVEL_PROGRESS_BAR_NAME,
    SKILL_TEXT_NAME,
    LEVEL_TEXT_NAME,
    MAIN_UI_PANEL_PREFAB,
} from '../../defines';

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

        const upgrade = this.world.getComponent(player, UpgradeState);
        if (this.skillTxt && typeof this.skillTxt.text !== 'undefined') {
            this.skillTxt.text = this.buildSkillText(upgrade);
        }
    }

    dispose(): void {
        if (this.panelNode?.destroy) this.panelNode.destroy();
        this.panelNode = null;
        this.levelProgressBar = null;
        this.levelTxt = null;
        this.skillTxt = null;
    }

    private buildSkillText(upgrade: UpgradeState | undefined): string {
        if (!upgrade) return '技能: 暂无';
        const lines: string[] = [];

        const fireRatePct = Math.max(0, Math.round((upgrade.fireRateMultiplier - 1) * 100));
        if (fireRatePct > 0) lines.push(`攻速 +${fireRatePct}%`);

        const damagePct = Math.max(0, Math.round((upgrade.bulletDamageMultiplier - 1) * 100));
        if (damagePct > 0) lines.push(`攻击 +${damagePct}%`);

        if (upgrade.multiShotExtra > 0) lines.push(`子弹数量 +${upgrade.multiShotExtra}`);
        if (upgrade.onHitSpawnCount > 0) lines.push(`命中分裂 +${upgrade.onHitSpawnCount}`);

        if (lines.length === 0) return '技能: 暂无';
        return lines.join('\n');
    }
}
