import { UiControllerBase } from './UiControllerBase';

type ControllerFactory = () => UiControllerBase<any>;

/**
 * UI stack manager as single navigation entry.
 * Operations are serialized to keep stack mutations deterministic.
 */
export class UIStackManager {
    private readonly registry = new Map<string, ControllerFactory>();
    private readonly stack: UiControllerBase<any>[] = [];
    private readonly queue: Array<() => Promise<void>> = [];
    private processing = false;

    register(id: string, factory: ControllerFactory): void {
        this.registry.set(id, factory);
    }

    async push<TPayload>(id: string, payload?: TPayload): Promise<void> {
        await this.enqueue(async () => {
            const factory = this.registry.get(id);
            if (!factory) {
                throw new Error(`[UIStack] route not registered: ${id}`);
            }
            const currentTop = this.peek();
            if (currentTop) {
                await currentTop.hide();
            }

            const controller = factory();
            await controller.initialize();
            await controller.show(payload);
            this.stack.push(controller);
        });
    }

    async pop(expectedId?: string): Promise<boolean> {
        let popped = false;
        await this.enqueue(async () => {
            if (this.stack.length === 0) return;
            const top = this.peek();
            if (!top) return;
            if (expectedId && top.id !== expectedId) return;

            this.stack.pop();
            await top.hide();
            await top.dispose();
            popped = true;

            const nextTop = this.peek();
            if (nextTop) {
                await nextTop.show();
            }
        });
        return popped;
    }

    async clearAll(): Promise<void> {
        await this.enqueue(async () => {
            while (this.stack.length > 0) {
                const top = this.stack.pop() as UiControllerBase<any>;
                await top.hide();
                await top.dispose();
            }
        });
    }

    isTop(id: string): boolean {
        const top = this.peek();
        return !!top && top.id === id;
    }

    private peek(): UiControllerBase<any> | null {
        return this.stack.length > 0 ? this.stack[this.stack.length - 1] : null;
    }

    private async enqueue(operation: () => Promise<void>): Promise<void> {
        this.queue.push(operation);
        if (this.processing) return;
        this.processing = true;
        try {
            while (this.queue.length > 0) {
                const op = this.queue.shift() as () => Promise<void>;
                await op();
            }
        } finally {
            this.processing = false;
        }
    }
}

