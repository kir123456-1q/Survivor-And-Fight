import type { RewardOption, RewardPanelPayload } from '../../reward/RewardTypes';

export class RewardPanelModel {
    context: RewardPanelPayload['context'] = 'unknown';
    applyInCombat = false;
    options: RewardOption[] = [];

    applyPayload(payload?: RewardPanelPayload): void {
        if (!payload) return;
        this.context = payload.context;
        this.applyInCombat = !!payload.applyInCombat;
    }
}
