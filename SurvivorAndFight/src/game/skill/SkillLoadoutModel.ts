import { Data } from '../../config/Data';
import {
    buildWeaponIconPath,
    DEFAULT_EFFECT_SLOT_COUNT,
    EFFECT_BOX_SLOT_COUNT,
    EQUIPPED_SKILL_SLOT_COUNT,
    SKILL_BOX_SLOT_COUNT,
    SKILL_CAST_STAGGER_OFFSETS_SEC,
    START_RANDOM_EFFECT_COUNT,
    START_RANDOM_SKILL_COUNT,
    STARTER_BULLET_EFFECT_BY_SLOT,
    TEST_WAND_EFFECT_IDS,
    TEST_WAND_SKILL_IDS,
} from '../../defines';
import { SkillLoadoutState } from '../../ecs/components/SkillLoadoutState';
import type { Skill } from '../../ecs/components/Skill';
import { EFFECT_TYPE_BULLET } from '../../defines';

export type DragKind = 'effect' | 'skill';
export type LoadoutSlotKind = 'equipped_skill' | 'skill_effect' | 'unequipped_effect' | 'skill_inventory';

export interface DropTarget {
    kind: DragKind;
    slot: LoadoutSlotKind;
    index: number;
    skillIndex?: number;
}

function skillRow(skillId: string): Record<string, unknown> | undefined {
    return Data?.Skill?.GetByID?.(skillId) as Record<string, unknown> | undefined;
}

function effectRow(effectId: string): Record<string, unknown> | undefined {
    return Data?.SkillEffect?.GetByID?.(effectId) as Record<string, unknown> | undefined;
}

function isEffectEnabled(effectId: string): boolean {
    const row = effectRow(effectId);
    if (!row) return false;
    return row.enabled !== false;
}

function displayNameFromId(id: string): string {
    return id.replace(/^fx_/, '').replace(/[-_]/g, ' ');
}

