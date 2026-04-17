/**
 * Helpers for mock timestamps so demo data does not import CommonJS `moment`.
 *
 * `chartDateMonthsAgoDay` matches `moment().subtract(months, 'months').day(day).toDate()`
 * (Moment’s day setter: add `day - getDay()` days; see getSetDayOfWeek in moment.js).
 */
export function isoTodayAt(hour: number, minute: number): string {
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
}

export function isoWeeksAgoAt(weeks: number, hour: number, minute: number): string {
    const d = new Date();
    d.setDate(d.getDate() - weeks * 7);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
}

export function isoMinutesAgo(minutes: number): string {
    const d = new Date();
    d.setMinutes(d.getMinutes() - minutes);
    return d.toISOString();
}

export function isoHoursAgo(hours: number): string {
    const d = new Date();
    d.setHours(d.getHours() - hours);
    return d.toISOString();
}

export function isoDaysAgo(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
}

/** Today at hour:minute, then shift by `dayOffset` days (negative = past). Matches moment: set time then add/subtract whole days. */
export function isoAtHourMinutePlusDays(hour: number, minute: number, dayOffset: number): string {
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    d.setDate(d.getDate() + dayOffset);
    return d.toISOString();
}

export function chartDateMonthsAgoDay(months: number, day: number): Date {
    const d = new Date();
    d.setMonth(d.getMonth() - months);
    const current = d.getDay();
    d.setDate(d.getDate() + (day - current));
    return d;
}

/** Matches `moment().subtract(n, 'days').toDate()`. */
export function daysAgoDate(daysBack: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - daysBack);
    return d;
}

/** Matches `moment().subtract(n, 'days').format('DD MMM')` (en locale). */
export function formatSubtractDaysAgo(daysBack: number): string {
    const d = new Date();
    d.setDate(d.getDate() - daysBack);
    const dd = String(d.getDate()).padStart(2, '0');
    const mmm = d.toLocaleString('en', { month: 'short' });
    return `${dd} ${mmm}`;
}

/** Matches `moment().subtract(n, 'minutes').format('HH:mm')` (local time). */
export function formatSubtractMinutesAgoHHmm(minutesBack: number): string {
    const d = new Date();
    d.setMinutes(d.getMinutes() - minutesBack);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
}

/** Start of local calendar day, as ISO string (matches `moment().startOf('day').toISOString()`). */
export function isoStartOfToday(): string {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
}

/** Matches `moment().startOf('day').subtract(n, 'day[s]').toISOString()` and `subtract(n,'days').startOf('day')`. */
export function isoStartOfDaysAgo(daysBack: number): string {
    const d = new Date();
    d.setDate(d.getDate() - daysBack);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
}

/** Matches `moment().startOf('day').subtract(daysBack,'days').format('LL')` (e.g. April 1, 2026). */
export function formatStartOfDayMinusDaysLongEn(daysBack: number): string {
    const d = new Date();
    d.setDate(d.getDate() - daysBack);
    d.setHours(0, 0, 0, 0);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/** Matches `moment()...subtract(daysBack,'days').add(months,'month').format('LL')`. */
export function formatStartOfDayMinusDaysPlusMonthsLongEn(daysBack: number, addMonths: number): string {
    const d = new Date();
    d.setDate(d.getDate() - daysBack);
    d.setHours(0, 0, 0, 0);
    d.setMonth(d.getMonth() + addMonths);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
