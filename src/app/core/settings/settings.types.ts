export interface Settings {
    userID: string;
    scheme?: string; // dark | light
    tablePageSize?: number;
}

export const TABLE_PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100] as const;
export const DEFAULT_TABLE_PAGE_SIZE = 10;

export type TablePageSize = (typeof TABLE_PAGE_SIZE_OPTIONS)[number];

export function normalizeTablePageSize(value: unknown): TablePageSize {
    const size = Number(value);
    if (TABLE_PAGE_SIZE_OPTIONS.includes(size as TablePageSize)) {
        return size as TablePageSize;
    }
    return DEFAULT_TABLE_PAGE_SIZE;
}

/** Use the saved preference when a table exposes a subset of page-size options. */
export function tablePageSizeForOptions(
    preferred: number,
    options: readonly number[]
): number {
    if (options.includes(preferred)) {
        return preferred;
    }
    const next = options.find((option) => option >= preferred);
    return next ?? options[options.length - 1];
}
