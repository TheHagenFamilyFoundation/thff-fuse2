import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import {
    catchError,
    distinctUntilChanged,
    filter,
    finalize,
    map,
    switchMap,
    takeUntil,
    tap,
} from 'rxjs/operators';
import { of } from 'rxjs';
import { ConfirmDialogComponent } from 'app/common/components/confirm-dialog/confirm-dialog.component';
import { ProposalService } from 'app/core/services/proposal/proposal.service';
import { SubmissionYearsService } from 'app/core/services/admin/submission-years.service';
import { UserPreferencesService } from 'app/core/services/user/user-preferences.service';

export interface MyProposalRow {
    _id: string;
    proposalID?: string;
    projectTitle?: string;
    status?: string;
    organization?: { _id?: string; name?: string; organizationID?: string };
    updatedAt?: string;
    createdAt?: string;
    sponsor?: { firstName?: string; email?: string };
    votes?: unknown[];
}

@Component({
    standalone: false,
    /** Distinct from director `app-proposals` (same label would register two components). */
    selector: 'app-my-proposals-page',
    templateUrl: './proposals.component.html',
    styleUrls: ['./proposals.component.scss'],
})
export class ProposalsComponent implements OnInit, OnDestroy {
    /** True until grant years + first proposal list for the selected year have finished loading. */
    loading = true;
    years: number[] = [];
    selectedYear: number | null = null;

    displayedColumns: string[] = ['projectTitle', 'organization', 'status', 'updatedAt', 'actions'];
    dataSource = new MatTableDataSource<MyProposalRow>([]);

    readonly tablePageSizeOptions = [5, 10, 25, 50];
    tablePageSize: number;

    private _paginator: MatPaginator;

    @ViewChild(MatPaginator)
    set matPaginator(p: MatPaginator | undefined) {
        this._paginator = p;
        this._attachPaginator();
    }

    private readonly _destroy$ = new Subject<void>();
    /** After first grant-year + proposals load; avoids duplicate fetch from initial `queryParamMap` emit. */
    private _initialLoadDone = false;

    constructor(
        private readonly proposalService: ProposalService,
        private readonly submissionYearsService: SubmissionYearsService,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly dialog: MatDialog,
        private readonly snackBar: MatSnackBar,
        private readonly _cdr: ChangeDetectorRef,
        private readonly _userPreferences: UserPreferencesService,
    ) {
        this.tablePageSize = this._userPreferences.pageSizeForOptions(this.tablePageSizeOptions);
    }

    ngOnInit(): void {
        this.loading = true;
        this.submissionYearsService
            .getAllSubmissionYears(null)
            .pipe(
                takeUntil(this._destroy$),
                map((raw) => this._normalizeSubmissionYearRows(raw)),
                catchError(() => of([])),
                switchMap((rows: { year?: number }[]) => {
                    const nums = rows
                        .map((r) => Number((r as { year?: unknown })?.year))
                        .filter((y) => Number.isFinite(y));
                    this.years = [...new Set(nums)].sort((a, b) => b - a);
                    if (this.years.length === 0) {
                        this.years = [new Date().getFullYear()];
                    }

                    const qp = this.route.snapshot.queryParamMap.get('year');
                    const fromQuery = qp != null && qp !== '' ? Number(qp) : NaN;
                    const initial = this._pickYearForLoad(fromQuery);
                    this.selectedYear = initial;

                    return this.proposalService.getMyProposals(initial).pipe(
                        catchError(() => of([])),
                        map((raw) => this._normalizeProposalList(raw)),
                    );
                }),
                tap((list: MyProposalRow[]) => {
                    this.setProposalRows(list);
                }),
                finalize(() => {
                    this.loading = false;
                    this._initialLoadDone = true;
                    this._cdr.markForCheck();
                }),
            )
            .subscribe({
                next: () => {
                    const y = this.selectedYear;
                    if (y == null) {
                        return;
                    }
                    const qp = this.route.snapshot.queryParamMap.get('year');
                    if (String(y) !== qp) {
                        queueMicrotask(() => this.syncYearQueryParam(y));
                    }
                },
                error: () => {
                    this.loading = false;
                    this._initialLoadDone = true;
                    this._cdr.markForCheck();
                },
            });

        this.route.queryParamMap
            .pipe(
                takeUntil(this._destroy$),
                map((m) => {
                    const raw = m.get('year');
                    return raw != null && raw !== '' ? Number(raw) : NaN;
                }),
                distinctUntilChanged(),
                filter(() => this._initialLoadDone),
                filter((y) => Number.isFinite(y)),
            )
            .subscribe((fromUrl) => {
                if (!this._yearInList(fromUrl)) {
                    return;
                }
                if (fromUrl === this.selectedYear) {
                    return;
                }
                this.selectedYear = fromUrl;
                this.loadProposals(fromUrl);
            });
    }

