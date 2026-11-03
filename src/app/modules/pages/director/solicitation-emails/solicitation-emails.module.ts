import { NgModule } from '@angular/core';
import { RouterModule, Route } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FuseCardModule } from '@fuse/components/card';
import { SharedModule } from 'app/shared/shared.module';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { SolicitationEmailsComponent } from './solicitation-emails.component';
import { SolicitationEmailPreviewDialogComponent } from './solicitation-email-preview-dialog.component';
import { SolicitationPreviewSendDialogComponent } from './solicitation-preview-send-dialog.component';

const routes: Route[] = [
    { path: '', component: SolicitationEmailsComponent },
];

@NgModule({
    declarations: [
        SolicitationEmailsComponent,
        SolicitationEmailPreviewDialogComponent,
        SolicitationPreviewSendDialogComponent,
    ],
    imports: [
        RouterModule.forChild(routes),
        CommonModule,
        FuseCardModule,
        SharedModule,
        MatButtonModule,
        MatDividerModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatMenuModule,
        MatTooltipModule,
        MatTableModule,
        MatPaginatorModule,
        MatDialogModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        MatSelectModule,
    ],
})
export class SolicitationEmailsModule {}
