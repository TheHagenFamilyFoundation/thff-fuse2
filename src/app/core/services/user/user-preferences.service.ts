import { Injectable } from '@angular/core';
import { BehaviorSubject, EMPTY, Observable } from 'rxjs';
import { SettingsService } from 'app/core/services/user/settings.service';
import {
    DEFAULT_TABLE_PAGE_SIZE,
    TABLE_PAGE_SIZE_OPTIONS,
    TablePageSize,
    normalizeTablePageSize,
    tablePageSizeForOptions,
} from 'app/core/settings/settings.types';

const STORAGE_KEY = 'userTablePageSize';

@Injectable({
    providedIn: 'root',
})
export class UserPreferencesService {
    readonly tablePageSizeOptions = TABLE_PAGE_SIZE_OPTIONS;

    private readonly _tablePageSize$ = new BehaviorSubject<TablePageSize>(DEFAULT_TABLE_PAGE_SIZE);
    readonly tablePageSize$ = this._tablePageSize$.asObservable();

    constructor(private _settingsService: SettingsService) {
        this.loadCached();
    }

    get tablePageSize(): TablePageSize {
        return this._tablePageSize$.value;
    }

    initFromUserSettings(settings: { tablePageSize?: number } | null | undefined): void {
        this.setTablePageSize(normalizeTablePageSize(settings?.tablePageSize), false);
    }

    /** Default page size from settings; use when a table first loads. Paginator changes stay page-scoped. */
    pageSizeForOptions(options: readonly number[]): number {
        return tablePageSizeForOptions(this.tablePageSize, options);
    }

    /** Update in-memory + cached default. Prefer {@link saveTablePageSize} from profile settings. */
    setTablePageSize(size: number, persist = true): void {
        const normalized = normalizeTablePageSize(size);
        if (normalized === this.tablePageSize) {
            return;
        }

        this._tablePageSize$.next(normalized);
        localStorage.setItem(STORAGE_KEY, String(normalized));

        if (persist) {
            this.persistTablePageSize(normalized).subscribe();
        }
    }

    saveTablePageSize(size: number): Observable<any> {
        const normalized = normalizeTablePageSize(size);
        this._tablePageSize$.next(normalized);
        localStorage.setItem(STORAGE_KEY, String(normalized));
        return this.persistTablePageSize(normalized);
    }

    clearCached(): void {
        localStorage.removeItem(STORAGE_KEY);
        this._tablePageSize$.next(DEFAULT_TABLE_PAGE_SIZE);
    }

    private loadCached(): void {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw === null) {
            return;
        }
        this._tablePageSize$.next(normalizeTablePageSize(Number(raw)));
    }

    private persistTablePageSize(size: TablePageSize): Observable<any> {
        const userRaw = localStorage.getItem('currentUser');
        if (!userRaw) {
            return EMPTY;
        }

        const user = JSON.parse(userRaw);
        const userID = user?.id ?? user?._id;
        if (!userID) {
            return EMPTY;
        }

        return this._settingsService.saveSettings({ userID, tablePageSize: size });
    }
}
