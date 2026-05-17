import type { SkillLoadoutState } from '../../../ecs/components/SkillLoadoutState';
import {
    applyDragDrop,
    explainApplyReject,
    explainDropReject,
    getEffectIconPath,
    getSkillIconPath,
    type DragKind,
    type DropTarget,
    type LoadoutSlotKind,
} from '../../skill/SkillLoadoutModel';
import { EFFECT_ICON_SIZE, LONG_PRESS_MS, SKILL_ICON_SIZE } from '../../../defines';
import {
    bindEffectIcon,
    bindSkillIcon,
    createDragGhost,
    setEffectSlotIconVisible,
    setSkillSlotIconVisible,
} from './SkillIconBinder';
import {
    formatDropTarget,
    skillDragLogError,
    skillDragLogInfo,
    skillDragLogWarn,
} from './SkillDragLog';
import {
    enableSlotPointer,
    getNodeRectInRoot,
    isPointInStageRect,
    pointerToRootLocal,
    readPointerStageXY,
} from './SkillSlotHitTest';

export interface DragPayload {
    id: string;
    sourceSlot: LoadoutSlotKind;
    index: number;
    skillIndex?: number;
}

export interface DragSlotBinding {
    node: any;
    target: DropTarget;
    getEffectId?: () => string | null;
    getSkillId?: () => string | null;
}

export class SkillDragService {
    private kind: DragKind | null = null;
    private payload: DragPayload | null = null;
    private sourceTarget: DropTarget | null = null;
    private ghost: any = null;
    private pressTimer: ReturnType<typeof setTimeout> | null = null;
    private pressing = false;
    private pointerDown = false;
    private startX = 0;
    private startY = 0;
    private hoverTarget: DropTarget | null = null;
    /** MainUIPanel 根：指针与槽位包围盒统一在此坐标系。 */
    private coordinateRoot: any = null;
    private lastEvent: any = null;

    private readonly bindings: DragSlotBinding[] = [];
    private onStateChanged: (() => void) | null = null;

    loadoutState: SkillLoadoutState | null = null;

    setCoordinateRoot(root: any): void {
        this.coordinateRoot = root;
    }

    setOnStateChanged(cb: () => void): void {
        this.onStateChanged = cb;
    }

    registerSlot(binding: DragSlotBinding): void {
        this.bindings.push(binding);
        const node = binding.node;
        if (!node?.on) {
            skillDragLogError('槽位无法监听 MOUSE_DOWN（节点无 on）', {
                slot: formatDropTarget(binding.target),
                nodeName: String(node?.name ?? 'null'),
            });
            return;
        }
        enableSlotPointer(node);
        node.on(Laya.Event.MOUSE_DOWN, this, this.onMouseDown, [binding]);
    }

    logBindingsSummary(): void {
        const root = this.coordinateRoot;
        const rows = this.bindings.map((b) => {
            const id = b.target.kind === 'effect'
                ? b.getEffectId?.()
                : b.getSkillId?.();
            const rect = root ? getNodeRectInRoot(b.node, root) : null;
            return {
                slot: formatDropTarget(b.target),
                id: id ?? '(空)',
                bounds: rect
                    ? `${Math.round(rect.left)},${Math.round(rect.top)}-${Math.round(rect.right)},${Math.round(rect.bottom)}`
                    : 'n/a',
            };
        });
        skillDragLogInfo(`已注册 ${this.bindings.length} 个拖拽槽 (root=${String(root?.name ?? 'null')})`, {
            slots: rows,
        });
    }

    attachStageListeners(): void {
        Laya.stage.on(Laya.Event.MOUSE_MOVE, this, this.onStageMouseMove);
        Laya.stage.on(Laya.Event.MOUSE_UP, this, this.onStageMouseUp);
    }

    detachStageListeners(): void {
        Laya.stage.off(Laya.Event.MOUSE_MOVE, this, this.onStageMouseMove);
        Laya.stage.off(Laya.Event.MOUSE_UP, this, this.onStageMouseUp);
    }

    clearBindings(): void {
        for (const b of this.bindings) {
            b.node?.off?.(Laya.Event.MOUSE_DOWN, this, this.onMouseDown);
        }
        this.bindings.length = 0;
        this.hoverTarget = null;
    }

    private getPointerLocal(e?: any): { x: number; y: number } | null {
        const ev = e ?? this.lastEvent;
        if (this.coordinateRoot) {
            return pointerToRootLocal(this.coordinateRoot, ev);
        }
        return readPointerStageXY(ev);
    }

