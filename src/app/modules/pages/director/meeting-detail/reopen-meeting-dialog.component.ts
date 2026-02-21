import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'reopen-meeting-dialog',
    template: `
        <h2 mat-dialog-title class="text-lg font-semibold">Reopen {{ data.year }} Meeting</h2>
        <mat-dialog-content>
            <p class="text-gray-600 dark:text-gray-300">
                Are you sure you want to reopen the <strong>{{ data.year }}</strong> meeting?
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                This will unlock allocations so they can be edited again.
                You can re-finalize the meeting when you're done.
            </p>
        </mat-dialog-content>
        <mat-dialog-actions align="end" class="mt-4">
            <button mat-stroked-button (click)="onCancel()">Cancel</button>
            <button mat-flat-button color="warn" (click)="onConfirm()">
                Reopen Meeting
            </button>
        </mat-dialog-actions>
    `,
})
export class ReopenMeetingDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<ReopenMeetingDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { year: number }
    ) {}

    onCancel(): void {
        this.dialogRef.close(false);
    }

    onConfirm(): void {
        this.dialogRef.close(true);
    }
}
