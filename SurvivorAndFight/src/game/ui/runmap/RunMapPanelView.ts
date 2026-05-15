import {
    BACK_BTN_NAME,
    LINE_NODE_PREFAB,
    MAP_NODE_PREFAB,
    MAP_PANEL_NAME,
    RUN_MAP_NODE_SIZE,
    RUN_MAP_PANEL_PREFAB,
    UI_MAP_PANEL_MISSING,
} from '../../../defines';
import type { RunMapState } from '../../run/RunMapState';
import type { RunAct, RunNodeType } from '../../run/RunTypes';
import { bindClick, findDescendantByName, unbindClick } from '../UiNodeUtil';
import { applyMapNodeIcon } from './MapNodeIconUtil';
import { layoutActNodes, type NodeLayoutPos } from './RunMapLayout';
import { applyLineBetween } from './LineLayoutUtil';

type NodeClickHandler = (nodeId: string) => void;

export class RunMapPanelView {
    private root: any = null;
    private backBtn: any = null;
    private mapPanel: any = null;
    private mapState: RunMapState | null = null;
    private onBack: (() => void) | null = null;
    private onNodeClicked: NodeClickHandler | null = null;

    private readonly nodeViews = new Map<string, any>();
    private readonly nodePositions = new Map<string, NodeLayoutPos>();
    private readonly lineViews: Array<{ line: any; fromId: string; toId: string }> = [];

    private dragStartY = 0;
    private panelStartY = 0;
    private dragging = false;
    private scrollMinY = 0;
    private scrollMaxY = 0;

    async initialize(): Promise<void> {
        if (this.root) return;
        this.root = await Laya.Prefab.instantiate(RUN_MAP_PANEL_PREFAB);
        this.backBtn = findDescendantByName(this.root, BACK_BTN_NAME);
        this.mapPanel = findDescendantByName(this.root, MAP_PANEL_NAME);
        if (!this.mapPanel) {
            throw new Error(`[UI] ${UI_MAP_PANEL_MISSING}`);
        }
        this.removeEditorPlaceholders();
        if (this.mapPanel) {
            this.mapPanel.mouseEnabled = true;
        }
        this.recalcScrollBounds();
    }

    bindMapState(state: RunMapState): void {
        this.mapState = state;
    }

    setOnBack(handler: (() => void) | null): void {
        this.onBack = handler;
    }

    setOnNodeClicked(handler: NodeClickHandler | null): void {
        this.onNodeClicked = handler;
    }

    show(): void {
        if (!this.root) return;
        if (!this.root.parent) {
            Laya.stage.addChild(this.root);
        }
        bindClick(this.backBtn, this, this.handleBack);
        this.bindScrollEvents(true);
        void this.refreshGraph().then(() => {
            if (this.mapState) {
                this.setScrollToNode(this.mapState.currentNodeId);
            }
        });
    }

    hide(): void {
        unbindClick(this.backBtn, this, this.handleBack);
        this.bindScrollEvents(false);
        if (this.root?.parent?.removeChild) {
            this.root.parent.removeChild(this.root);
        }
    }

    dispose(): void {
        this.hide();
        this.clearMapChildren();
        if (this.root?.destroy) {
            this.root.destroy();
        }
        this.root = null;
        this.mapPanel = null;
        this.mapState = null;
    }

    async refreshGraph(): Promise<void> {
        if (!this.mapPanel || !this.mapState) return;
        this.clearMapChildren();

        const act = this.mapState.getCurrentAct();
        const panelWidth = this.mapPanel.width ?? 932;
        const panelHeight = this.mapPanel.height ?? 1644;
        const positions = layoutActNodes(act, panelWidth, panelHeight);
        this.nodePositions.clear();
        for (const [id, pos] of positions) {
            this.nodePositions.set(id, pos);
        }

        await this.drawEdges(act, positions);
        await this.drawNodes(act, positions);
        this.recalcScrollBounds();
    }

    setScrollToNode(nodeId: string): void {
        if (!this.mapPanel) return;
        const pos = this.nodePositions.get(nodeId);
        if (!pos) return;
        const viewH = 500;
        const targetY = -(pos.y - viewH * 0.6);
        this.mapPanel.y = this.clampScroll(targetY);
    }

    private async drawNodes(act: RunAct, positions: Map<string, NodeLayoutPos>): Promise<void> {
        for (const layer of act.layers) {
            for (const node of layer.nodes) {
                const pos = positions.get(node.id);
                if (!pos) continue;
                const view = await this.createMapNodeView(node.id, node.type);
                const size = RUN_MAP_NODE_SIZE;
                this.placeNodeCenter(view, pos.x, pos.y, size);
                view.name = node.id;
                this.mapPanel.addChild(view);
                this.nodeViews.set(node.id, view);
                this.applyNodeVisual(node.id, view);
            }
        }
    }

    private async drawEdges(act: RunAct, positions: Map<string, NodeLayoutPos>): Promise<void> {
        const seen = new Set<string>();
        for (const layer of act.layers) {
            for (const [fromId, toId] of layer.edges) {
                const key = `${fromId}->${toId}`;
                if (seen.has(key)) continue;
                seen.add(key);
                const from = positions.get(fromId);
                const to = positions.get(toId);
                if (!from || !to) continue;
                const line = await this.createLineView(from, to, fromId, toId);
                if (!line) continue;
                this.mapPanel.addChildAt(line, 0);
                this.lineViews.push({ line, fromId, toId });
            }
        }
    }

    private async createMapNodeView(nodeId: string, type: RunNodeType): Promise<any> {
        const view = await Laya.Prefab.instantiate(MAP_NODE_PREFAB);
        if (!view) {
            throw new Error('[UI] MapNode prefab instantiate failed');
        }
        await applyMapNodeIcon(view, type);
        const handler = () => this.onNodeClicked?.(nodeId);
        bindClick(view, this, handler);
        (view as any)._mapClickHandler = handler;
        return view;
    }

