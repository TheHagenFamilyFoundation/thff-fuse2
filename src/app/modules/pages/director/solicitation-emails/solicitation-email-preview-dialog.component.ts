import { Component, Inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface SolicitationEmailPreviewData {
    subject: string;
    to: string;
    html: string | null;
    missingPreview?: boolean;
}

@Component({
    standalone: false,
    selector: 'app-solicitation-email-preview-dialog',
    templateUrl: './solicitation-email-preview-dialog.component.html',
    styleUrls: ['./solicitation-email-preview-dialog.component.scss']
})
export class SolicitationEmailPreviewDialogComponent {

    trustedHtml: SafeHtml | null = null;

    constructor(
        public dialogRef: MatDialogRef<SolicitationEmailPreviewDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: SolicitationEmailPreviewData,
        private sanitizer: DomSanitizer
    ) {
        if (data.html) {
            this.trustedHtml = this.sanitizer.bypassSecurityTrustHtml(data.html);
        }
    }

}
