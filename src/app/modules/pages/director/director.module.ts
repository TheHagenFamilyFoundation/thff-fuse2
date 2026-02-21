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
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

//components
import { DirectorComponent } from './director.component';

import { directorRoutes } from './director.routing';
import { OrganizationsComponent } from './organizations/organizations.component';
import { ProposalsComponent } from './proposals/proposals.component';
import { VotingComponent } from './voting/voting.component';
import { SubmissionYearsComponent } from './submission-years/submission-years.component';
import { ClosePortalDialogComponent } from './submission-years/close-portal-dialog.component';
import { ReferralLinksComponent } from './referral-links/referral-links.component';
import { MeetingComponent } from './meeting/meeting.component';
import { MeetingDetailComponent } from './meeting-detail/meeting-detail.component';
import { ReopenMeetingDialogComponent } from './meeting-detail/reopen-meeting-dialog.component';

@NgModule({
    declarations: [DirectorComponent, OrganizationsComponent, ProposalsComponent, VotingComponent, SubmissionYearsComponent, ClosePortalDialogComponent, ReferralLinksComponent, MeetingComponent, MeetingDetailComponent, ReopenMeetingDialogComponent],
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
        MatButtonToggleModule,
        MatCheckboxModule,
        MatDialogModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
    ],
})
export class DirectorModule { }
