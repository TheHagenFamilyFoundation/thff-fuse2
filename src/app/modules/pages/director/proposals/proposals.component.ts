import { ChangeDetectorRef, Component, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { merge, of as observableOf, fromEvent } from 'rxjs';
import { catchError, map, switchMap, debounceTime, distinctUntilChanged, tap, filter } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ProposalService } from 'app/core/services/proposal/proposal.service';
import { SubmissionYearsService } from 'app/core/services/admin/submission-years.service';
import { AuthService } from 'app/core/auth/auth.service';
import { UserPreferencesService } from 'app/core/services/user/user-preferences.service';

@Component({
    standalone: false,
    selector: 'app-proposals',
    templateUrl: './proposals.component.html',
    styleUrls: ['./proposals.component.scss']
})
export class ProposalsComponent implements AfterViewInit {

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild('filterInput', { static: true }) input: ElementRef;

    displayedColumns = ['projectTitle', 'organization', 'createdOn', 'sponsor', 'amountRequested', 'totalProjectCost', 'action'];
    data: any[] = [];
    propCount: number;
    years: any;
    selectedYear: number;
    loaded: boolean = false;
    pageEvent: PageEvent;
    filterInputString: string = '';
    isPresident: boolean = false;
    archivedFilter: string = ''; // '' = active only, 'only' = archived only, 'true' = all

    readonly tablePageSizeOptions = [10, 25, 100];
    tablePageSize: number;

    private limit: number;
    private skip: number = 0;
    private sortColumn: string = 'createdOn';
    private sortDirection: string = 'desc';
    private year: number = (new Date()).getFullYear();

    /** Merge(list) is wired after submission years load to avoid a wasted proposal request + wrong year. */
    private mergeConnected = false;

    constructor(
        public proposalService: ProposalService,
        public submissionYearsService: SubmissionYearsService,
        private _router: Router,
        private _authService: AuthService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _userPreferences: UserPreferencesService,
    ) {
        this.tablePageSize = this._userPreferences.pageSizeForOptions(this.tablePageSizeOptions);
        this.limit = this.tablePageSize;
        this._authService.checkPresident().subscribe((isP) => {
            this.isPresident = isP;
        });
    }

    ngAfterViewInit(): void {
        this.sort.start = 'desc';
        this.sort.sortChange.subscribe(() => {
            this.skip = 0;
            this.sortDirection = this.sort.direction;
            this.sortColumn = this.sort.active;
            this.paginator.pageIndex = 0;
        });

        this.getSubmissionYears();

        fromEvent(this.input.nativeElement, 'keyup')
            .pipe(
                filter(Boolean),
                debounceTime(500),
                distinctUntilChanged(),
                tap((event: KeyboardEvent) => {
                    this.filterInputString = (event.target as HTMLInputElement).value;
                    this.skip = 0;
                    this.paginator.pageIndex = 0;
                    this.loaded = false;
                    this.proposalService
                        .getProps(
                            this.year,
                            this.skip,
                            this.limit,
                            this.filterInputString,
                            this.sortColumn,
                            this.sortDirection,
                            this.archivedFilter || undefined,
                            true
                        )
                        .subscribe({
                            next: (data) => {
                                const { rows, total } = this.normalizeProposalListResult(data);
                                this.data = rows.slice();
                                if (typeof total === 'number') {
                                    this.propCount = total;
                                } else {
                                    this.getProposalCount(this.year, this.filterInputString);
                                }
                                this.loaded = true;
                                this._changeDetectorRef.markForCheck();
                            },
                            error: () => {
                                this.loaded = true;
                                this.data = [];
                            }
                        });
                })
            )
            .subscribe();
    }

    goToProposal(propID: string): void {
        this._router.navigate(['/pages/proposal/', propID], {
            queryParams: { from: 'director-proposals' },
        });
    }