    private onStageMouseMove(e: any): void {
        this.lastEvent = e;
        this.onMouseMove();
    }

    private onStageMouseUp(e: any): void {
        this.lastEvent = e;
        this.onMouseUp();
    }

    private onMouseDown(binding: DragSlotBinding, e?: any): void {
        if (e) this.lastEvent = e;
        if (this.kind) {
            skillDragLogWarn('忽略按下：已有拖拽进行中', {
                slot: formatDropTarget(binding.target),
            });
            return;
        }

        const id = binding.target.kind === 'effect'
            ? binding.getEffectId?.()
            : binding.getSkillId?.();
        if (!id) {
            skillDragLogWarn('按下无效：槽位为空', {
                slot: formatDropTarget(binding.target),
            });
            return;
        }

        const ptr = this.getPointerLocal(e);
        this.pointerDown = true;
        this.pressing = true;
        this.startX = ptr?.x ?? 0;
        this.startY = ptr?.y ?? 0;
        const payload: DragPayload = {
            id,
            sourceSlot: binding.target.slot,
            index: binding.target.index,
            skillIndex: binding.target.skillIndex,
        };

        skillDragLogInfo('按下，等待长按', {
            slot: formatDropTarget(binding.target),
            id,
            pointer: ptr,
        });

        this.clearPressTimer();
        this.pressTimer = setTimeout(() => {
            if (!this.pressing || !this.pointerDown) return;
            void this.beginLongPress(binding.target.kind, payload, binding);
        }, LONG_PRESS_MS);
        if (e?.stopPropagation) e.stopPropagation();
    }

    private async beginLongPress(
        kind: DragKind,
        payload: DragPayload,
        binding: DragSlotBinding,
    ): Promise<void> {
        const iconPath = kind === 'effect'
            ? getEffectIconPath(payload.id)
            : getSkillIconPath(payload.id);
        if (!iconPath) {
            skillDragLogError('长按失败：找不到图标路径', {
                kind,
                id: payload.id,
                slot: formatDropTarget(binding.target),
            });
            return;
        }

        this.kind = kind;
        this.payload = payload;
        this.sourceTarget = { ...binding.target };
        this.hoverTarget = { ...binding.target };

        if (kind === 'effect') {
            setEffectSlotIconVisible(binding.node, false);
        } else {
            setSkillSlotIconVisible(binding.node, false);
        }

        const size = kind === 'effect' ? EFFECT_ICON_SIZE : SKILL_ICON_SIZE;
        this.ghost = await createDragGhost(iconPath, size);
        this.ghost.mouseEnabled = false;
        this.ghost.zOrder = 100000;

        const parent = this.coordinateRoot ?? Laya.stage;
        parent.addChild(this.ghost);

        const ptr = this.getPointerLocal();
        if (ptr) this.updateGhostAndHover(ptr.x, ptr.y);

        skillDragLogInfo('开始拖拽', {
            kind,
            id: payload.id,
            from: formatDropTarget(binding.target),
            pointer: ptr,
        });
    }

    private updateGhostAndHover(x: number, y: number): void {
        if (this.ghost) {
            const w = Number(this.ghost.width) || SKILL_ICON_SIZE;
            const h = Number(this.ghost.height) || SKILL_ICON_SIZE;
            this.ghost.x = x - w * 0.5;
            this.ghost.y = y - h * 0.5;
        }
        if (this.kind) {
            this.hoverTarget = this.findSlotByLocalPoint(x, y, this.kind);
        }
    }

    private findSlotByLocalPoint(x: number, y: number, kindFilter?: DragKind): DropTarget | null {
        const root = this.coordinateRoot;
        if (!root) return null;

        for (let i = this.bindings.length - 1; i >= 0; i--) {
            const b = this.bindings[i];
            if (kindFilter && b.target.kind !== kindFilter) continue;
            const rect = getNodeRectInRoot(b.node, root);
            if (!rect) continue;
            if (isPointInStageRect(x, y, rect)) {
                return b.target;
            }
        }
        return null;
    }

    private buildSourceTarget(): DropTarget | null {
        if (!this.kind || !this.payload) return null;
        return {
            kind: this.kind,
            slot: this.payload.sourceSlot,
            index: this.payload.index,
            skillIndex: this.payload.skillIndex,
        };
    }

    private endDrag(outcome: 'swap_ok' | 'cancelled' | 'failed', detail?: Record<string, unknown>): void {
        if (outcome === 'swap_ok') {
            skillDragLogInfo('交换成功', detail);
        } else if (outcome === 'failed') {
            skillDragLogError('交换失败', detail);
        } else {
            skillDragLogWarn('拖拽取消/还原', detail);
        }

        this.destroyGhost();
        this.kind = null;
        this.payload = null;
        this.sourceTarget = null;
        this.hoverTarget = null;
        this.pressing = false;
        this.pointerDown = false;
        this.onStateChanged?.();
    }

