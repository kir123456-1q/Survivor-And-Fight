import type { EcsWorld } from '../../ecs/core/World';
import { System } from '../../ecs/core/System';
import { ViewComponent } from '../../ecs/components/TransformComponents';
import { Attribute } from '../../ecs/components/Attribute';
import { BodyUIComponent } from '../../ecs/components/BodyUIComponent';
import type { AttributeSystem } from '../../ecs/systems/AttributeSystem';
import { BLOOD_BAR_NAME, PROGRESS_BAR_NAME } from '../../defines';

function findProgressBar(bodyNode: any): any {
    if (!bodyNode) return null;
    const bloodBar = bodyNode.getChildByName ? bodyNode.getChildByName(BLOOD_BAR_NAME) : null;
    if (!bloodBar) return null;
    return bloodBar.getChildByName ? bloodBar.getChildByName(PROGRESS_BAR_NAME) : null;
}

function toProgressValue(progressBar: any, ratio01: number): number {
    if (progressBar && typeof progressBar.max === 'number' && progressBar.max > 0) {
        return ratio01 * progressBar.max;
    }
    // Laya GProgressBar commonly uses 0-100 value range by default.
    if (progressBar && typeof progressBar.value === 'number' && progressBar.value > 1) {
        return ratio01 * 100;
    }
    return ratio01;
}

/**
 * 根据实体 Attribute 的 hp、maxHp 更新 BloodBar 下 ProgressBar.value（0–1）。
 * 仅处理同时拥有 ViewComponent、BodyUIComponent、Attribute 的实体。
 */
export class BloodBarSyncSystem implements System {
    readonly group = 'render' as const;
    readonly priority = -1;

    constructor(
        private readonly world: EcsWorld,
        private readonly attrSystem: AttributeSystem,
    ) {}

    update(_deltaTime: number): void {
        const viewPairs = this.world.getAllOfType(ViewComponent);
        for (const [entity, view] of viewPairs) {
            const bodyUI = this.world.getComponent(entity, BodyUIComponent);
            const attr = this.world.getComponent(entity, Attribute);
            if (!bodyUI?.bodyNode || !attr) continue;
            const progressBar = findProgressBar(bodyUI.bodyNode);
            if (!progressBar || typeof progressBar.value === 'undefined') continue;
            const hp = this.attrSystem.getFinalValue(entity, 'hp');
            const maxHp = this.attrSystem.getFinalValue(entity, 'maxHp');
            const ratio = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 1;
            progressBar.value = toProgressValue(progressBar, ratio);
        }
    }
}
