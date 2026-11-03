import { Route } from '@angular/router';
import { DirectorComponent } from './director.component';
import { OrganizationsComponent } from './organizations/organizations.component';
import { ProposalsComponent } from './proposals/proposals.component';
import { VotingComponent } from './voting/voting.component';
import { SubmissionYearsComponent } from './submission-years/submission-years.component';
import { ReferralLinksComponent } from './referral-links/referral-links.component';
import { MeetingComponent } from './meeting/meeting.component';

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
        loadChildren: () =>
            import('./solicitation-emails/solicitation-emails.module').then(
                (m) => m.SolicitationEmailsModule
            ),
    },
    {
        path: 'meeting',
        component: MeetingComponent,
    },
    // More-specific meeting child routes before `meeting/:id`
    {
        path: 'meeting/:id/after',
        loadChildren: () =>
            import('./meeting-after/meeting-after.module').then((m) => m.MeetingAfterModule),
    },
    {
        path: 'meeting/:id',
        loadChildren: () =>
            import('./meeting-detail/meeting-detail.module').then((m) => m.MeetingDetailModule),
    },
];
