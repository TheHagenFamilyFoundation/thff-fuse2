/** Earliest year offered in “Year founded” dropdowns (inclusive). */
export const FOUNDED_YEAR_MIN = 1800;

/**
 * Descending years for select menus, e.g. `[2026, 2025, …, 1800]`.
 * If `includeYear` is set and falls outside the default range, the span is expanded so that value stays selectable.
 */
export function foundedYearSelectOptions(
    maxYear: number = new Date().getFullYear(),
    minYear: number = FOUNDED_YEAR_MIN,
    includeYear?: number | null,
): number[] {
    let hi = maxYear;
    let lo = minYear;
    const inc = Number(includeYear);
    if (Number.isFinite(inc) && inc > 0) {
        if (inc > hi) {
            hi = inc;
        }
        if (inc < lo) {
            lo = inc;
        }
    }
    const out: number[] = [];
    for (let y = hi; y >= lo; y--) {
        out.push(y);
    }
    return out;
}

/**
 * Normalize stored API/DB value for `<mat-select>` (no valid year → `null`).
 * Backwards compatible with: `number`, numeric `string`, optional whitespace, truncated ints.
 */
export function foundedYearToSelectValue(stored: unknown): number | null {
    if (stored === null || stored === undefined || stored === '') {
        return null;
    }
    const raw = typeof stored === 'string' ? stored.trim() : stored;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 1) {
        return null;
    }
    return Math.trunc(n);
}
