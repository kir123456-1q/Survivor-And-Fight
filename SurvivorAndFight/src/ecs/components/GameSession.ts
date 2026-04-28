/**
 * Session singleton component for runtime game flow state.
 * Kept in ECS so systems can coordinate pause/death/restart.
 */
export class GameSession {
    paused = false;
    restartRequested = false;
    restartPanelVisible = false;
}

