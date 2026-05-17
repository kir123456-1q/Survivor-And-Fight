import type { RunDifficulty } from '../../../defines';
import {
    RUN_MAP_PANEL_ROUTE_ID,
    SELECT_LEVEL_PANEL_ROUTE_ID,
    UI_POP_MISMATCH,
} from '../../../defines';
import { MetaRunSession } from '../../meta/MetaRunSession';
import { createRunSeed } from '../../meta/RunSeedFactory';
import { RunMapGenerator } from '../../run/RunMapGenerator';
import { RunMapState } from '../../run/RunMapState';
import type { UIStackManager } from '../mvc/UIStackManager';
import { UiControllerBase } from '../mvc/UiControllerBase';
import type { RunMapPanelPayload } from '../runmap/RunMapPanelModel';
import { SelectLevelPanelModel } from './SelectLevelPanelModel';
import { SelectLevelPanelView } from './SelectLevelPanelView';

export class SelectLevelPanelController extends UiControllerBase {
    private readonly model = new SelectLevelPanelModel();
    private readonly view = new SelectLevelPanelView();

    constructor(private readonly uiStack: UIStackManager) {
        super(SELECT_LEVEL_PANEL_ROUTE_ID);
    }

    protected async onInitialize(): Promise<void> {
        await this.view.initialize();
    }

    protected onShow(): void {
        this.view.setOnEsc(() => {
            void this.handleEsc();
        });
        this.view.setOnLevelSelected((difficulty) => {
            void this.handleLevelSelected(difficulty);
        });
        this.view.show();
    }

    protected onHide(): void {
        this.view.hide();
    }

    protected onDispose(): void {
        this.view.dispose();
    }

    private async handleEsc(): Promise<void> {
        const ok = await this.uiStack.pop(SELECT_LEVEL_PANEL_ROUTE_ID);
        if (!ok) {
            console.warn(`[UI] ${UI_POP_MISMATCH}: expected ${SELECT_LEVEL_PANEL_ROUTE_ID}`);
        }
    }

    private async handleLevelSelected(difficulty: RunDifficulty): Promise<void> {
        this.model.selectedDifficulty = difficulty;
        const runSeed = createRunSeed(difficulty);
        const graph = RunMapGenerator.generate(runSeed, difficulty);
        const runMapState = RunMapState.create(graph);
        MetaRunSession.resetRunRewards();
        MetaRunSession.runMapState = runMapState;
        const payload: RunMapPanelPayload = { difficulty, runSeed, runMapState };
        console.log('[UI] ui.meta.level.selected', JSON.stringify({ difficulty, seed: runSeed.value }));
        await this.uiStack.push(RUN_MAP_PANEL_ROUTE_ID, payload);
    }
}
