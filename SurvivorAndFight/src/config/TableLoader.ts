/**
 * Runtime config table loader. Accepts JSON in shape { list: T[] }, builds
 * primary-key index, and provides getById / getAll. Use with Laya: load JSON
 * via Laya.loader or fetch, then ConfigTable.fromJson(loadedObject).
 */

export interface ConfigTableJson<T = Record<string, unknown>> {
    list: T[];
}

const DEFAULT_ID_KEY = 'id';

/**
 * Read-only table view over config JSON. Primary key defaults to "id".
 */
export class ConfigTable<T extends Record<string, unknown>> {
    private readonly byId: Map<number | string, T> = new Map();
    private readonly list: T[];

    private constructor(rows: T[], idKey: string) {
        this.list = rows;
        for (const row of rows) {
            const key = row[idKey];
            if (key !== undefined && key !== null) {
                this.byId.set(key as number | string, row);
            }
        }
    }

    /**
     * Build a table from JSON. Expects shape { list: T[] }. Id key defaults to "id".
     */
    static fromJson<T extends Record<string, unknown>>(
        json: ConfigTableJson<T>,
        idKey: string = DEFAULT_ID_KEY
    ): ConfigTable<T> {
        const list = Array.isArray(json.list) ? json.list : [];
        return new ConfigTable(list, idKey);
    }

    getById(id: number | string): T | undefined {
        return this.byId.get(id);
    }

    getAll(): T[] {
        return this.list;
    }

    get listRef(): readonly T[] {
        return this.list;
    }
}

/**
 * Copy fields from a table row into a target object with optional column->field mapping.
 * Example: fillFromTableRow(component, row, { maxHp: 'hp', attack: 'attack' })
 * copies row.hp -> component.maxHp, row.attack -> component.attack.
 */
export function fillFromTableRow<T extends Record<string, unknown>>(
    target: T,
    row: Record<string, unknown>,
    columnToField?: Partial<Record<keyof T & string, string>>
): void {
    if (columnToField) {
        for (const [field, column] of Object.entries(columnToField)) {
            if (column !== undefined && (row as Record<string, unknown>)[column] !== undefined) {
                (target as Record<string, unknown>)[field] = (row as Record<string, unknown>)[column];
            }
        }
    } else {
        for (const [key, value] of Object.entries(row)) {
            (target as Record<string, unknown>)[key] = value;
        }
    }
}
