import { Route } from '@angular/router';
import { OrganizationComponent } from './organization.component';
import { OrganizationResolver } from './organization.resolvers';

import { CreateOrganizationComponent } from './create-organization/create-organization.component';

export const organizationRoutes: Route[] = [
    {
        path: 'organization/create',
        component: CreateOrganizationComponent,
    },
    {
        path     : 'organization/:id',
        component: OrganizationComponent,
        resolve  : {
            data: OrganizationResolver
        }
    }
];
