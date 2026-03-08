/**
 * Schema for table registry config (e.g. tables.registry.json).
 * Maps logical table keys to source JSON paths and supports merging multiple sources.
 */

export interface TableRegistryEntry {
    /** Key used for Data.XXX access (e.g. "Item" -> Data.Item). */
    key: string;
    /** One or more JSON paths; multiple entries are merged into one logical table (first-wins on id). */
    sources: string[];
    /** Primary key column name (default "id"). */
    idKey?: string;
    /** Optional internal alias (e.g. "Data_Item"). */
    alias?: string;
}

export interface TablesRegistryJson {
    tables: TableRegistryEntry[];
}
