import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Upload501c3Service } from 'app/core/services/organization/501c3/upload-501c3.service';

export interface Upload501c3DialogData {
    orgID: string;
}

@Component({
    standalone: false,
    selector: 'app-upload-501c3-dialog',
    templateUrl: './upload-501c3-dialog.component.html',
})
export class Upload501c3DialogComponent {
    file: File = null;
    fileName: string = '';
    uploading: boolean = false;

    constructor(
        public dialogRef: MatDialogRef<Upload501c3DialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: Upload501c3DialogData,
        private upload501c3Service: Upload501c3Service,
        private snackBar: MatSnackBar
    ) {}

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.file = input.files[0];
            this.fileName = this.file.name;
        }
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }

    onUpload(): void {
        if (!this.file) { return; }

        this.uploading = true;
        this.upload501c3Service.upload501c3(this.file, this.data.orgID).subscribe({
            next: (res) => {
                this.snackBar.open('501(c)(3) uploaded successfully', 'OK', { duration: 3000 });
                this.uploading = false;
                this.dialogRef.close(res || true);
            },
            error: () => {
                this.snackBar.open('Failed to upload document. Please try again.', 'OK', { duration: 5000 });
                this.uploading = false;
            }
        });
    }
}
