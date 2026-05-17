import {
    EFFECT_BOX_NAME,
    EFFECT_BOX_SKILL_PREFIX,
    EFFECT_BOX_SLOT_COUNT,
    EFFECT_BTN_GAP,
    EFFECT_BTN_HEIGHT,
    EFFECT_BTN_NAME,
    EFFECT_BTN_WIDTH,
    SKILL_BASE_BAR_NAME,
    SKILL_BASE_BAR_NAMES,
    SKILL_BOX_NAME,
    SKILL_ICON_SIZE,
    SKILL_BOX_SLOT_COUNT,
    SKILL_SELECT_PANEL_NAME,
} from '../../../defines';
import type { SkillLoadoutState } from '../../../ecs/components/SkillLoadoutState';
import { getSkillEffectSlotCount } from '../../skill/SkillLoadoutModel';
import { findDescendantByName, setNodeVisible } from '../UiNodeUtil';
import { bindEffectIcon, bindSkillIcon } from './SkillIconBinder';
import { layoutHorizontal } from './SkillSlotLayout';
import type { DragSlotBinding } from './SkillDragService';
import { createEffectBtn, createSkillBar } from './UiWidgetFactory';

export class SkillSelectPanelView {
    private panelRoot: any = null;
    private effectBox: any = null;
    private skillBox: any = null;
    private equippedBars: any[] = [];
    private effectBoxBySkill: any[] = [];
    private effectTemplate: any = null;
    private slotsBuilt = false;

    private dynamicEffectBtns: any[] = [];
    private dynamicSkillBars: any[] = [];
    private dynamicSkillEffectBtns: any[][] = [[], [], []];

    init(mainUiRoot: any): void {
        this.panelRoot = findDescendantByName(mainUiRoot, SKILL_SELECT_PANEL_NAME);
        if (!this.panelRoot) {
            console.warn('SkillSelectPanelView: SkillSelectPanel node not found');
            return;
        }
        setNodeVisible(this.panelRoot, false);

        this.effectBox = findDescendantByName(this.panelRoot, EFFECT_BOX_NAME);
        this.skillBox = findDescendantByName(this.panelRoot, SKILL_BOX_NAME);
        this.equippedBars = SKILL_BASE_BAR_NAMES.map((n) => findDescendantByName(mainUiRoot, n));
        this.effectBoxBySkill = [0, 1, 2].map((i) =>
            findDescendantByName(this.panelRoot, `${EFFECT_BOX_SKILL_PREFIX}${i + 1}`),
        );

        if (this.effectBox) {
            this.effectTemplate = findDescendantByName(this.effectBox, EFFECT_BTN_NAME);
            if (this.effectTemplate) {
                this.effectTemplate.visible = false;
            }
        }
    }

    getPanelRoot(): any {
        return this.panelRoot;
    }

    setPanelVisible(visible: boolean): void {
        setNodeVisible(this.panelRoot, visible);
    }

    async onOpen(state: SkillLoadoutState): Promise<void> {
        await this.ensureSlotsBuilt(state);
        await this.refreshAll(state);
    }

    /** 面板隐藏时也可构建格子，保证 refreshAll 能绑定图标。 */
    private async ensureSlotsBuilt(state: SkillLoadoutState): Promise<void> {
        if (!this.slotsBuilt) {
            await this.buildEffectBoxSlots(state);
            this.buildSkillBoxSlots(state);
            this.slotsBuilt = true;
        }
        await this.rebuildSkillEffectSlots(state);
    }

    private async rebuildSkillEffectSlots(state: SkillLoadoutState): Promise<void> {
        for (let si = 0; si < 3; si++) {
            const skillId = state.equippedSkillIds[si];
            const need = skillId ? getSkillEffectSlotCount(skillId) : 0;
            const have = this.dynamicSkillEffectBtns[si].length;
            if (need !== have) {
                for (const btn of this.dynamicSkillEffectBtns[si]) {
                    btn?.removeSelf?.();
                    btn?.destroy?.();
                }
                this.dynamicSkillEffectBtns[si] = [];
            }
        }
        await this.buildSkillEffectSlots(state);
    }

    private async buildEffectBoxSlots(_state: SkillLoadoutState): Promise<void> {
        if (!this.effectBox) return;
        if (this.effectTemplate) {
            this.effectTemplate.visible = false;
        }
        const positions = layoutHorizontal(
            EFFECT_BOX_SLOT_COUNT,
            EFFECT_BTN_WIDTH,
            EFFECT_BTN_HEIGHT,
            EFFECT_BTN_GAP,
        );
        while (this.dynamicEffectBtns.length < EFFECT_BOX_SLOT_COUNT) {
            const btn = await createEffectBtn(
                `EffectBtn_${this.dynamicEffectBtns.length}`,
                this.effectTemplate,
            );
            this.effectBox.addChild(btn);
            this.dynamicEffectBtns.push(btn);
        }
        for (let i = 0; i < EFFECT_BOX_SLOT_COUNT; i++) {
            const btn = this.dynamicEffectBtns[i];
            btn.x = positions[i].x;
            btn.y = positions[i].y;
            btn.visible = true;
        }
    }

