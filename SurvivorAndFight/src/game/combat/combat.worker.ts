/// <reference lib="webworker" />

import { COMBAT_WORKER_MSG_COMPUTE, COMBAT_WORKER_MSG_READY } from './combatWorkerProtocol';
import type { CombatWorkerInbound, CombatWorkerOutbound } from './combatWorkerProtocol';
import { processCombatFrame } from './combatWorkerLogic';

const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (event: MessageEvent<CombatWorkerInbound>) => {
    const msg = event.data;
    if (msg.type !== COMBAT_WORKER_MSG_COMPUTE) return;
    const result = processCombatFrame(msg);
    const outbound: CombatWorkerOutbound = result;
    ctx.postMessage(outbound);
};

const ready: CombatWorkerOutbound = { type: COMBAT_WORKER_MSG_READY };
ctx.postMessage(ready);
