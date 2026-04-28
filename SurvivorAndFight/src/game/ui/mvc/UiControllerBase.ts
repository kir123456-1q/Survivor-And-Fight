export type UiLifecycleState = 'Created' | 'Initialized' | 'Shown' | 'Hidden' | 'Disposed';

/**
 * Minimal MVC UI controller base with lifecycle state machine.
 */
export abstract class UiControllerBase<TPayload = unknown> {
    readonly id: string;
    state: UiLifecycleState = 'Created';

    protected constructor(id: string) {
        this.id = id;
    }

    async initialize(): Promise<void> {
        if (this.state !== 'Created') return;
        await this.onInitialize();
        this.state = 'Initialized';
    }

    async show(payload?: TPayload): Promise<void> {
        if (this.state === 'Created') {
            throw new Error(`[UI:${this.id}] initialize required before show`);
        }
        if (this.state === 'Disposed') {
            throw new Error(`[UI:${this.id}] disposed module cannot be shown`);
        }
        await this.onShow(payload);
        this.state = 'Shown';
    }

    async hide(): Promise<void> {
        if (this.state !== 'Shown') return;
        await this.onHide();
        this.state = 'Hidden';
    }

    async dispose(): Promise<void> {
        if (this.state === 'Disposed') return;
        await this.onDispose();
        this.state = 'Disposed';
    }

    protected abstract onInitialize(): Promise<void> | void;
    protected abstract onShow(payload?: TPayload): Promise<void> | void;
    protected abstract onHide(): Promise<void> | void;
    protected abstract onDispose(): Promise<void> | void;
}

