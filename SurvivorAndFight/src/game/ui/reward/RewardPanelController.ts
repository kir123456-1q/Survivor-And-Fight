import { REWARD_PANEL_ROUTE_ID, UI_POP_MISMATCH } from '../../../defines';
import { RewardApplyService } from '../../reward/RewardApplyService';
import { rollRewardOptions } from '../../reward/RewardPoolService';
import type { RewardPanelPayload } from '../../reward/RewardTypes';
import { MetaRunSession } from '../../meta/MetaRunSession';
import type { UIStackManager } from '../mvc/UIStackManager';
import { UiControllerBase } from '../mvc/UiControllerBase';
import { RewardPanelModel } from './RewardPanelModel';
import { RewardPanelView } from './RewardPanelView';

export class RewardPanelController extends UiControllerBase<RewardPanelPayload> {
    private readonly model = new RewardPanelModel();
    private readonly view = new RewardPanelView();

    constructor(private readonly uiStack: UIStackManager) {
        super(REWARD_PANEL_ROUTE_ID);
    }

    protected async onInitialize(): Promise<void> {
        await this.view.initialize();
    }

    protected onShow(payload?: RewardPanelPayload): void {
        this.model.applyPayload(payload);
        this.model.options = rollRewardOptions(this.model.context);

        this.view.setOnEsc(() => {
            void this.handleDismissWithoutPick();
        });
        for (let i = 0; i < 3; i++) {
            this.view.setOnChoice(i, (index) => {
                void this.handlePick(index);
            });
        }

        void this.view.renderOptions(this.model.options).then(() => this.view.show());
    }

    protected onHide(): void {
        this.view.hide();
    }

    protected onDispose(): void {
        this.view.dispose();
    }

    private async handlePick(index: number): Promise<void> {
        const option = this.model.options[index];
        if (!option) return;

        const demo = MetaRunSession.combatDemo;
        const playerEntity = demo?.getPlayerEntity() ?? -1;
        const world = demo?.world ?? null;
        RewardApplyService.apply(option, world, playerEntity);

        await this.closePanel();
        MetaRunSession.onRewardPanelClosed?.(true);
    }

    private async handleDismissWithoutPick(): Promise<void> {
        await this.closePanel();
        MetaRunSession.onRewardPanelClosed?.(false);
    }

    private async closePanel(): Promise<void> {
        const ok = await this.uiStack.pop(REWARD_PANEL_ROUTE_ID);
        if (!ok) {
            console.warn(`[UI] ${UI_POP_MISMATCH}: expected ${REWARD_PANEL_ROUTE_ID}`);
        }
    }
}