function shuffle<T>(items: T[]): T[] {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function pickRandomUnique<T>(pool: T[], count: number): T[] {
    return shuffle(pool).slice(0, Math.min(count, pool.length));
}

/** 从配表构建默认装配状态：开局随机 3 技能 + 5 Effect。 */
export function createDefaultLoadoutState(): SkillLoadoutState {
    const state = new SkillLoadoutState();
    const allSkills = (Data?.Skill?.GetAll?.() ?? []) as Array<Record<string, unknown>>;
    const skillPool = allSkills
        .filter((r) => String(r.id) !== 'player_auto_shot')
        .map((r) => String(r.id));

    if (skillPool.length === 0 && allSkills.length === 0) {
        console.warn('SkillLoadoutModel: skill pool empty — check config load');
    }

    const randomEquipped = pickRandomUnique(skillPool, START_RANDOM_SKILL_COUNT);
    for (let i = 0; i < EQUIPPED_SKILL_SLOT_COUNT; i++) {
        state.equippedSkillIds[i] = randomEquipped[i] ?? null;
    }

    const inventoryPool = shuffle(skillPool);
    state.ownedSkillIds = Array.from({ length: SKILL_BOX_SLOT_COUNT }, (_, i) => inventoryPool[i] ?? '');

    for (let i = 0; i < EQUIPPED_SKILL_SLOT_COUNT; i++) {
        const sid = state.equippedSkillIds[i];
        if (!sid) continue;
        const row = skillRow(sid);
        const slotCount = Number(row?.effectSlotCount) || DEFAULT_EFFECT_SLOT_COUNT;
        state.skillEffectMap[sid] = Array.from({ length: slotCount }, () => null);
    }

    const allEffects = (Data?.SkillEffect?.GetAll?.() ?? []) as Array<Record<string, unknown>>;
    const effectPool = allEffects
        .map((r) => String(r.id))
        .filter((id) => id !== 'player_auto_shot_effect_1');

    assignStarterEffectsToEquippedSkills(state, effectPool);

    state.dirty = true;
    return state;
}

/** 测试关卡：前三装备栏固定为 10 / 100 / 1000 发弹幕测试法杖。 */
export function createTestLoadoutState(): SkillLoadoutState {
    const state = new SkillLoadoutState();

    for (let i = 0; i < EQUIPPED_SKILL_SLOT_COUNT; i++) {
        const skillId = TEST_WAND_SKILL_IDS[i] ?? null;
        state.equippedSkillIds[i] = skillId;
        if (!skillId) continue;

        const row = skillRow(skillId);
        const slotCount = Number(row?.effectSlotCount) || DEFAULT_EFFECT_SLOT_COUNT;
        const slots: (string | null)[] = Array.from({ length: slotCount }, () => null);
        const effectId = TEST_WAND_EFFECT_IDS[i];
        if (effectId && isEffectEnabled(effectId)) {
            slots[0] = effectId;
        }
        state.skillEffectMap[skillId] = slots;
    }

    state.ownedSkillIds = [...TEST_WAND_SKILL_IDS];
    state.unequippedEffectIds = Array.from({ length: EFFECT_BOX_SLOT_COUNT }, () => '');
    state.dirty = true;
    return state;
}

function effectTypeOf(effectId: string): string {
    const row = effectRow(effectId);
    if (!row) return '';
    return String(row.effect ?? '');
}

/** 开局：每个装备技能至少 1 个子弹 Effect；三槽分别普通 / 连锁 / 分裂。 */
function assignStarterEffectsToEquippedSkills(state: SkillLoadoutState, effectPool: string[]): void {
    const used = new Set<string>();

    for (let i = 0; i < EQUIPPED_SKILL_SLOT_COUNT; i++) {
        const sid = state.equippedSkillIds[i];
        if (!sid) continue;

        const slots = state.skillEffectMap[sid];
        if (!slots?.length) continue;

        const preferred = STARTER_BULLET_EFFECT_BY_SLOT[i];
        let bulletId: string | null = null;
        if (preferred && isEffectEnabled(preferred) && effectTypeOf(preferred) === EFFECT_TYPE_BULLET) {
            bulletId = preferred;
        } else {
            bulletId = effectPool.find(
                (id) => isEffectEnabled(id) && effectTypeOf(id) === EFFECT_TYPE_BULLET && !used.has(id),
            ) ?? null;
        }

        if (bulletId) {
            slots[0] = bulletId;
            used.add(bulletId);
        }
    }

    const spare = effectPool.filter((id) => !used.has(id) && isEffectEnabled(id));
    const randomEffects = pickRandomUnique(spare, START_RANDOM_EFFECT_COUNT);
    state.unequippedEffectIds = Array.from({ length: EFFECT_BOX_SLOT_COUNT }, (_, i) => randomEffects[i] ?? '');
}

/** 将三技能冷却错开，减少弹幕重叠。 */
export function applySkillCastStagger(skill: Skill, loadout: SkillLoadoutState): void {
    for (let i = 0; i < EQUIPPED_SKILL_SLOT_COUNT; i++) {
        const sid = loadout.equippedSkillIds[i];
        if (!sid) continue;
        const offset = SKILL_CAST_STAGGER_OFFSETS_SEC[i] ?? 0;
        skill.cooldownRemain[sid] = Math.max(skill.cooldownRemain[sid] ?? 0, offset);
    }
}

function normalizeEffectIds(raw: unknown): string[] {
    if (Array.isArray(raw)) {
        return raw.map((v) => String(v)).filter((v) => v.length > 0);
    }
    if (typeof raw === 'string' && raw.length > 0) {
        return raw.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
    }
    return [];
}

/** 装备栏中已装配的技能 id（非空）。 */
export function getEquippedSkillIds(state: SkillLoadoutState): string[] {
    return state.equippedSkillIds.filter((id): id is string => !!id);
}

/** 战斗用：某技能已启用 Effect id 列表（按槽顺序，跳过空槽与 enabled:false）。 */
export function getCombatEffectIds(state: SkillLoadoutState, skillId: string): string[] {
    const slots = state.skillEffectMap[skillId];
    if (!slots?.length) {
        const row = skillRow(skillId);
        return normalizeEffectIds(row?.effectIds).filter(isEffectEnabled);
    }
    return slots.filter((id): id is string => !!id && isEffectEnabled(id));
}

export function getSkillEffectSlotCount(skillId: string): number {
    const row = skillRow(skillId);
    return Number(row?.effectSlotCount) || DEFAULT_EFFECT_SLOT_COUNT;
}

export function getSkillIconPath(skillId: string): string | undefined {
    if (!skillId) return undefined;
    const path = skillRow(skillId)?.iconPath;
    if (typeof path === 'string' && path.length > 0) return path;
    return buildWeaponIconPath(skillId);
}

export function getEffectIconPath(effectId: string): string | undefined {
    const path = effectRow(effectId)?.iconPath;
    return typeof path === 'string' ? path : undefined;
}

export function getSkillDisplayName(skillId: string): string {
    const row = skillRow(skillId);
    return String(row?.name ?? displayNameFromId(skillId));
}

function sameDropTarget(a: DropTarget, b: DropTarget): boolean {
    return (
        a.kind === b.kind &&
        a.slot === b.slot &&
        a.index === b.index &&
        (a.skillIndex ?? -1) === (b.skillIndex ?? -1)
    );
}

/** 落点被拒绝时的可读原因；null 表示可以放置。 */
export function explainDropReject(
    source: DropTarget,
    target: DropTarget,
    state: SkillLoadoutState,
): string | null {
    if (source.kind !== target.kind) {
        return `类型不匹配: ${source.kind} 不能放到 ${target.kind} 槽`;
    }
    if (sameDropTarget(source, target)) {
        return '落在原槽位（视为取消）';
    }

    if (source.kind === 'effect') {
        if (target.slot === 'skill_effect') {
            const si = target.skillIndex ?? -1;
            if (si < 0) return 'skill_effect 缺少 skillIndex';
            const sid = state.equippedSkillIds[si];
            if (!sid) return `装备栏 ${si} 无技能，不能挂 Effect`;
            return null;
        }
        if (target.slot === 'unequipped_effect') return null;
        return `Effect 不能放到 ${target.slot}`;
    }

    if (target.slot === 'equipped_skill' || target.slot === 'skill_inventory') return null;
    return `技能不能放到 ${target.slot}`;
}

/** 是否允许落点（同类槽、目标槽可写入）。 */
export function canAcceptDrop(source: DropTarget, target: DropTarget, state: SkillLoadoutState): boolean {
    return explainDropReject(source, target, state) == null;
}

/** 同类槽位拖拽：交换或移动 payload。 */
export function applyDragDrop(
    state: SkillLoadoutState,
    source: DropTarget,
    target: DropTarget,
    payloadId: string,
): boolean {
    if (!canAcceptDrop(source, target, state)) return false;

    if (source.kind === 'effect') {
        return applyEffectDrag(state, source, target, payloadId);
    }
    return applySkillDrag(state, source, target, payloadId);
}

/** 交换写入失败原因；null 表示可写入。 */
export function explainApplyReject(
    state: SkillLoadoutState,
    source: DropTarget,
    target: DropTarget,
    payloadId: string,
): string | null {
    const dropReason = explainDropReject(source, target, state);
    if (dropReason) return dropReason;

    if (source.kind === 'effect') {
        const srcVal = readEffectAt(state, source);
        const tgtVal = readEffectAt(state, target);
        if (srcVal !== payloadId && srcVal != null) {
            return `源槽数据不一致: payload=${payloadId}, 源槽实际=${srcVal ?? '空'}`;
        }
        if (source.slot === 'skill_effect' && source.skillIndex != null) {
            const sid = state.equippedSkillIds[source.skillIndex];
            if (!sid) return `源技能槽 ${source.skillIndex} 无装备技能`;
        }
        if (target.slot === 'skill_effect' && target.skillIndex != null) {
            const sid = state.equippedSkillIds[target.skillIndex];
            if (!sid) return `目标技能槽 ${target.skillIndex} 无装备技能`;
        }
        void tgtVal;
        return null;
    }

    const srcVal = readSkillAt(state, source);
    const tgtVal = readSkillAt(state, target);
    if (srcVal !== payloadId) {
        return `源槽技能不一致: payload=${payloadId}, 源槽实际=${srcVal ?? '空'}`;
    }
    void tgtVal;
    return null;
}

function applyEffectDrag(
    state: SkillLoadoutState,
    source: DropTarget,
    target: DropTarget,
    payloadId: string,
): boolean {
    if (explainApplyReject(state, source, target, payloadId)) return false;

    const srcVal = readEffectAt(state, source);
    const tgtVal = readEffectAt(state, target);
    writeEffectAt(state, source, tgtVal);
    writeEffectAt(state, target, payloadId);
    state.dirty = true;
    return true;
}

function applySkillDrag(
    state: SkillLoadoutState,
    source: DropTarget,
    target: DropTarget,
    payloadId: string,
): boolean {
    if (explainApplyReject(state, source, target, payloadId)) return false;

    const srcVal = readSkillAt(state, source);
    const tgtVal = readSkillAt(state, target);
    writeSkillAt(state, source, tgtVal);
    writeSkillAt(state, target, payloadId);
    state.dirty = true;
    return true;
}

function readEffectAt(state: SkillLoadoutState, t: DropTarget): string | null {
    if (t.slot === 'unequipped_effect') {
        const id = state.unequippedEffectIds[t.index];
        return id && id.length > 0 ? id : null;
    }
    if (t.slot === 'skill_effect' && t.skillIndex != null) {
        const sid = state.equippedSkillIds[t.skillIndex];
        if (!sid) return null;
        return state.skillEffectMap[sid]?.[t.index] ?? null;
    }
    return null;
}

function writeEffectAt(state: SkillLoadoutState, t: DropTarget, value: string | null): void {
    if (t.slot === 'unequipped_effect') {
        while (state.unequippedEffectIds.length <= t.index) {
            state.unequippedEffectIds.push('');
        }
        state.unequippedEffectIds[t.index] = value == null || value.length === 0 ? '' : value;
        return;
    }
    if (t.slot === 'skill_effect' && t.skillIndex != null) {
        const sid = state.equippedSkillIds[t.skillIndex];
        if (!sid) return;
        if (!state.skillEffectMap[sid]) {
            state.skillEffectMap[sid] = Array.from({ length: getSkillEffectSlotCount(sid) }, () => null);
        }
        state.skillEffectMap[sid][t.index] = value;
    }
}

function readSkillAt(state: SkillLoadoutState, t: DropTarget): string | null {
    if (t.slot === 'equipped_skill') {
        return state.equippedSkillIds[t.index] ?? null;
    }
    if (t.slot === 'skill_inventory') {
        const id = state.ownedSkillIds[t.index];
        return id && id.length > 0 ? id : null;
    }
    return null;
}

function writeSkillAt(state: SkillLoadoutState, t: DropTarget, value: string | null): void {
    if (t.slot === 'equipped_skill') {
        const prev = state.equippedSkillIds[t.index];
        state.equippedSkillIds[t.index] = value;
        if (value && !state.skillEffectMap[value]) {
            const row = skillRow(value);
            const slotCount = Number(row?.effectSlotCount) || DEFAULT_EFFECT_SLOT_COUNT;
            const defaults = normalizeEffectIds(row?.effectIds);
            const slots: (string | null)[] = Array.from({ length: slotCount }, () => null);
            defaults.forEach((eid, idx) => {
                if (idx < slots.length) slots[idx] = eid;
            });
            state.skillEffectMap[value] = slots;
        }
        if (prev && prev !== value && !state.equippedSkillIds.includes(prev)) {
            if (!state.ownedSkillIds.includes(prev)) {
                state.ownedSkillIds.push(prev);
            }
        }
        return;
    }
    if (t.slot === 'skill_inventory') {
        while (state.ownedSkillIds.length <= t.index) {
            state.ownedSkillIds.push('');
        }
        state.ownedSkillIds[t.index] = value == null ? '' : value;
    }
}
