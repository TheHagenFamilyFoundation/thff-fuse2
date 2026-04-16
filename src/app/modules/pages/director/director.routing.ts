import { Route } from '@angular/router';
import { DirectorComponent } from './director.component';
import { OrganizationsComponent } from './organizations/organizations.component';
import { ProposalsComponent } from './proposals/proposals.component';
import { VotingComponent } from './voting/voting.component';
import { SubmissionYearsComponent } from './submission-years/submission-years.component';
import { ReferralLinksComponent } from './referral-links/referral-links.component';
import { SolicitationEmailsComponent } from './solicitation-emails/solicitation-emails.component';
import { MeetingComponent } from './meeting/meeting.component';
import { MeetingDetailComponent } from './meeting-detail/meeting-detail.component';
import { MeetingContactsComponent } from './meeting-contacts/meeting-contacts.component';
import { MeetingAfterComponent } from './meeting-after/meeting-after.component';

export const directorRoutes: Route[] = [
    {
        path: 'director',
        component: DirectorComponent,
    },
    {
        path: 'director/organizations',
        component: OrganizationsComponent,
    },
    {
        path: 'director/proposals',
        component: ProposalsComponent,
    },
    {
        path: 'director/voting',
        component: VotingComponent,
    },
    {
        path: 'director/submission-years',
        component: SubmissionYearsComponent,
    },
    {
        path: 'director/referral-links',
        component: ReferralLinksComponent,
    },
    {
        path: 'director/solicitation-emails',
        component: SolicitationEmailsComponent,
    },
    {
        path: 'director/meeting',
        component: MeetingComponent,
    },
    {
        path: 'director/meeting/:id',
        component: MeetingDetailComponent,
    },
    {
        path: 'director/meeting/:id/contacts',
        component: MeetingContactsComponent,
    },
    {
        path: 'director/meeting/:id/after',
        component: MeetingAfterComponent,
    },
];
