import { Route } from '@angular/router';
import { DirectorComponent } from './director.component';
import { OrganizationsComponent } from './organizations/organizations.component';
import { ProposalsComponent } from './proposals/proposals.component';
import { VotingComponent } from './voting/voting.component';
import { SubmissionYearsComponent } from './submission-years/submission-years.component';

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
];
