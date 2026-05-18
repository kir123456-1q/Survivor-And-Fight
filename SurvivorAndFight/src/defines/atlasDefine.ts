/**
 * 自动图集与纹理加载静态配置。
 * 自动图集由 assets/atlas/AtlasConfig.atlascfg 驱动（IDE 发布/预览时按子目录生成 .atlas）。
 */

/** 自动图集配置所在目录（相对资源根）。 */
export const AUTO_ATLAS_CONFIG_DIR = 'atlas';

/** 自动图集配置文件名（勿改，与 IDE 约定一致）。 */
export const AUTO_ATLAS_CONFIG_FILE = 'AtlasConfig.atlascfg';

/**
 * 参与自动图集的子目录（perFolder=true 时各目录独立一张/多张图集）。
 * 代码仍使用散图原路径加载，引擎在发布后自动映射到图集子帧。
 */
export const AUTO_ATLAS_SUBFOLDERS = [
    'WeaponIcon',
    'EffectIcon',
    'MonsterIcon',
    'UIPng',
    'Skillicon',
] as const;

/** 战斗根节点开启 DrawCall 合批优化（同图集子图更易合并）。 */
export const COMBAT_DRAW_CALL_OPTIMIZE = true;

/** 离开战斗/隐藏 GameRoot 时清空 TextureAtlasService 运行时缓存。 */
export const AUTO_CLEAR_TEXTURE_CACHE_ON_LEAVE_COMBAT = true;
