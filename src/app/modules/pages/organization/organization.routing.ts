import { Route } from '@angular/router';
import { OrganizationComponent } from './organization.component';
import { OrganizationResolver } from './organization.resolvers';
import { CreateOrganizationComponent } from './create-organization/create-organization.component';

export const organizationRoutes: Route[] = [
    {
        path: 'create',
        component: CreateOrganizationComponent,
    },
    {
        path: ':id',
        component: OrganizationComponent,
        resolve: {
            data: OrganizationResolver,
        },
    },
];
