import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MeetingService } from 'app/core/services/admin/meeting.service';
import { SubmissionYearsService } from 'app/core/services/admin/submission-years.service';

export interface CreateMeetingDialogData {
    /** When empty, the dialog loads submission years itself. */
    years?: any[];
}

@Component({
    standalone: false,
    selector: 'app-create-meeting-dialog',
    templateUrl: './create-meeting-dialog.component.html',
    styleUrls: ['./create-meeting-dialog.component.scss']
})
export class CreateMeetingDialogComponent implements OnInit {
    years: any[] = [];
    selectedYearId: string | undefined;
    totalBudget = 0;
    meetingNotes = '';
    creating = false;
    loadingYears = false;

    private readonly currentYear = new Date().getFullYear();

    constructor(
        public dialogRef: MatDialogRef<CreateMeetingDialogComponent, { _id: string } | undefined>,
        @Inject(MAT_DIALOG_DATA) public data: CreateMeetingDialogData,
        private meetingService: MeetingService,
        private submissionYearsService: SubmissionYearsService,
        private snackBar: MatSnackBar,
        private _cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        const incoming = Array.isArray(this.data?.years) ? this.data.years : [];
        if (incoming.length > 0) {
            this.applyYears(incoming);
            return;
        }
        this.loadingYears = true;
        this.submissionYearsService.getAllSubmissionYears(this.currentYear).subscribe({
            next: (years) => {
                const arr = Array.isArray(years) ? years : [];
                this.applyYears(arr.slice().sort((a, b) => (b?.year ?? 0) - (a?.year ?? 0)));
                this.loadingYears = false;
                this._cdr.markForCheck();
            },
            error: () => {
                this.years = [];
                this.loadingYears = false;
                this._cdr.markForCheck();
            }
        });
    }

    private applyYears(arr: any[]): void {
        this.years = arr;
        if (this.years.length > 0) {
            this.selectedYearId = this.years[0]._id;
        }
    }

    cancel(): void {
        if (this.creating) {
            return;
        }
        this.dialogRef.close(undefined);
    }

    submit(): void {
        if (!this.selectedYearId || this.creating) {
            return;
        }
        const year = this.years.find((y) => y._id === this.selectedYearId);
        if (!year) {
            return;
        }
        this.creating = true;
        const payload = {
            submissionYear: this.selectedYearId,
            year: year.year,
            totalBudget: this.totalBudget || 0,
            notes: this.meetingNotes
        };
        this.meetingService.createMeeting(payload).subscribe({
            next: (meeting) => {
                this.creating = false;
                this.dialogRef.close(meeting);
            },
            error: (err) => {
                this.creating = false;
                const msg = err.error?.message || 'Error creating meeting';
                this.snackBar.open(msg, 'Close', { duration: 5000 });
                this._cdr.markForCheck();
            }
        });
    }
}
