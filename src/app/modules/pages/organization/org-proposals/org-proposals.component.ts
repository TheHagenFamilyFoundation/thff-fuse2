import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    ElementRef,
    Input,
    OnChanges,
    OnDestroy,
    SimpleChanges,
    ViewChild,
} from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { from, merge, of as observableOf, fromEvent, Subject } from 'rxjs';
import {
    catchError,
    debounceTime,
    distinctUntilChanged,
    map,
    switchMap,
    takeUntil,
    tap,
} from 'rxjs/operators';

import { GetUserService } from 'app/core/services/user/get-user.service';
import { ProposalService } from 'app/core/services/proposal/proposal.service';
import { SubmissionYearsService } from 'app/core/services/admin/submission-years.service';
import { UserPreferencesService } from 'app/core/services/user/user-preferences.service';

@Component({
    standalone: false,
    selector: 'app-org-proposals',
    templateUrl: './org-proposals.component.html',
    styleUrls: ['./org-proposals.component.scss'],
})
export class OrgProposalsComponent implements AfterViewInit, OnChanges, OnDestroy {
    @Input()
    org: any;

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild('filterInput', { static: true }) input: ElementRef;

    displayedColumns = ['projectTitle', 'status', 'amountRequested', 'sponsor', 'createdOn', 'action'];

    readonly tablePageSizeOptions = [5, 10, 25];
    tablePageSize: number;

    limit: number;

    skip: number;

    sortColumn: string;

    sortDirection: string;

    propCount: number;

    years: any[] = [];

    year: number;

    selectedYear: string | undefined;

    currentYear: any;

    portalOpen: boolean;

    loaded: boolean;

    data: any[] = [];

    dataSource: MatTableDataSource<ProposalData>;

    filterInputString: string;

    pageEvent: PageEvent;

    portalMessage: string;

    /** Refetch table when org changes or submission years resolve to a calendar year. */
    private readonly proposalsReload$ = new Subject<void>();

    private readonly destroy$ = new Subject<void>();

    constructor(
        public getUserService: GetUserService,
        public proposalService: ProposalService,
        public submissionYearsService: SubmissionYearsService,
        private _router: Router,
        private _cdr: ChangeDetectorRef,
        private _userPreferences: UserPreferencesService,
    ) {
        this.loaded = false;
        this.filterInputString = '';
        this.tablePageSize = this._userPreferences.pageSizeForOptions(this.tablePageSizeOptions);
        this.limit = this.tablePageSize;
        this.skip = 0;
        this.sortDirection = 'desc';
        this.sortColumn = 'createdOn';
        this.year = new Date().getFullYear();
        this.data = [];
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (!changes['org']) {
            return;
        }
        const oid = this.getOrgMongoId();
        if (!oid) {
            return;
        }
        if (changes['org'].firstChange) {
            return;
        }
        const prev = changes['org'].previousValue;
        const prevId = prev?._id ?? prev?.id;
        if (prevId === oid) {
            return;
        }
        this.skip = 0;
        this.filterInputString = '';
        if (this.input?.nativeElement) {
            this.input.nativeElement.value = '';
        }
        if (this.paginator) {
            this.paginator.pageIndex = 0;
        }
        this.proposalsReload$.next();
        this._cdr.markForCheck();
    }

