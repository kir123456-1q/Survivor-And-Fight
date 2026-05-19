/**
 * Session singleton component for runtime game flow state.
 * Kept in ECS so systems can coordinate pause/death/restart.
 */
export class GameSession {
    paused = false;
    /** 玩家阵亡：本局战斗失败，不可再触发生存胜利。 */
    combatFailed = false;
    restartRequested = false;
    restartPanelVisible = false;
}

