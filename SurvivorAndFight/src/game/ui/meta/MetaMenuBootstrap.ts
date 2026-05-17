import {
    REWARD_PANEL_ROUTE_ID,
    RUN_MAP_PANEL_ROUTE_ID,
    SELECT_LEVEL_PANEL_ROUTE_ID,
    START_PANEL_ROUTE_ID,
} from '../../../defines';
import type { MetaFlowController } from '../../meta/MetaFlowController';
import type { UIStackManager } from '../mvc/UIStackManager';
import { RewardPanelController } from '../reward/RewardPanelController';
import { RunMapPanelController } from './RunMapPanelController';
import { SelectLevelPanelController } from './SelectLevelPanelController';
import { StartPanelController } from './StartPanelController';

export class MetaMenuBootstrap {
    private static metaFlow: MetaFlowController | null = null;

    static registerRoutes(uiStack: UIStackManager, metaFlow: MetaFlowController): void {
        this.metaFlow = metaFlow;
        uiStack.register(START_PANEL_ROUTE_ID, () => new StartPanelController(uiStack));
        uiStack.register(SELECT_LEVEL_PANEL_ROUTE_ID, () => new SelectLevelPanelController(uiStack));
        uiStack.register(REWARD_PANEL_ROUTE_ID, () => new RewardPanelController(uiStack));
        uiStack.register(RUN_MAP_PANEL_ROUTE_ID, () => {
            if (!this.metaFlow) {
                throw new Error('[MetaMenu] MetaFlowController not initialized');
            }
            return new RunMapPanelController(uiStack, this.metaFlow);
        });
    }

    static async start(uiStack: UIStackManager): Promise<void> {
        this.hideSceneEmbeddedStartPanel();
        await uiStack.push(START_PANEL_ROUTE_ID);
    }

    /** 场景内嵌的 StartPanel 与运行时 MVC 实例互斥显示。 */
    private static hideSceneEmbeddedStartPanel(): void {
        const stage = Laya.stage as any;
        if (!stage?.numChildren) return;
        for (let i = 0; i < stage.numChildren; i++) {
            const child = stage.getChildAt(i);
            if (String(child?.name ?? '') === 'StartPanel') {
                child.visible = false;
            }
        }
    }
}