    private async createLineView(
        from: NodeLayoutPos,
        to: NodeLayoutPos,
        fromId: string,
        toId: string,
    ): Promise<any> {
        const line = await Laya.Prefab.instantiate(LINE_NODE_PREFAB);
        if (!line) return null;

        applyLineBetween(line, from, to);
        this.syncLineMovedVisible(line, fromId, toId);
        return line;
    }

    private syncLineMovedVisible(line: any, fromId: string, toId: string): void {
        const moved = findDescendantByName(line, 'MovedlineNode');
        const show = this.mapState?.isTraversedEdge(fromId, toId) ?? false;
        if (moved?.visible !== undefined) {
            moved.visible = show;
        }
    }

    private placeNodeCenter(view: any, cx: number, cy: number, size: number): void {
        if (typeof view.setPivot === 'function') {
            view.setPivot(0.5, 0.5, true);
        } else if (view.pivotX !== undefined) {
            view.pivotX = 0.5;
            view.pivotY = 0.5;
        } else if (view.anchorX !== undefined) {
            view.anchorX = 0.5;
            view.anchorY = 0.5;
        }
        view.x = cx - size * 0.5;
        view.y = cy - size * 0.5;
    }

    private applyNodeVisual(nodeId: string, view: any): void {
        const state = this.mapState;
        if (!state) return;

        if (state.isAwaitingStartConfirm()) {
            const isStart = state.currentNodeId === nodeId;
            view.alpha = isStart ? 1 : 0.35;
            view.mouseEnabled = isStart;
            if (view.selected !== undefined) view.selected = isStart;
            return;
        }

        const isCurrent = state.currentNodeId === nodeId;
        const isAvailable = state.availableNext.includes(nodeId);
        const isVisited = state.visited.has(nodeId);

        if (isCurrent) {
            view.alpha = 1;
            view.mouseEnabled = true;
            if (view.selected !== undefined) view.selected = true;
        } else if (isAvailable) {
            view.alpha = 1;
            view.mouseEnabled = true;
            if (view.selected !== undefined) view.selected = false;
        } else if (isVisited) {
            view.alpha = 0.55;
            view.mouseEnabled = false;
        } else {
            view.alpha = 0.35;
            view.mouseEnabled = false;
        }
    }

    private recalcScrollBounds(): void {
        const panelH = this.mapPanel?.height ?? 1644;
        const viewH = 500;
        this.scrollMinY = -(panelH - viewH + 120);
        this.scrollMaxY = 120;
    }

    private bindScrollEvents(bind: boolean): void {
        const stage = Laya.stage as any;
        if (!stage?.on) return;

        stage.off(Laya.Event.MOUSE_WHEEL, this, this.onWheel);
        if (this.mapPanel) {
            this.mapPanel.off(Laya.Event.MOUSE_DOWN, this, this.onDragStart);
            this.mapPanel.off(Laya.Event.MOUSE_MOVE, this, this.onDragMove);
            this.mapPanel.off(Laya.Event.MOUSE_UP, this, this.onDragEnd);
            this.mapPanel.off(Laya.Event.MOUSE_OUT, this, this.onDragEnd);
        }
        Laya.stage.off(Laya.Event.MOUSE_MOVE, this, this.onDragMove);
        Laya.stage.off(Laya.Event.MOUSE_UP, this, this.onDragEnd);

        if (!bind) return;

        stage.on(Laya.Event.MOUSE_WHEEL, this, this.onWheel);
        if (this.mapPanel) {
            this.mapPanel.on(Laya.Event.MOUSE_DOWN, this, this.onDragStart);
            Laya.stage.on(Laya.Event.MOUSE_MOVE, this, this.onDragMove);
            Laya.stage.on(Laya.Event.MOUSE_UP, this, this.onDragEnd);
        }
    }

    private onDragStart(e: any): void {
        if (!this.mapPanel) return;
        this.dragging = true;
        this.dragStartY = e.stageY ?? 0;
        this.panelStartY = this.mapPanel.y ?? 0;
    }

    private onDragMove(e: any): void {
        if (!this.dragging || !this.mapPanel) return;
        const dy = (e.stageY ?? 0) - this.dragStartY;
        this.mapPanel.y = this.clampScroll(this.panelStartY + dy);
    }

    private onDragEnd(): void {
        this.dragging = false;
    }

    private onWheel(e: any): void {
        if (!this.mapPanel || !this.root?.parent) return;
        const delta = e.delta ?? e.mouseWheelDelta ?? 0;
        if (!delta) return;
        this.mapPanel.y = this.clampScroll((this.mapPanel.y ?? 0) + delta * 1.5);
    }

    private clampScroll(y: number): number {
        return Math.max(this.scrollMinY, Math.min(this.scrollMaxY, y));
    }

    private removeEditorPlaceholders(): void {
        if (!this.root) return;
        const placeholder = findDescendantByName(this.root, 'MapNode');
        if (placeholder && placeholder !== this.mapPanel && placeholder.parent) {
            placeholder.parent.removeChild(placeholder);
            placeholder.destroy?.();
        }
    }

    private clearMapChildren(): void {
        if (!this.mapPanel) return;
        for (const [, view] of this.nodeViews) {
            const handler = (view as any)._mapClickHandler;
            if (handler) unbindClick(view, this, handler);
            view.destroy?.();
        }
        this.nodeViews.clear();
        for (const { line } of this.lineViews) {
            line.destroy?.();
        }
        this.lineViews.length = 0;
    }

    private handleBack(): void {
        this.onBack?.();
    }
}
