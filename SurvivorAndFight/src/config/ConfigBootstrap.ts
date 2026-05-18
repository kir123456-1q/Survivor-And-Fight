import { CONFIG_BASE } from '../defines';
import { preloadCombatIcons } from '../game/render/TextureAtlasService';
import { Data, initData } from './Data';
import type { ConfigTableJson } from './TableLoader';
import type { TablesRegistryJson } from './TablesRegistry';

let loadPromise: Promise<boolean> | null = null;
let configLoaded = false;

function configBases(): string[] {
    const bases = ['config/', CONFIG_BASE];
    const urlApi = (Laya as { URL?: { basePath?: string; rootPath?: string } }).URL;
    const root = urlApi?.basePath ?? urlApi?.rootPath ?? '';
    if (root) {
        const norm = root.endsWith('/') ? root : `${root}/`;
        bases.push(`${norm}config/`, `${norm}${CONFIG_BASE}`);
    }
    return [...new Set(bases)];
}

function isJsonText(text: string): boolean {
    const t = text.trimStart();
    return t.startsWith('{') || t.startsWith('[');
}

/** fetch + Laya.loader 双通道加载 JSON。 */
async function loadJson(url: string): Promise<Record<string, unknown> | null> {
    try {
        const res = await fetch(url);
        if (res.ok) {
            const text = await res.text();
            if (isJsonText(text)) return JSON.parse(text) as Record<string, unknown>;
        }
    } catch {
        /* try loader */
    }

    try {
        const raw = await Laya.loader.load(url, Laya.Loader.JSON);
        if (raw && typeof raw === 'object') {
            const obj = raw as Record<string, unknown>;
            if (Array.isArray(obj.list) || Array.isArray(obj.tables)) return obj;
            const nested = obj.data as Record<string, unknown> | undefined;
            if (nested && typeof nested === 'object') return nested;
        }
    } catch {
        /* ignore */
    }
    return null;
}

export function isGameConfigReady(): boolean {
    return configLoaded && (Data.Skill?.GetAll?.().length ?? 0) > 0;
}

/** 加载 tables.registry 及全部配表；预览环境需先执行 tools/sync-config-to-bin.ps1。 */
export async function ensureGameConfigLoaded(): Promise<boolean> {
    if (isGameConfigReady()) return true;
    if (!loadPromise) loadPromise = loadAllTables();
    return loadPromise;
}

async function loadAllTables(): Promise<boolean> {
    for (const base of configBases()) {
        try {
            const registry = await loadJson(`${base}tables.registry.json`);
            if (!registry || !Array.isArray(registry.tables)) continue;

            await initData(registry as unknown as TablesRegistryJson, async (path: string) => {
                const json = await loadJson(`${base}${path}`);
                if (!json) throw new Error(`${base}${path} load failed`);
                return json as ConfigTableJson<Record<string, unknown>>;
            });

            const skillCount = Data.Skill?.GetAll?.().length ?? 0;
            const effectCount = Data.SkillEffect?.GetAll?.().length ?? 0;
            if (skillCount > 0) {
                configLoaded = true;
                console.log('[Config] loaded', base, { skillCount, effectCount, tables: Object.keys(Data) });
                void preloadCombatIcons().catch(() => {});
                return true;
            }
            console.warn('[Config] registry ok but Skill empty at', base);
        } catch (e) {
            console.warn('[Config] failed base', base, e);
        }
    }

    console.error(
        '[Config] 无法加载配表。Laya 预览以 bin/ 为根：请运行 tools/sync-config-to-bin.ps1 后重新编译预览。',
    );
    configLoaded = false;
    return false;
}