    private destroyGhost(): void {
        if (!this.ghost) return;
        this.ghost.removeSelf?.();
        if (typeof this.ghost.destroy === 'function') this.ghost.destroy(true);
        this.ghost = null;
    }

    private cancelPressOnly(): void {
        const ptr = this.getPointerLocal();
        skillDragLogWarn('长按被打断：移动超过阈值', {
            dx: (ptr?.x ?? 0) - this.startX,
            dy: (ptr?.y ?? 0) - this.startY,
        });
        this.clearPressTimer();
        this.pressing = false;
        this.pointerDown = false;
    }

    private probeBoundsAt(x: number, y: number, kind?: DragKind): Array<Record<string, unknown>> {
        const root = this.coordinateRoot;
        return this.bindings.map((b) => {
            if (kind && b.target.kind !== kind) {
                return { slot: formatDropTarget(b.target), hit: false, skip: 'kind' };
            }
            const rect = root ? getNodeRectInRoot(b.node, root) : null;
            const hit = rect ? isPointInStageRect(x, y, rect) : false;
            return { slot: formatDropTarget(b.target), hit, bounds: rect };
        });
    }

    private onMouseMove(): void {
        const ptr = this.getPointerLocal();
        if (!ptr) return;

        if (this.pressing && !this.kind && this.pointerDown) {
            const dx = ptr.x - this.startX;
            const dy = ptr.y - this.startY;
            if (dx * dx + dy * dy > 36) {
                this.cancelPressOnly();
            }
        }
        if (this.kind) {
            this.updateGhostAndHover(ptr.x, ptr.y);
        }
    }

    private onMouseUp(): void {
        this.clearPressTimer();

        if (!this.kind) {
            this.pointerDown = false;
            this.pressing = false;
            return;
        }

        const state = this.loadoutState;
        const source = this.buildSourceTarget();
        const ptr = this.getPointerLocal();
        if (!ptr) {
            this.endDrag('failed', { reason: '无法读取指针坐标' });
            return;
        }

        const hit = this.hoverTarget ?? this.findSlotByLocalPoint(ptr.x, ptr.y, this.kind);

        if (!state) {
            this.endDrag('failed', {
                reason: 'loadoutState 为空',
                from: source ? formatDropTarget(source) : '?',
            });
            return;
        }

        if (!source || !this.payload) {
            this.endDrag('failed', { reason: '内部状态丢失 source/payload' });
            return;
        }

        if (!hit) {
            this.endDrag('cancelled', {
                reason: '未命中任何槽位（MainUI 本地包围盒）',
                pointer: ptr,
                stagePointer: readPointerStageXY(this.lastEvent),
                from: formatDropTarget(source),
                boundsProbe: this.probeBoundsAt(ptr.x, ptr.y, this.kind),
            });
            return;
        }

        const rejectReason = explainDropReject(source, hit, state);
        if (rejectReason) {
            this.endDrag('cancelled', {
                reason: rejectReason,
                from: formatDropTarget(source),
                to: formatDropTarget(hit),
                pointer: ptr,
            });
            return;
        }

        const applyReject = explainApplyReject(state, source, hit, this.payload.id);
        if (applyReject) {
            this.endDrag('failed', {
                reason: applyReject,
                from: formatDropTarget(source),
                to: formatDropTarget(hit),
            });
            return;
        }

        const swapped = applyDragDrop(state, source, hit, this.payload.id);
        if (!swapped) {
            this.endDrag('failed', {
                reason: 'applyDragDrop 返回 false',
                from: formatDropTarget(source),
                to: formatDropTarget(hit),
            });
            return;
        }

        this.endDrag('swap_ok', {
            from: formatDropTarget(source),
            to: formatDropTarget(hit),
            payloadId: this.payload.id,
            pointer: ptr,
        });
    }

    private clearPressTimer(): void {
        if (this.pressTimer != null) {
            clearTimeout(this.pressTimer);
            this.pressTimer = null;
        }
    }

    async refreshBindingIcons(): Promise<void> {
        for (const b of this.bindings) {
            if (b.target.kind === 'effect') {
                await bindEffectIcon(b.node, b.getEffectId?.() ?? null);
            } else {
                await bindSkillIcon(b.node, b.getSkillId?.() ?? null);
            }
        }
    }
}
