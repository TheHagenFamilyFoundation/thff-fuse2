import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FuseCardModule } from '@fuse/components/card';
import { SharedModule } from 'app/shared/shared.module';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatStepperModule } from '@angular/material/stepper';

//components
import { DirectorComponent } from './director.component';

import { directorRoutes } from './director.routing';
import { OrganizationsComponent } from './organizations/organizations.component';
import { ProposalsComponent } from './proposals/proposals.component';
import { VotingComponent } from './voting/voting.component';
import { SubmissionYearsComponent } from './submission-years/submission-years.component';
import { ClosePortalDialogComponent } from './submission-years/close-portal-dialog.component';
import { ReferralLinksComponent } from './referral-links/referral-links.component';
import { SolicitationEmailsComponent } from './solicitation-emails/solicitation-emails.component';
import { SolicitationEmailPreviewDialogComponent } from './solicitation-emails/solicitation-email-preview-dialog.component';
import { SolicitationPreviewSendDialogComponent } from './solicitation-emails/solicitation-preview-send-dialog.component';
import { MeetingComponent } from './meeting/meeting.component';
import { CreateMeetingDialogComponent } from './meeting/create-meeting-dialog.component';
import { MeetingDetailComponent } from './meeting-detail/meeting-detail.component';
import { MeetingContactsComponent } from './meeting-contacts/meeting-contacts.component';
import { MeetingAfterComponent } from './meeting-after/meeting-after.component';
import { GrantProposalEmailListComponent } from './meeting-after/grant-proposal-email-list.component';
import { SentGrantEmailViewDialogComponent } from './meeting-after/sent-grant-email-view-dialog.component';
import { AutosaveStatusComponent } from 'app/common/components/autosave-status/autosave-status.component';
import { ConfirmDialogComponent } from 'app/common/components/confirm-dialog/confirm-dialog.component';
@NgModule({
    declarations: [DirectorComponent, OrganizationsComponent, ProposalsComponent, VotingComponent, SubmissionYearsComponent, ClosePortalDialogComponent, ReferralLinksComponent, SolicitationEmailsComponent, SolicitationEmailPreviewDialogComponent, SolicitationPreviewSendDialogComponent, MeetingComponent, CreateMeetingDialogComponent, MeetingDetailComponent, MeetingContactsComponent, MeetingAfterComponent, GrantProposalEmailListComponent, SentGrantEmailViewDialogComponent],
    imports: [
        RouterModule.forChild(directorRoutes),
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
        MatTabsModule,
        MatPaginatorModule,
        MatSortModule,
        MatSelectModule,
        MatCheckboxModule,
        MatDialogModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        MatProgressBarModule,
        MatExpansionModule,
        MatStepperModule,
        AutosaveStatusComponent,
        ConfirmDialogComponent,
    ],
})
export class DirectorModule { }
