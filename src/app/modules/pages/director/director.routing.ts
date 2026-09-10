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
        path: '',
        component: DirectorComponent,
    },
    {
        path: 'organizations',
        component: OrganizationsComponent,
    },
    {
        path: 'proposals',
        component: ProposalsComponent,
    },
    {
        path: 'voting',
        component: VotingComponent,
    },
    {
        path: 'submission-years',
        component: SubmissionYearsComponent,
    },
    {
        path: 'referral-links',
        component: ReferralLinksComponent,
    },
    {
        path: 'solicitation-emails',
        component: SolicitationEmailsComponent,
    },
    {
        path: 'meeting',
        component: MeetingComponent,
    },
    {
        path: 'meeting/:id',
        component: MeetingDetailComponent,
    },
    {
        path: 'meeting/:id/contacts',
        component: MeetingContactsComponent,
    },
    {
        path: 'meeting/:id/after',
        component: MeetingAfterComponent,
    },
];
