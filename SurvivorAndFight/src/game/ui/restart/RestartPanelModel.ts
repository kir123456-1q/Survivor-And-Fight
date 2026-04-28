export interface RestartPanelPayload {
    onRestart: () => void;
}

export class RestartPanelModel {
    onRestart: (() => void) | null = null;
}

