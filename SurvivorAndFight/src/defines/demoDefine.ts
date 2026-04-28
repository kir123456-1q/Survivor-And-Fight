/**
 * Demo / 角色生成模块静态配置。
 */
export const DEFAULT_PLAYER_HP = 100;
export const DEFAULT_PLAYER_MAX_HP = 100;
export const DEFAULT_MONSTER_HP = 50;
export const DEFAULT_MONSTER_MAX_HP = 50;
/** 2D 预制体，避免 Sprite3D（需关闭 3D 模块） */
export const DEFAULT_PLAYER_PREFAB = 'prefabs/SceneUI/PlayerBody.lh';
export const DEFAULT_MONSTER_PREFAB = 'prefabs/SceneUI/MonsterBody.lh';
export const MONSTER_SPAWN_RADIUS = 260;
export const MONSTER_COUNT = 5;
export const PLACEHOLDER_RADIUS = 0.3;

/** 控制与怪物行为（2D 像素单位） */
export const PLAYER_MOVE_SPEED = 220;
export const MONSTER_CHASE_SPEED = 80;
export const MONSTER_RANDOM_SWAY_DEGREE = 28;
export const MONSTER_RANDOM_SWAY_FREQ = 1.7;
export const MONSTER_SEPARATION_DISTANCE = 64;
export const MONSTER_SEPARATION_FORCE = 120;
export const MONSTER_SPAWN_MIN_DISTANCE = 56;
export const MONSTER_COLLISION_RADIUS = 28;
export const MONSTER_COLLISION_DPS = 18;