    ngAfterViewInit(): void {
        this.sort.start = 'desc';

        if (!localStorage.getItem('currentUser')) {
            this._router.navigate(['/pages/auth/logout']);
            return;
        }

        const orgMongoId = this.getOrgMongoId();
        if (!orgMongoId) {
            this.loaded = true;
            this.data = [];
            return;
        }

        this.getSubmissionYears();
        this.getCurrentSubmissionYear();

        merge(from(this.sort.sortChange), from(this.paginator.page), this.proposalsReload$)
            .pipe(
                takeUntil(this.destroy$),
                tap((evt) => {
                    if (
                        evt &&
                        typeof evt === 'object' &&
                        'active' in evt &&
                        'direction' in evt
                    ) {
                        this.skip = 0;
                        this.sortDirection = this.sort.direction;
                        this.sortColumn = this.sort.active;
                        if (this.paginator) {
                            this.paginator.pageIndex = 0;
                        }
                    }
                }),
                switchMap(() => {
                    const oid = this.getOrgMongoId();
                    if (!oid) {
                        this.loaded = true;
                        return observableOf(null);
                    }
                    this.loaded = false;
                    return this.proposalService
                        .getOrgProps(
                            this.year,
                            oid,
                            this.skip,
                            this.limit,
                            this.filterInputString,
                            this.sortColumn,
                            this.sortDirection,
                        )
                        .pipe(catchError(() => observableOf(null)));
                }),
                map((data) => {
                    this.loaded = true;
                    if (data === null) {
                        return [];
                    }
                    this.getOrgProposalCount(this.year, this.filterInputString);
                    return data;
                }),
            )
            .subscribe((data) => {
                this.data = data;
                this._cdr.markForCheck();
            });

        fromEvent<Event>(this.input.nativeElement, 'keyup')
            .pipe(
                map((e) => (e.target as HTMLInputElement).value),
                debounceTime(500),
                distinctUntilChanged(),
                takeUntil(this.destroy$),
                tap((value) => {
                    this.filterInputString = value;
                    this.skip = 0;
                    if (this.paginator) {
                        this.paginator.pageIndex = 0;
                    }
                    this.loaded = false;
                    const oid = this.getOrgMongoId();
                    if (!oid) {
                        this.loaded = true;
                        this.data = [];
                        return;
                    }
                    this.proposalService
                        .getOrgProps(
                            this.year,
                            oid,
                            this.skip,
                            this.limit,
                            this.filterInputString,
                            this.sortColumn,
                            this.sortDirection,
                        )
                        .subscribe({
                            next: (rows) => {
                                this.data = rows;
                                this.loaded = true;
                                this._cdr.markForCheck();
                            },
                            error: () => {
                                this.loaded = true;
                                this.data = [];
                                this._cdr.markForCheck();
                            },
                        });
                    this.getOrgProposalCount(this.year, this.filterInputString);
                }),
            )
            .subscribe();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private getOrgMongoId(): string | null {
        const o = this.org;
        if (!o) {
            return null;
        }
        const id = o._id ?? o.id;
        return id != null ? String(id) : null;
    }

    handlePageEvent(e: PageEvent): void {
        this.pageEvent = e;

        if (this.pageEvent.pageSize !== this.limit) {
            this._userPreferences.setTablePageSize(this.pageEvent.pageSize);
            this.tablePageSize = this.pageEvent.pageSize;
            this.limit = this.pageEvent.pageSize;
            this.skip = 0;
            this.paginator.pageIndex = 0;
        } else {
            if (this.pageEvent.previousPageIndex < this.pageEvent.pageIndex) {
                this.skip = this.skip + this.limit;
            } else {
                this.skip = this.skip - this.limit;
            }
        }
    }

    getSubmissionYears(): void {
        this.submissionYearsService.getAllSubmissionYears(this.year).subscribe({
            next: (years) => {
                this.years = Array.isArray(years) ? years : [];
                if (this.years.length === 0) {
                    this.selectedYear = undefined;
                    this.proposalsReload$.next();
                    this._cdr.markForCheck();
                    return;
                }
                const first = this.years[0];
                this.selectedYear = first._id != null ? String(first._id) : undefined;
                const y = Number(first.year);
                if (Number.isFinite(y)) {
                    this.year = y;
                }
                this.getOrgProposalCount(this.year, this.filterInputString);
                this.proposalsReload$.next();
                this._cdr.markForCheck();
            },
            error: () => {
                this.years = [];
                this.selectedYear = undefined;
                this.proposalsReload$.next();
                this._cdr.markForCheck();
            },
        });
    }

    getCurrentSubmissionYear(): void {
        this.submissionYearsService.getCurrentSubmissionYear().subscribe({
            next: (year) => {
                this.currentYear = year;
                this.portalOpen = this.currentYear.active;
                this.portalMessage = `${this.currentYear.year} Grant Cycle is Closed`;
                this._cdr.markForCheck();
            },
            error: () => {
                this.portalOpen = false;
                this.portalMessage = `${this.year} Grant Cycle Is Opening Soon`;
                this._cdr.markForCheck();
            },
        });
    }

    checkProposals(): void {
        this.sort.start = 'desc';
        const proposals = this.filterByYear(this.org.proposals, this.year);
        this.data = proposals;
    }

    createProposal(): void {
        const oid = this.getOrgMongoId();
        if (!oid) {
            return;
        }
        this._router.navigate(['/pages/proposal/create'], {
            queryParams: {
                org: oid,
                orgID: this.org.organizationID,
                returnTo: 'organization',
            },
        });
    }

    onProposalRowClick(row: any): void {
        if (this.isComposerRow(row)) {
            this.continueDraft(row);
            return;
        }
        if (row?.proposalID) {
            this.goToProposal(row.proposalID);
        }
    }

    isComposerRow(row: any): boolean {
        return row?.status === 'draft' || row?.status === 'ready_to_submit';
    }

    proposalStatusLabel(row: any): string {
        if (row?.status === 'draft') {
            return 'Draft';
        }
        if (row?.status === 'ready_to_submit') {
            return 'Ready to submit';
        }
        return 'Submitted';
    }

    continueDraft(row: any): void {
        const oid = this.getOrgMongoId();
        if (!oid || !row?._id) {
            return;
        }
        this._router.navigate(['/pages/proposal/create'], {
            queryParams: {
                org: oid,
                orgID: this.org?.organizationID,
                draft: String(row._id),
                returnTo: 'organization',
            },
        });
    }

    goToProposal(proposalID: string): void {
        this._router.navigate(['/pages/proposal/', proposalID], {
            queryParams: { from: 'organization' },
        });
    }

    getOrgProposalCount(year: number, countFilter?: string): void {
        const oid = this.getOrgMongoId();
        if (!oid) {
            return;
        }
        this.proposalService.getOrgProposalCount(year, oid, countFilter).subscribe({
            next: (count) => {
                this.propCount = count;
                this._cdr.markForCheck();
            },
            error: () => {},
        });
    }

    yearChanged(e: { value: string }): void {
        const row = this.years?.find((y) => String(y._id) === String(e.value));
        if (!row) {
            return;
        }
        this.selectedYear = String(row._id);
        this.year = row.year;
        this.getOrgProposalCount(this.year, this.filterInputString);
        const oid = this.getOrgMongoId();
        if (!oid) {
            return;
        }
        this.proposalService
            .getOrgProps(
                this.year,
                oid,
                this.skip,
                this.limit,
                this.filterInputString,
                this.sortColumn,
                this.sortDirection,
            )
            .subscribe({
                next: (data) => {
                    this.data = data;
                    this._cdr.markForCheck();
                },
                error: () => {},
            });
    }

    private getViewerMongoId(): string | null {
        try {
            const raw = localStorage.getItem('currentUser');
            if (!raw) {
                return null;
            }
            const u = JSON.parse(raw);
            const id = u.id ?? u._id;
            return id != null ? String(id) : null;
        } catch {
            return null;
        }
    }

    filterByYear(items, year): any {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year + 1, 0, 1);

        const viewerId = this.getViewerMongoId();
        return items.filter((item: any) => {
            const itemDate = new Date(item.createdAt);
            const inYear = itemDate >= startDate && itemDate < endDate;
            if (!inYear) {
                return false;
            }
            if (item?.status === 'submitted') {
                return true;
            }
            const composer = item?.status === 'draft' || item?.status === 'ready_to_submit';
            const creator = item?.createdBy?._id ?? item?.createdBy;
            return composer && viewerId != null && String(creator) === viewerId;
        });
    }
}

export interface ProposalData {
    name: string;
    color: string;
}
