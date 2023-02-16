import { Route } from '@angular/router';
import { OrganizationsComponent } from 'app/modules/pages/organizations/organizations.component';
import { ProposalsComponent } from './proposals/proposals.component';

export const pagesRoutes: Route[] = [
    {
        path: 'organizations',
        component: OrganizationsComponent,
    },
    {
        path: 'proposals',
        component: ProposalsComponent,
    },
];
