import { SELECT_LEVEL_PANEL_ROUTE_ID, START_PANEL_ROUTE_ID } from '../../../defines';
import type { UIStackManager } from '../mvc/UIStackManager';
import { UiControllerBase } from '../mvc/UiControllerBase';
import { StartPanelModel } from './StartPanelModel';
import { StartPanelView } from './StartPanelView';

export class StartPanelController extends UiControllerBase {
    private readonly model = new StartPanelModel();
    private readonly view = new StartPanelView();

    constructor(private readonly uiStack: UIStackManager) {
        super(START_PANEL_ROUTE_ID);
    }

    protected async onInitialize(): Promise<void> {
        await this.view.initialize();
    }

    protected onShow(): void {
        this.view.setOnStart(() => {
            console.log('[UI] ui.meta.start.clicked');
            void this.uiStack.push(SELECT_LEVEL_PANEL_ROUTE_ID);
        });
        this.view.show();
    }

    protected onHide(): void {
        this.view.hide();
    }

    protected onDispose(): void {
        this.view.dispose();
    }
}
