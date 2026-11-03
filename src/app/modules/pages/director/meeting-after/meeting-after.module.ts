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
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { ConfirmDialogComponent } from 'app/common/components/confirm-dialog/confirm-dialog.component';
import { MeetingAfterComponent } from './meeting-after.component';
import { GrantProposalEmailListComponent } from './grant-proposal-email-list.component';
import { SentGrantEmailViewDialogComponent } from './sent-grant-email-view-dialog.component';

const routes: Route[] = [
    { path: '', component: MeetingAfterComponent },
];

@NgModule({
    declarations: [
        MeetingAfterComponent,
        GrantProposalEmailListComponent,
        SentGrantEmailViewDialogComponent,
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
        MatDialogModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        MatExpansionModule,
        ConfirmDialogComponent,
    ],
})
export class MeetingAfterModule {}
