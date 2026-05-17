import { SKILL_DRAG_DEBUG_LOG } from '../../../defines';
import type { DropTarget } from '../../skill/SkillLoadoutModel';

/** 格式化槽位，便于控制台筛选 [SkillDrag]。 */
export function formatDropTarget(t: DropTarget): string {
    const si = t.skillIndex != null ? `@skill${t.skillIndex}` : '';
    return `${t.kind}/${t.slot}[${t.index}]${si}`;
}

function formatDetail(detail?: Record<string, unknown>): string {
    if (!detail || Object.keys(detail).length === 0) return '';
    try {
        return JSON.stringify(detail);
    } catch {
        return String(detail);
    }
}

export function skillDragLogError(reason: string, detail?: Record<string, unknown>): void {
    if (!SKILL_DRAG_DEBUG_LOG) return;
    const extra = formatDetail(detail);
    if (extra) console.error(`[SkillDrag] ${reason} ${extra}`);
    else console.error(`[SkillDrag] ${reason}`);
}

export function skillDragLogWarn(reason: string, detail?: Record<string, unknown>): void {
    if (!SKILL_DRAG_DEBUG_LOG) return;
    const extra = formatDetail(detail);
    if (extra) console.warn(`[SkillDrag] ${reason} ${extra}`);
    else console.warn(`[SkillDrag] ${reason}`);
}

export function skillDragLogInfo(reason: string, detail?: Record<string, unknown>): void {
    if (!SKILL_DRAG_DEBUG_LOG) return;
    const extra = formatDetail(detail);
    if (extra) console.log(`[SkillDrag] ${reason} ${extra}`);
    else console.log(`[SkillDrag] ${reason}`);
}
