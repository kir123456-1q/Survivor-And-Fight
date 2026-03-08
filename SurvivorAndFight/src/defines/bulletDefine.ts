/**
 * 子弹模块静态配置。
 */
export const HIT_RADIUS = 1.0;

/** 2D 子弹预制体（纯 2D 项目必须用 2D 预制体，避免加载 Sprite3D/PBR/SkyPanoramic）。 */
export const BULLET_PREFAB_2D = 'prefabs/Common/Buttle/buttle2d.lh';

/** 若配表或缓存返回这些 3D 路径，则改用 BULLET_PREFAB_2D，避免 missing node type 'Sprite3D' 等错误。 */
export const BULLET_3D_PATHS_TO_2D: Record<string, string> = {
    'prefabs/Common/Buttle/MonsterButtle.lh': BULLET_PREFAB_2D,
    'prefabs/Common/Buttle/simple.lh': BULLET_PREFAB_2D,
};
