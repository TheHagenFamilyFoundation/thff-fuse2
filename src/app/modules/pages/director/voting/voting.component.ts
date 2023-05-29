import { Component, OnInit, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, SortDirection } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { merge, Observable, of as observableOf, fromEvent } from 'rxjs';
import { catchError, map, startWith, switchMap, debounceTime, distinctUntilChanged, tap, filter } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ProposalService } from 'app/core/services/proposal/proposal.service';
@Component({
    selector: 'app-voting',
    templateUrl: './voting.component.html',
    styleUrls: ['./voting.component.scss']
})
export class VotingComponent implements AfterViewInit {

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild('filterInput') input: ElementRef;

    proposals: any;

    limit: number;

    skip: number;

    sortColumn: string;

    sortDirection: string;

    propCount: number;

    resultsLength = 0;

    displayedColumns = ['projectTitle', 'organization', 'createdOn', 'votes', 'score', 'link'];

    data: [];

    loaded: boolean;

    pageEvent: PageEvent;

    filterInputString: string;

    constructor(public proposalService: ProposalService, private _router: Router) {
        this.loaded = false;
        this.filterInputString = '';
        this.limit = 10;
        this.skip = 0;
        this.sortDirection = 'desc';
        this.sortColumn = 'createdOn';
    }

    getProposalCount(countFilter?: string): void {
        this.proposalService.getProposalCount(countFilter)
            .subscribe(
                (count) => { this.propCount = count; });
    }

    ngAfterViewInit(): void {

        this.sort.start = 'desc';

        this.getProposalCount(); // no need for parameter

        // If the user changes the sort order, reset back to the first page.
        this.sort.sortChange.subscribe(() => {
            console.log('this.sort', this.sort);
            console.log('this.sort.active', this.sort.active);
            console.log('this.sort.direction', this.sort.direction);
            this.skip = 0; //reset;
            this.sortDirection = this.sort.direction;
            this.sortColumn = this.sort.active;
            this.paginator.pageIndex = 0;
        });

        merge(this.sort.sortChange, this.paginator.page)
            .pipe(
                startWith({}),
                switchMap(() => {
                    this.loaded = false;
                    return this.proposalService.getProps(this.skip, this.limit, this.filterInputString, this.sortColumn, this.sortDirection)
                        .pipe(catchError(() => observableOf(null)));
                }),
                map((data) => {

                    // Flip flag to show that loading has finished.
                    this.loaded = true;
                    // this.isRateLimitReached = data === null;

                    if (data === null) {
                        return [];
                    }

                    console.log('data', data);

                    // Only refresh the result length if there is new data. In case of rate
                    // limit errors, we do not want to reset the paginator to zero, as that
                    // would prevent users from re-triggering requests.
                    // this.orgCount = data.length;
                    this.getProposalCount(this.filterInputString);
                    return data;
                }),
            )
            .subscribe(data => (this.data = data));

        // server-side filter
        fromEvent(this.input.nativeElement, 'keyup')
            .pipe(
                filter(Boolean),
                debounceTime(500),
                distinctUntilChanged(),
                tap((event: KeyboardEvent) => {
                    console.log(event);
                    this.filterInputString = (event.target as HTMLInputElement).value;
                    this.proposalService.getProps(this.skip, this.limit, this.filterInputString, this.sortColumn, this.sortDirection).subscribe((data) => { this.data = data; });
                    this.getProposalCount(this.filterInputString);
                })
            )
            .subscribe();

    }

    //possible view Proposal
    goToProposal(propID: string): void {
        this._router.navigate(['/pages/proposal/', propID]);
    }

    handlePageEvent(e: PageEvent): void {
        this.pageEvent = e;
        console.log('this.pageEvent', this.pageEvent);

        if (this.pageEvent.pageSize !== this.limit) {
            console.log('page size is different');
            this.limit = this.pageEvent.pageSize;
            this.skip = 0;
            this.paginator.pageIndex = 0;
        }
        else {
            if (this.pageEvent.previousPageIndex < this.pageEvent.pageIndex) {
                this.skip = this.skip + this.limit;
            }
            else {
                this.skip = this.skip - this.limit;
            }
        }

    }

}
