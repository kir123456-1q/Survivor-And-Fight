/**
 * 统一纹理加载：配合 assets/atlas/AtlasConfig.atlascfg 自动图集，散图路径不变。
 * 合并原 SkillIconBinder / MonsterVisual / BulletVisual 等处的重复 cache。
 */

import { Data } from '../../config/Data';
import {
    MAP_ICON_BOSS,
    MAP_ICON_COMBAT,
    MAP_ICON_REST,
    MAP_ICON_TREASURE,
    MAP_ICON_UNKNOWN,
} from '../../defines';

const textureCache = new Map<string, unknown>();
const inflight = new Map<string, Promise<unknown>>();

function normalizeUrl(url: string): string {
    const t = url.trim();
    if (!t) return t;
    return t.startsWith('/') ? t.slice(1) : t;
}

/** 加载纹理（命中缓存或合并并发请求）。自动图集发布后仍使用原散图 URL。 */
export async function loadTexture(url: string): Promise<unknown> {
    const key = normalizeUrl(url);
    if (!key) return null;
    if (textureCache.has(key)) return textureCache.get(key)!;

    const pending = inflight.get(key);
    if (pending) return pending;

    const task = Laya.loader.load(key).then((tex) => {
        textureCache.set(key, tex);
        inflight.delete(key);
        return tex;
    }).catch((err) => {
        inflight.delete(key);
        throw err;
    });
    inflight.set(key, task);
    return task;
}

/** 批量预加载（战斗/UI 打开前可调用）。 */
export async function preloadTextures(urls: readonly string[]): Promise<void> {
    const unique = [...new Set(urls.map(normalizeUrl).filter(Boolean))];
    await Promise.all(unique.map((u) => loadTexture(u).catch(() => null)));
}

/** 将纹理应用到 GImage / 兼容 src 的节点。 */
export async function applyTextureToImage(
    img: {
        visible?: boolean;
        width?: number;
        height?: number;
        autoSize?: boolean;
        texture?: unknown;
        src?: string;
    } | null,
    url: string,
    size: number,
    options?: { visibleWhenMissing?: boolean },
): Promise<void> {
    if (!img || !url) return;
    const tex = await loadTexture(url);
    if (!tex) {
        if (options?.visibleWhenMissing === false && img.visible !== undefined) {
            img.visible = false;
        }
        return;
    }
    img.width = size;
    img.height = size;
    if (img.autoSize !== undefined) img.autoSize = false;
    if (img.visible !== undefined) img.visible = true;
    if (img.texture !== undefined) {
        img.texture = tex;
    } else if (img.src !== undefined) {
        img.src = normalizeUrl(url);
    }
}

/** 清空运行时纹理缓存（场景切换时可调用；不卸载 Laya.loader 资源）。 */
export function clearTextureCache(): void {
    textureCache.clear();
    inflight.clear();
}

function collectIconPath(row: Record<string, unknown> | undefined): string | null {
    const path = row?.iconPath;
    return typeof path === 'string' && path.length > 0 ? path : null;
}

/** 从配表与跑图常量收集战斗/UI 常用图标 URL，供预加载。 */
export function collectCombatIconUrls(): string[] {
    const urls = new Set<string>([
        MAP_ICON_BOSS,
        MAP_ICON_COMBAT,
        MAP_ICON_REST,
        MAP_ICON_TREASURE,
        MAP_ICON_UNKNOWN,
    ]);

    for (const row of (Data?.Skill?.GetAll?.() ?? []) as Array<Record<string, unknown>>) {
        const p = collectIconPath(row);
        if (p) urls.add(p);
    }
    for (const row of (Data?.SkillEffect?.GetAll?.() ?? []) as Array<Record<string, unknown>>) {
        const p = collectIconPath(row);
        if (p) urls.add(p);
    }
    for (const row of (Data?.Monster?.GetAll?.() ?? []) as Array<Record<string, unknown>>) {
        const p = collectIconPath(row);
        if (p) urls.add(p);
    }
    return [...urls];
}

/** 配表就绪后预加载图标（触发自动图集对应大图加载）。 */
export async function preloadCombatIcons(): Promise<void> {
    await preloadTextures(collectCombatIconUrls());
}
