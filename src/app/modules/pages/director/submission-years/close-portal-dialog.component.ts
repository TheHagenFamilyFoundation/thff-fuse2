import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'close-portal-dialog',
    template: `
        <h2 mat-dialog-title class="text-lg font-semibold">Close {{ data.year }} Portal</h2>
        <mat-dialog-content>
            <p class="text-gray-600 dark:text-gray-300">
                Are you sure you want to close the <strong>{{ data.year }}</strong> submission portal?
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Organizations will no longer be able to submit new proposals for this year.
                You can reopen the portal at any time.
            </p>
        </mat-dialog-content>
        <mat-dialog-actions align="end" class="mt-4">
            <button mat-stroked-button (click)="onCancel()">Cancel</button>
            <button mat-flat-button color="warn" (click)="onConfirm()">Close Portal</button>
        </mat-dialog-actions>
    `,
})
export class ClosePortalDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<ClosePortalDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { year: number }
    ) {}

    onCancel(): void {
        this.dialogRef.close(false);
    }

    onConfirm(): void {
        this.dialogRef.close(true);
    }
}
