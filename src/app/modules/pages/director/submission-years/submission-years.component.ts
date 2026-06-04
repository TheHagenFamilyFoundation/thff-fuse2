import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';
import { SubmissionYearsService } from 'app/core/services/admin/submission-years.service';
import { ClosePortalDialogComponent } from './close-portal-dialog.component';

@Component({
    standalone: false,
    selector: 'app-submission-years',
    templateUrl: './submission-years.component.html',
    styleUrls: ['./submission-years.component.scss']
})
export class SubmissionYearsComponent implements OnInit {

    @ViewChild(MatSort) set matSort(sort: MatSort | undefined) {
        this._sort = sort;
        if (this.dataSource && sort) {
            this.dataSource.sort = sort;
        }
    }

    displayedColumns: string[] = ['year', 'createdAt', 'updatedAt', 'active', 'toggle'];
    dataSource = new MatTableDataSource<any>([]);
    currentYear: number;
    submissionYearMissing = false;
    tableLoaded = false;
    loadError: string | null = null;

    private _sort: MatSort;
    private years: any[] = [];

    constructor(
        public submissionYearsService: SubmissionYearsService,
        private _dialog: MatDialog,
        private _snackBar: MatSnackBar,
        private _cdr: ChangeDetectorRef
    ) {
        this.currentYear = new Date().getFullYear();
    }

    ngOnInit(): void {
        this.loadSubmissionYears();
    }

    toggleSubmissionYear(row: { _id: string; subID?: string; year: number; active: boolean }): void {
        const yearFound = this.years.find(
            (y) => String(y._id) === String(row._id) || y.subID === row.subID
        );
        if (!yearFound?._id) {
            return;
        }

        if (yearFound.active) {
            const dialogRef = this._dialog.open(ClosePortalDialogComponent, {
                width: '440px',
                data: { year: yearFound.year }
            });

            dialogRef.afterClosed().subscribe((confirmed) => {
                if (confirmed) {
                    this.submissionYearsService.toggleSubmissionYear(yearFound._id, false).subscribe({
                        next: () => { this.loadSubmissionYears(); },
                        error: (err) => {
                            console.error('toggleSubmissionYear error', err);
                            this._snackBar.open('Could not close the portal', 'Close', { duration: 5000 });
                        }
                    });
                }
            });
        } else {
            this.submissionYearsService.toggleSubmissionYear(yearFound._id, true).subscribe({
                next: () => { this.loadSubmissionYears(); },
                error: (err) => {
                    console.error('toggleSubmissionYear error', err);
                    this._snackBar.open('Could not open the portal', 'Close', { duration: 5000 });
                }
            });
        }
    }

    createSubmissionYear(): void {
        this.submissionYearsService.createSubmissionYear(this.currentYear).subscribe({
            next: () => { this.loadSubmissionYears(); },
            error: (err) => {
                console.error('createSubmissionYear error', err);
                const msg = err?.error?.message || 'Could not create submission year';
                this._snackBar.open(msg, 'Close', { duration: 5000 });
            }
        });
    }

    private loadSubmissionYears(): void {
        this.tableLoaded = false;
        this.loadError = null;
        this._cdr.markForCheck();

        this.submissionYearsService
            .getAllSubmissionYears(this.currentYear)
            .pipe(
                finalize(() => {
                    this.tableLoaded = true;
                    this._cdr.markForCheck();
                })
            )
            .subscribe({
                next: (years) => {
                    const list = Array.isArray(years) ? years : [];
                    this.years = list;
                    this.dataSource.data = list;
                    if (this._sort) {
                        this.dataSource.sort = this._sort;
                    }
                    this.checkCurrentYearSubmissionYear();
                },
                error: (err) => {
                    console.error('getAllSubmissionYears error', err);
                    this.years = [];
                    this.dataSource.data = [];
                    this.loadError = err?.error?.message || 'Could not load submission years';
                    this._snackBar.open(this.loadError, 'Close', { duration: 5000 });
                },
            });
    }

    private checkCurrentYearSubmissionYear(): void {
        this.submissionYearMissing = !this.years?.find((y) => y.year === this.currentYear);
    }
}
