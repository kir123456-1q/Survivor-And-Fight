/**
 * Global config table namespace. Load tables from registry (tables.registry.json),
 * then access via Data.Item.GetByID(id), Data.Item.GetName(id), etc.
 *
 * Usage:
 *   await Data.init(registryJson, (path) => loadJson(path));
 *   const row = Data.Item.GetByID(1);
 *   const name = Data.Item.GetName(1);
 */

import { ConfigTable } from './TableLoader';
import type { ConfigTableJson } from './TableLoader';
import type { TablesRegistryJson } from './TablesRegistry';
import { DEFAULT_ID_KEY } from '../defines';

/** Converts column name to GetXxx method name (e.g. "name" -> "GetName"). */
function getterName(columnName: string): string {
    if (!columnName || typeof columnName !== 'string') return '';
    return 'Get' + columnName.charAt(0).toUpperCase() + columnName.slice(1);
}

export interface TableView {
    GetByID(id: number | string): Record<string, unknown> | undefined;
    Get(columnName: string, id: number | string): unknown;
    GetAll(): Record<string, unknown>[];
    readonly [method: string]: ((id: number | string) => unknown) | (() => Record<string, unknown>[]) | unknown;
}

function buildTableView(table: ConfigTable<Record<string, unknown>>): TableView {
    const list = table.getAll();
    const columns = new Set<string>();
    for (const row of list) {
        for (const k of Object.keys(row)) columns.add(k);
    }

    const view: TableView = {
        GetByID(id: number | string): Record<string, unknown> | undefined {
            return table.getById(id);
        },
        Get(columnName: string, id: number | string): unknown {
            const row = table.getById(id);
            return row === undefined ? undefined : (row as Record<string, unknown>)[columnName];
        },
        GetAll(): Record<string, unknown>[] {
            return table.getAll();
        }
    };

    for (const col of columns) {
        const name = getterName(col);
        if (name && !(name in view)) {
            (view as Record<string, (id: number | string) => unknown>)[name] = (id: number | string) =>
                view.Get(col, id);
        }
    }

    return view;
}

export type SourceLoader = (path: string) => Promise<ConfigTableJson<Record<string, unknown>>>;

/** Data singleton: keys are table keys from registry (e.g. "Item", "Role"). */
export const Data: Record<string, TableView> = {};

/**
 * Initialize Data from registry. Loads each source JSON, merges when multiple sources,
 * then attaches a TableView per key (Data.Item, Data.Role, ...).
 * @param registry Parsed tables.registry.json
 * @param loadSource Async loader for a single JSON path (e.g. Laya.loader or fetch)
 */
export async function initData(
    registry: TablesRegistryJson,
    loadSource: SourceLoader
): Promise<void> {
    if (!registry.tables || !Array.isArray(registry.tables)) return;

    for (const entry of registry.tables) {
        const key = entry.key;
        const sources = entry.sources || [];
        const idKey = entry.idKey ?? DEFAULT_ID_KEY;

        const mergedList: Record<string, unknown>[] = [];
        const seenIds = new Set<number | string>();

        for (const path of sources) {
            const json = await loadSource(path);
            const list = Array.isArray(json?.list) ? json.list : [];
            for (const row of list as Record<string, unknown>[]) {
                const id = row[idKey];
                if (id !== undefined && id !== null && !seenIds.has(id as number | string)) {
                    seenIds.add(id as number | string);
                    mergedList.push(row);
                }
            }
        }

        const table = ConfigTable.fromJson({ list: mergedList }, idKey);
        Data[key] = buildTableView(table);
    }
}
