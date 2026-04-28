import { UiControllerBase } from '../mvc/UiControllerBase';
import { RestartPanelModel, type RestartPanelPayload } from './RestartPanelModel';
import { RestartPanelView } from './RestartPanelView';

export const RESTART_PANEL_ROUTE_ID = 'restart-panel';

export class RestartPanelController extends UiControllerBase<RestartPanelPayload> {
    private readonly model = new RestartPanelModel();
    private readonly view = new RestartPanelView();

    constructor() {
        super(RESTART_PANEL_ROUTE_ID);
    }

    protected async onInitialize(): Promise<void> {
        await this.view.initialize();
    }

    protected onShow(payload?: RestartPanelPayload): void {
        this.model.onRestart = payload?.onRestart ?? null;
        this.view.setOnRestart(() => {
            this.model.onRestart?.();
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

