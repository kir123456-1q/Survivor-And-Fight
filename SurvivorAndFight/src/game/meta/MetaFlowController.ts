import { META_INVALID_VIEW } from '../../defines';

export type MetaView = 'Title' | 'PreRun' | 'RunMap' | 'Combat' | 'PauseOverlay';

export interface CombatEnterPayload {
    nodeId: string;
    payloadId: string | null;
    isBoss?: boolean;
    /** Level3 性能测试关卡：每波 10s 晋级，双方无敌，无生存倒计时。 */
    testMode?: boolean;
}

export interface MetaFlowCallbacks {
    onEnterCombat?: (payload?: CombatEnterPayload) => void | Promise<void>;
    onLeaveCombat?: () => void | Promise<void>;
}

export class MetaFlowController {
    private view: MetaView = 'Title';

    constructor(private readonly callbacks: MetaFlowCallbacks = {}) {}

    get currentView(): MetaView {
        return this.view;
    }

    goto(view: MetaView, payload?: unknown): void {
        const allowed: MetaView[] = ['Title', 'PreRun', 'RunMap', 'Combat', 'PauseOverlay'];
        if (!allowed.includes(view)) {
            console.warn(`[MetaFlow] ${META_INVALID_VIEW}:`, view);
            return;
        }
        if (view === 'Combat') {
            const p = payload as CombatEnterPayload | undefined;
            if (p?.nodeId) {
                void this.callbacks.onEnterCombat?.(p);
            } else {
                void this.callbacks.onEnterCombat?.();
            }
        }
        this.view = view;
    }
}
