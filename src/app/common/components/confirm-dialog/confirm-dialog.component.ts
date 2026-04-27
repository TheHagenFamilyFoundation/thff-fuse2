import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface ConfirmDialogData {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    warn?: boolean;
    /** Single-button info/success dialog (no cancel). */
    alertOnly?: boolean;
    /** Use success (green) styling for the message body. */
    messageVariant?: 'default' | 'success';
}

@Component({
    standalone: true,
    selector: 'app-confirm-dialog',
    imports: [CommonModule, MatDialogModule, MatButtonModule],
    templateUrl: './confirm-dialog.component.html',
})
export class ConfirmDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<ConfirmDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
    ) {
        if (!data.confirmText) { data.confirmText = 'Confirm'; }
        if (!data.cancelText) { data.cancelText = 'Cancel'; }
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }

    onConfirm(): void {
        this.dialogRef.close(true);
    }
}
