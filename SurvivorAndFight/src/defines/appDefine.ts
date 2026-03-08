/**
 * 应用级静态配置。
 * 配表根路径，需包含 tables.registry.json；发布时可改为 'config/' 并将 docs/config 复制过去。
 */
export const CONFIG_BASE = 'docs/config/';

/** 设计分辨率宽高，与 PlayerSettings resolution 一致；用于 2D 相机跟随时计算屏幕中心。 */
export const DESIGN_WIDTH = 1334;
export const DESIGN_HEIGHT = 750;