    clearFilter(): void {
        this.filterInputString = '';
        if (this.input?.nativeElement) {
            this.input.nativeElement.value = '';
        }
        this.refreshData();
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

    yearChanged(e: any): void {
        const selected = this.years.find(y => y._id === e.value);
        this.selectedYear = selected._id;
        this.year = selected.year;
        this.filterInputString = '';
        if (this.input?.nativeElement) {
            this.input.nativeElement.value = '';
        }
        this.refreshData();
    }

    archivedFilterChanged(value: string): void {
        this.archivedFilter = value;
        this.refreshData();
    }

    private normalizeProposalListResult(data: any): { rows: any[]; total?: number } {
        if (data === null || data === undefined) {
            return { rows: [] };
        }
        if (typeof data === 'object' && Array.isArray(data.items)) {
            const t = data.total;
            const total =
                typeof t === 'number' && Number.isFinite(t)
                    ? t
                    : typeof t === 'string' && t.trim() !== '' && Number.isFinite(Number(t))
                      ? Number(t)
                      : undefined;
            return { rows: data.items, total };
        }
        if (Array.isArray(data)) {
            return { rows: data };
        }
        return { rows: [] };
    }

    private refreshData(): void {
        this.skip = 0;
        this.paginator.pageIndex = 0;
        this.loaded = false;
        this.proposalService
            .getProps(
                this.year,
                this.skip,
                this.limit,
                this.filterInputString,
                this.sortColumn,
                this.sortDirection,
                this.archivedFilter || undefined,
                true
            )
            .subscribe({
                next: (data) => {
                    const { rows, total } = this.normalizeProposalListResult(data);
                    this.data = rows.slice();
                    if (typeof total === 'number') {
                        this.propCount = total;
                    } else {
                        this.getProposalCount(this.year, this.filterInputString);
                    }
                    this.loaded = true;
                    this._changeDetectorRef.markForCheck();
                    if (!this.mergeConnected) {
                        this.connectProposalListMerge();
                    }
                },
                error: (err) => {
                    console.error('getProps error', err);
                    this.loaded = true;
                    this.data = [];
                    this._changeDetectorRef.markForCheck();
                }
            });
    }

    /**
     * Subscribes sort + paginator only after the first list response so we never race a duplicate
     * HTTP against the initial load (paginator often emits on subscribe and could overwrite rows).
     */
    private connectProposalListMerge(): void {
        if (this.mergeConnected) {
            return;
        }
        this.mergeConnected = true;
        merge(this.sort.sortChange, this.paginator.page)
            .pipe(
                switchMap(() => {
                    this.loaded = false;
                    return this.proposalService
                        .getProps(
                            this.year,
                            this.skip,
                            this.limit,
                            this.filterInputString,
                            this.sortColumn,
                            this.sortDirection,
                            this.archivedFilter || undefined,
                            true
                        )
                        .pipe(catchError(() => observableOf(null)));
                }),
                map((data) => {
                    if (data === null) {
                        this.loaded = true;
                        this._changeDetectorRef.markForCheck();
                        return this.data;
                    }
                    const { rows, total } = this.normalizeProposalListResult(data);
                    this.loaded = true;
                    if (typeof total === 'number') {
                        this.propCount = total;
                    } else {
                        this.getProposalCount(this.year, this.filterInputString);
                    }
                    this._changeDetectorRef.markForCheck();
                    return rows.slice();
                })
            )
            .subscribe((rows) => {
                this.data = rows;
            });
    }

    private getSubmissionYears(): void {
        this.submissionYearsService.getAllSubmissionYears(this.year).subscribe({
            next: (years) => {
                if (!years?.length) {
                    console.error('getAllSubmissionYears: no submission years');
                    return;
                }
                this.years = years;
                this.selectedYear = years[0]._id;
                this.year = years[0].year;
                this.refreshData();
            },
            error: (err) => {
                console.error('getAllSubmissionYears error', err);
            }
        });
    }

    private getProposalCount(year: number, countFilter?: string): void {
        this.proposalService.getProposalCount(year, countFilter, this.archivedFilter || undefined).subscribe({
            next: (count) => {
                this.propCount = count;
            },
            error: (err) => {
                console.error('getProposalCount error', err);
            }
        });
    }
}