    /** Year label for empty state when `selectedYear` is still null. */
    get displayYearLabel(): string | number {
        return this.selectedYear ?? this.years[0] ?? '';
    }

    private _normalizeSubmissionYearRows(raw: unknown): { year?: number }[] {
        if (Array.isArray(raw)) {
            return raw as { year?: number }[];
        }
        if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown[] }).data)) {
            return (raw as { data: { year?: number }[] }).data;
        }
        return [];
    }

    private _normalizeProposalList(raw: unknown): MyProposalRow[] {
        if (Array.isArray(raw)) {
            return raw as MyProposalRow[];
        }
        if (raw && typeof raw === 'object' && Array.isArray((raw as { proposals?: unknown[] }).proposals)) {
            return (raw as { proposals: MyProposalRow[] }).proposals;
        }
        return [];
    }

    private _yearInList(y: number): boolean {
        return this.years.some((yy) => Number(yy) === Number(y));
    }

    private _pickYearForLoad(fromQuery: number): number {
        if (Number.isFinite(fromQuery) && this._yearInList(fromQuery)) {
            return fromQuery;
        }
        return this.years[0]!;
    }

    ngOnDestroy(): void {
        this._destroy$.next();
        this._destroy$.complete();
    }

    onYearChange(year: number): void {
        this.selectedYear = year;
        this.syncYearQueryParam(year);
        this.loadProposals(year);
    }

    private syncYearQueryParam(year: number): void {
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { year },
            queryParamsHandling: 'merge',
            replaceUrl: true,
        });
    }

    loadProposals(year: number): void {
        this.loading = true;
        this.proposalService
            .getMyProposals(year)
            .pipe(
                takeUntil(this._destroy$),
                map((raw) => this._normalizeProposalList(raw)),
                catchError(() => of([])),
                finalize(() => {
                    this.loading = false;
                    this._cdr.markForCheck();
                }),
            )
            .subscribe((list: MyProposalRow[]) => {
                this.setProposalRows(list);
            });
    }

    onPageChange(event: { pageSize: number }): void {
        if (event.pageSize !== this.tablePageSize) {
            this._userPreferences.setTablePageSize(event.pageSize);
            this.tablePageSize = event.pageSize;
        }
    }

    private setProposalRows(list: MyProposalRow[]): void {
        this.dataSource.data = list;
        if (this._paginator) {
            this._paginator.firstPage();
        }
    }

    private _attachPaginator(): void {
        if (!this._paginator) {
            return;
        }
        this.dataSource.paginator = this._paginator;
        this._paginator.pageSize = this.tablePageSize;
    }

    orgName(row: MyProposalRow): string {
        return row.organization?.name || '—';
    }

    statusLabel(row: MyProposalRow): string {
        const s = row.status;
        if (s === 'draft') {
            return 'Draft';
        }
        if (s === 'ready_to_submit') {
            return 'Ready to submit';
        }
        if (row.sponsor) {
            return 'Sponsored';
        }
        if (row.votes?.length) {
            return 'Under review';
        }
        return 'Submitted';
    }

    isComposer(row: MyProposalRow): boolean {
        return row.status === 'draft' || row.status === 'ready_to_submit';
    }

    view(row: MyProposalRow): void {
        const pid = row.proposalID;
        if (!pid) {
            return;
        }
        this.router.navigate(['/pages/proposal', pid]);
    }

    continueEditing(row: MyProposalRow): void {
        const org = row.organization?._id ?? (row.organization as unknown as string);
        const orgID = row.organization?.organizationID ?? '';
        if (!org) {
            return;
        }
        this.router.navigate(['/pages/proposal/create'], {
            queryParams: {
                org: String(org),
                ...(orgID ? { orgID: String(orgID) } : {}),
                ...(row._id ? { draft: String(row._id) } : {}),
                returnTo: 'proposals',
            },
        });
    }

    deleteDraft(row: MyProposalRow): void {
        if (!this.isComposer(row) || !row._id) {
            return;
        }
        const ref = this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Delete draft proposal?',
                message: `Remove "${row.projectTitle?.trim() || 'Untitled'}" for ${this.orgName(row)}? This cannot be undone.`,
                confirmText: 'Delete',
                cancelText: 'Cancel',
                warn: true,
            },
        });
        ref.afterClosed().subscribe((ok) => {
            if (!ok) {
                return;
            }
            this.proposalService.deleteMyProposal(row._id).subscribe({
                next: () => {
                    this.snackBar.open('Proposal deleted', 'Dismiss', { duration: 4000 });
                    if (this.selectedYear != null) {
                        this.loadProposals(this.selectedYear);
                    }
                },
                error: (err) => {
                    const msg = err.error?.message || 'Could not delete proposal';
                    this.snackBar.open(msg, 'Dismiss', { duration: 6000 });
                },
            });
        });
    }

}
