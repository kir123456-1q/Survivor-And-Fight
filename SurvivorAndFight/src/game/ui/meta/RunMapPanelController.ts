import {
    REWARD_PANEL_ROUTE_ID,
    RUN_MAP_PANEL_ROUTE_ID,
    UI_POP_MISMATCH,
} from '../../../defines';
import type { RewardPoolContext } from '../../reward/RewardTypes';
import { MetaRunSession } from '../../meta/MetaRunSession';
import type { MetaFlowController } from '../../meta/MetaFlowController';
import type { RunNodeType } from '../../run/RunTypes';
import { findRunNode } from '../../run/RunTypes';
import type { UIStackManager } from '../mvc/UIStackManager';
import { UiControllerBase } from '../mvc/UiControllerBase';
import type { RunMapPanelPayload } from '../runmap/RunMapPanelModel';
import { RunMapPanelModel } from '../runmap/RunMapPanelModel';
import { RunMapPanelView } from '../runmap/RunMapPanelView';

const COMBAT_TYPES: RunNodeType[] = ['Combat', 'Boss', 'Treasure'];

export class RunMapPanelController extends UiControllerBase<RunMapPanelPayload> {
    private readonly model = new RunMapPanelModel();
    private readonly view = new RunMapPanelView();

    constructor(
        private readonly uiStack: UIStackManager,
        private readonly metaFlow: MetaFlowController,
    ) {
        super(RUN_MAP_PANEL_ROUTE_ID);
    }

    protected async onInitialize(): Promise<void> {
        await this.view.initialize();
    }

    protected onShow(payload?: RunMapPanelPayload): void {
        this.model.applyPayload(payload);
        const state = this.model.runMapState;
        if (state) {
            MetaRunSession.runMapState = state;
            this.view.bindMapState(state);
        }
        MetaRunSession.resumeRunMap = async () => {
            if (this.state === 'Hidden') {
                await this.show();
            }
        };

        this.view.setOnBack(() => {
            void this.handleBack();
        });
        this.view.setOnNodeClicked((nodeId) => {
            this.handleNodeClick(nodeId);
        });
        this.view.show();
    }

    protected onHide(): void {
        this.view.hide();
    }

    protected onDispose(): void {
        this.view.dispose();
        if (MetaRunSession.resumeRunMap) {
            MetaRunSession.resumeRunMap = null;
        }
    }

    private async handleBack(): Promise<void> {
        const ok = await this.uiStack.pop(RUN_MAP_PANEL_ROUTE_ID);
        if (!ok) {
            console.warn(`[UI] ${UI_POP_MISMATCH}: expected ${RUN_MAP_PANEL_ROUTE_ID}`);
        }
    }

    private handleNodeClick(nodeId: string): void {
        const state = this.model.runMapState;
        if (!state) return;

        const wasAwaitingStart = state.isAwaitingStartConfirm();
        const result = state.selectNext(nodeId);
        console.log('[UI] ui.meta.runmap.node.clicked', {
            nodeId,
            ok: result.ok,
            code: result.ok ? undefined : result.code,
        });

        if (!result.ok) return;

        void this.view.refreshGraph().then(() => {
            this.view.setScrollToNode(state.currentNodeId);
        });

        if (wasAwaitingStart) {
            return;
        }

        const node = findRunNode(state.graph, nodeId);
        if (!node) return;

        if (node.type === 'Rest') {
            void this.openRewardPanel('rest');
            return;
        }

        if (node.type === 'Unknown') {
            void this.openRewardPanel('unknown');
            return;
        }

        if (COMBAT_TYPES.includes(node.type)) {
            void this.enterCombat(nodeId, node.payloadId, node.type === 'Boss');
        }
    }

    private async openRewardPanel(context: RewardPoolContext): Promise<void> {
        await this.uiStack.push(REWARD_PANEL_ROUTE_ID, { context, applyInCombat: false });
    }

    private async enterCombat(nodeId: string, payloadId: string | null, isBoss: boolean): Promise<void> {
        await this.hide();
        this.metaFlow.goto('Combat', { nodeId, payloadId, isBoss });
    }
}