    private buildSkillBoxSlots(_state: SkillLoadoutState): void {
        if (!this.skillBox) return;
        const template = findDescendantByName(this.skillBox, SKILL_BASE_BAR_NAME);
        if (template) template.visible = false;

        const count = SKILL_BOX_SLOT_COUNT;
        const cols = 4;
        const gap = 12;
        const cell = SKILL_ICON_SIZE + gap;

        while (this.dynamicSkillBars.length < count) {
            const bar = createSkillBar(`SkillBaseBar_${this.dynamicSkillBars.length}`, template);
            this.skillBox.addChild(bar);
            this.dynamicSkillBars.push(bar);
        }
        for (let i = 0; i < count; i++) {
            const bar = this.dynamicSkillBars[i];
            bar.x = (i % cols) * cell + 9;
            bar.y = Math.floor(i / cols) * cell;
            bar.visible = true;
        }
    }

    private async buildSkillEffectSlots(state: SkillLoadoutState): Promise<void> {
        for (let si = 0; si < 3; si++) {
            const box = this.effectBoxBySkill[si];
            if (!box) continue;
            const template = findDescendantByName(box, EFFECT_BTN_NAME);
            if (template) template.visible = false;

            const skillId = state.equippedSkillIds[si];
            const slotCount = skillId ? getSkillEffectSlotCount(skillId) : 0;
            const startX = 111;
            const positions = layoutHorizontal(slotCount, EFFECT_BTN_WIDTH, EFFECT_BTN_HEIGHT, EFFECT_BTN_GAP);

            while (this.dynamicSkillEffectBtns[si].length < slotCount) {
                const btn = await createEffectBtn(
                    `EffectBtn_s${si}_${this.dynamicSkillEffectBtns[si].length}`,
                    template ?? this.effectTemplate,
                );
                box.addChild(btn);
                this.dynamicSkillEffectBtns[si].push(btn);
            }
            for (let i = 0; i < slotCount; i++) {
                const btn = this.dynamicSkillEffectBtns[si][i];
                btn.x = startX + positions[i].x;
                btn.y = 9;
                btn.visible = true;
            }
            for (let i = slotCount; i < this.dynamicSkillEffectBtns[si].length; i++) {
                this.dynamicSkillEffectBtns[si][i].visible = false;
            }
        }
    }

    async refreshAll(state: SkillLoadoutState): Promise<void> {
        await this.ensureSlotsBuilt(state);

        for (let i = 0; i < 3; i++) {
            await bindSkillIcon(this.equippedBars[i], state.equippedSkillIds[i]);
            const detailBar = findDescendantByName(
                this.effectBoxBySkill[i],
                `SkillBaseBar${i + 1}_1`,
            );
            await bindSkillIcon(detailBar, state.equippedSkillIds[i]);
        }

        for (let i = 0; i < EFFECT_BOX_SLOT_COUNT; i++) {
            const eid = state.unequippedEffectIds[i] || null;
            const normalized = eid && eid.length > 0 ? eid : null;
            await bindEffectIcon(this.dynamicEffectBtns[i], normalized);
        }

        for (let i = 0; i < SKILL_BOX_SLOT_COUNT; i++) {
            const raw = state.ownedSkillIds[i];
            const sid = raw && raw.length > 0 ? raw : null;
            const bar = this.dynamicSkillBars[i];
            if (!bar) continue;
            await bindSkillIcon(bar, sid);
        }

        for (let si = 0; si < 3; si++) {
            const sid = state.equippedSkillIds[si];
            const slots = sid ? state.skillEffectMap[sid] ?? [] : [];
            for (let ei = 0; ei < this.dynamicSkillEffectBtns[si].length; ei++) {
                const eid = slots[ei] ?? null;
                await bindEffectIcon(this.dynamicSkillEffectBtns[si][ei], eid);
            }
        }
    }

    collectDragBindings(state: SkillLoadoutState): DragSlotBinding[] {
        const bindings: DragSlotBinding[] = [];

        for (let i = 0; i < EFFECT_BOX_SLOT_COUNT; i++) {
            const btn = this.dynamicEffectBtns[i];
            if (!btn) continue;
            bindings.push({
                node: btn,
                target: { kind: 'effect', slot: 'unequipped_effect', index: i },
                getEffectId: () => {
                    const id = state.unequippedEffectIds[i];
                    return id && id.length > 0 ? id : null;
                },
            });
        }

        for (let si = 0; si < 3; si++) {
            const sid = state.equippedSkillIds[si];
            const slots = sid ? state.skillEffectMap[sid] ?? [] : [];
            for (let ei = 0; ei < this.dynamicSkillEffectBtns[si].length; ei++) {
                const btn = this.dynamicSkillEffectBtns[si][ei];
                bindings.push({
                    node: btn,
                    target: { kind: 'effect', slot: 'skill_effect', index: ei, skillIndex: si },
                    getEffectId: () => slots[ei] ?? null,
                });
            }
        }

        for (let i = 0; i < 3; i++) {
            const bar = this.equippedBars[i];
            if (!bar) continue;
            bindings.push({
                node: bar,
                target: { kind: 'skill', slot: 'equipped_skill', index: i },
                getSkillId: () => state.equippedSkillIds[i],
            });
        }

        for (let i = 0; i < SKILL_BOX_SLOT_COUNT; i++) {
            const bar = this.dynamicSkillBars[i];
            if (!bar) continue;
            bindings.push({
                node: bar,
                target: { kind: 'skill', slot: 'skill_inventory', index: i },
                getSkillId: () => {
                    const raw = state.ownedSkillIds[i];
                    return raw && raw.length > 0 ? raw : null;
                },
            });
        }

        return bindings;
    }

    dispose(): void {
        this.dynamicEffectBtns = [];
        this.dynamicSkillBars = [];
        this.dynamicSkillEffectBtns = [[], [], []];
        this.slotsBuilt = false;
    }
}
