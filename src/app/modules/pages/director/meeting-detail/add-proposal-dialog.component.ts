import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { MeetingService } from 'app/core/services/admin/meeting.service';
import { ProposalService } from 'app/core/services/proposal/proposal.service';

export interface AddProposalDialogData {
    meetingId: string;
    /** Meeting year — the default year to search, but the director can change it. */
    year: number;
    /** Proposal Mongo `_id`s already on the meeting (hidden / marked as added). */
    existingProposalIds: string[];
}

/**
 * Lets a president/admin search proposals (by year + title) and hand-add one to the meeting,
 * regardless of the proposal's year — e.g. a proposal submitted after the portal closed.
 * On success the dialog closes with the updated meeting payload.
 */
@Component({
    standalone: false,
    selector: 'app-add-proposal-dialog',
    template: `
        <h2 mat-dialog-title class="text-lg font-semibold">Add a proposal to this meeting</h2>
        <mat-dialog-content class="min-w-[28rem]">
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Search by title, organization, sponsor, or proposal ID and add a proposal to this
                meeting. Pick a different year to add a proposal submitted for another cycle.
            </p>

            <div class="flex gap-3 items-end mb-3">
                <mat-form-field class="w-28" appearance="fill">
                    <mat-label>Year</mat-label>
                    <input matInput type="number" [(ngModel)]="year" (ngModelChange)="onYearChange()" />
                </mat-form-field>
                <mat-form-field class="flex-1" appearance="fill">
                    <mat-label>Search</mat-label>
                    <input
                        matInput
                        [(ngModel)]="filter"
                        (ngModelChange)="onFilterChange($event)"
                        placeholder="Title, organization, sponsor, or proposal ID"
                    />
                    <mat-icon matSuffix>search</mat-icon>
                </mat-form-field>
            </div>

            <div class="min-h-[10rem]">
                <div *ngIf="loading" class="flex justify-center py-8">
                    <mat-progress-spinner mode="indeterminate" diameter="32"></mat-progress-spinner>
                </div>

                <div
                    *ngIf="!loading && results.length === 0"
                    class="text-sm text-gray-500 dark:text-gray-400 py-8 text-center"
                >
                    No submitted proposals found for {{ year }}.
                </div>

                <div *ngIf="!loading && results.length > 0" class="flex flex-col divide-y divide-gray-200 dark:divide-gray-700">
                    <div
                        *ngFor="let p of results"
                        class="flex items-center justify-between gap-3 py-2"
                    >
                        <div class="min-w-0">
                            <div class="font-medium truncate">{{ p.projectTitle || 'Untitled' }}</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {{ orgLabel(p) }}
                                <span *ngIf="p.amountRequested != null">
                                    · Requested {{ p.amountRequested | currency }}
                                </span>
                                <span *ngIf="p.proposalID"> · ID {{ p.proposalID }}</span>
                            </div>
                        </div>
                        <button
                            *ngIf="!isOnMeeting(p)"
                            mat-flat-button
                            color="primary"
                            [disabled]="!!addingId"
                            (click)="add(p)"
                        >
                            <mat-progress-spinner
                                *ngIf="addingId === proposalId(p)"
                                mode="indeterminate"
                                diameter="16"
                                class="inline-block mr-1"
                            ></mat-progress-spinner>
                            Add
                        </button>
                        <span *ngIf="isOnMeeting(p)" class="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                            <mat-icon class="icon-size-4">check</mat-icon> On meeting
                        </span>
                    </div>
                </div>
            </div>
        </mat-dialog-content>
        <mat-dialog-actions align="end" class="mt-2">
            <button mat-stroked-button (click)="close()" [disabled]="!!addingId">Done</button>
        </mat-dialog-actions>
    `,
})
export class AddProposalDialogComponent implements OnInit {
    year: number;
    filter = '';
    loading = false;
    results: any[] = [];
    /** Proposal `_id` currently being added (drives the row spinner / disabled state). */
    addingId: string | null = null;

    private readonly existing = new Set<string>();
    private readonly _search$ = new Subject<void>();
    private readonly _destroy$ = new Subject<void>();
    /** Meeting keeps updating as proposals are added; returned to the caller on close. */
    private latestMeeting: any = null;

    constructor(
        public dialogRef: MatDialogRef<AddProposalDialogComponent, any>,
        @Inject(MAT_DIALOG_DATA) public data: AddProposalDialogData,
        private meetingService: MeetingService,
        private proposalService: ProposalService,
        private snackBar: MatSnackBar,
        private _cdr: ChangeDetectorRef
    ) {
        this.year = data?.year || new Date().getFullYear();
        for (const id of data?.existingProposalIds || []) {
            this.existing.add(String(id));
        }
    }

    ngOnInit(): void {
        this._search$
            .pipe(debounceTime(300), takeUntil(this._destroy$))
            .subscribe(() => this.search());
        this.search();
    }

    onYearChange(): void {
        this._search$.next();
    }

    onFilterChange(_value: string): void {
        this._search$.next();
    }

    search(): void {
        if (!this.year) {
            this.results = [];
            return;
        }
        this.loading = true;
        this._cdr.markForCheck();
        this.proposalService
            .getProps(this.year, 0, 50, this.filter || '', 'createdOn', 'desc')
            .pipe(takeUntil(this._destroy$))
            .subscribe({
                next: (res: any) => {
                    const items = Array.isArray(res) ? res : res?.items || [];
                    this.results = items;
                    this.loading = false;
                    this._cdr.markForCheck();
                },
                error: () => {
                    this.results = [];
                    this.loading = false;
                    this.snackBar.open('Could not load proposals', 'Close', { duration: 5000 });
                    this._cdr.markForCheck();
                },
            });
    }

    proposalId(p: any): string {
        return String(p?._id ?? '');
    }

    isOnMeeting(p: any): boolean {
        return this.existing.has(this.proposalId(p));
    }

    orgLabel(p: any): string {
        const o = p?.organization;
        if (!o || typeof o !== 'object') {
            return 'Unknown organization';
        }
        const name = o.name ? String(o.name).trim() : '';
        const shortId = o.organizationID ? String(o.organizationID).trim() : '';
        if (name && shortId) {
            return `${name} · ${shortId}`;
        }
        return name || (shortId ? `Organization ${shortId}` : 'Unknown organization');
    }

    add(p: any): void {
        const proposalId = this.proposalId(p);
        if (!proposalId || this.addingId) {
            return;
        }
        this.addingId = proposalId;
        this._cdr.markForCheck();
        this.meetingService
            .addProposalToMeeting(this.data.meetingId, proposalId)
            .pipe(takeUntil(this._destroy$))
            .subscribe({
                next: (meeting) => {
                    this.latestMeeting = meeting;
                    this.existing.add(proposalId);
                    this.addingId = null;
                    this.snackBar.open('Proposal added to meeting', 'Close', { duration: 3000 });
                    this._cdr.markForCheck();
                },
                error: (err) => {
                    this.addingId = null;
                    const msg = err?.error?.message || 'Could not add proposal to meeting';
                    this.snackBar.open(msg, 'Close', { duration: 5000 });
                    this._cdr.markForCheck();
                },
            });
    }

    close(): void {
        if (this.addingId) {
            return;
        }
        this._destroy$.next();
        this._destroy$.complete();
        this.dialogRef.close(this.latestMeeting);
    }
}
