import { Data } from '../../config/Data';
import {
    EFFECT_TYPE_BULLET,
    EFFECT_TYPE_DIRECT_DAMAGE,
    EFFECT_TYPE_MODIFIER_CHAIN,
    EFFECT_TYPE_MODIFIER_PIERCE,
    EFFECT_TYPE_MODIFIER_SPLIT,
} from '../../defines';
import type { SkillLoadoutState } from '../../ecs/components/SkillLoadoutState';
import { buildSkillCastPlan } from './EffectExecutor';
import {
    getCombatEffectIds,
    getSkillDisplayName,
} from './SkillLoadoutModel';

function effectRow(effectId: string): Record<string, unknown> | undefined {
    return Data?.SkillEffect?.GetByID?.(effectId) as Record<string, unknown> | undefined;
}

function num(row: Record<string, unknown>, key: string, fallback = 0): number {
    const v = Number(row[key]);
    return Number.isFinite(v) ? v : fallback;
}

function inferType(effectId: string, row: Record<string, unknown>): string {
    const t = String(row.effect ?? '');
    if (t) return t;
    if (effectId.includes('split')) return EFFECT_TYPE_MODIFIER_SPLIT;
    if (effectId.includes('chain')) return EFFECT_TYPE_BULLET;
    if (effectId.includes('shot_')) return EFFECT_TYPE_BULLET;
    return EFFECT_TYPE_DIRECT_DAMAGE;
}

/** 单条 Effect 的预期战斗行为（中文简述）。 */
export function describeEffectBehavior(effectId: string): string {
    const row = effectRow(effectId);
    if (!row || row.enabled === false) return '（未启用）';

    const name = String(row.name ?? effectId);
    const type = inferType(effectId, row);

    if (type === EFFECT_TYPE_MODIFIER_SPLIT) {
        const n = num(row, 'splitCount', 1);
        return `${name}：下一发子弹命中后分裂（级数 ${n}）`;
    }
    if (type === EFFECT_TYPE_MODIFIER_CHAIN) {
        const n = num(row, 'chainCount', 2);
        return `${name}：下一发子弹连锁 ${n} 个额外目标`;
    }
    if (type === EFFECT_TYPE_MODIFIER_PIERCE) {
        const p = num(row, 'penetration', 1);
        return `${name}：下一发子弹穿透 +${p}`;
    }
    if (type === EFFECT_TYPE_BULLET) {
        const dmg = num(row, 'damage', 0);
        const parts: string[] = [`${name}：发射子弹`];
        if (dmg > 0) parts.push(`伤害 ${dmg}`);
        const chain = num(row, 'chainCount', 0);
        if (chain > 0) parts.push(`连锁 ${chain}`);
        const split = num(row, 'splitCount', 0);
        if (split > 0) parts.push(`分裂 ${split}`);
        const pen = num(row, 'penetration', 0);
        if (pen > 0) parts.push(`穿透 ${pen}`);
        return parts.join('，');
    }
    if (type === EFFECT_TYPE_DIRECT_DAMAGE) {
        const dmg = num(row, 'damage', 0);
        return `${name}：直伤 ${dmg > 0 ? dmg : '公式'}`;
    }
    return name;
}

/** 解析一次施放计划为可读行。 */
export function describeCastPlanPreview(
    skillId: string,
    effectIds: string[],
    getEffectRowFn: (id: string) => Record<string, unknown> | undefined,
): string[] {
    const plan = buildSkillCastPlan(skillId, effectIds, getEffectRowFn);
    if (!plan) return ['（无可用 Effect，不会施放）'];

    const lines: string[] = [];
    for (const spec of plan.bullets) {
        const parts = ['子弹'];
        if (spec.damageOverride) parts.push(`伤害 ${spec.damageOverride}`);
        if (spec.chainCount > 0) parts.push(`连锁 ${spec.chainCount}`);
        if (spec.splitCount > 0) parts.push(`分裂 ${spec.splitCount}`);
        if (spec.penetration > 0) parts.push(`穿透 ${spec.penetration}`);
        lines.push(`→ ${parts.join('，')}`);
    }
    for (const d of plan.directDamages) {
        lines.push(`→ 直伤（${d.effectId}）`);
    }
    if (lines.length === 0) return ['（无输出）'];
    return lines;
}

/** 右侧 SKillTxt：当前装配 Effect + 施放预览。 */
export function buildLoadoutDetailText(
    state: SkillLoadoutState,
    getEffectRowFn: (id: string) => Record<string, unknown> | undefined,
): string {
    const sections: string[] = [];

    sections.push('【当前生效 Effect】');
    let anyActive = false;
    for (let i = 0; i < 3; i++) {
        const skillId = state.equippedSkillIds[i];
        if (!skillId) {
            sections.push(`装备${i + 1}：空`);
            continue;
        }
        const effectIds = getCombatEffectIds(state, skillId);
        sections.push(`装备${i + 1}：${getSkillDisplayName(skillId)}`);
        if (effectIds.length === 0) {
            sections.push('  （未挂载 Effect，战斗中不施放）');
            continue;
        }
        anyActive = true;
        for (const eid of effectIds) {
            sections.push(`  · ${describeEffectBehavior(eid)}`);
        }
    }
    if (!anyActive) {
        sections.push('（请为装备技能拖入 Effect）');
    }

    sections.push('');
    sections.push('【施放预览】');
    for (let i = 0; i < 3; i++) {
        const skillId = state.equippedSkillIds[i];
        if (!skillId) continue;
        const effectIds = getCombatEffectIds(state, skillId);
        sections.push(`${getSkillDisplayName(skillId)}：`);
        const preview = describeCastPlanPreview(skillId, effectIds, getEffectRowFn);
        for (const line of preview) {
            sections.push(`  ${line}`);
        }
    }

    return sections.join('\n');
}
