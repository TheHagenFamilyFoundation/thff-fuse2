import { Route } from '@angular/router';
import { OrganizationComponent } from './organization.component';
import { OrganizationResolver } from './organization.resolvers';

export const organizationRoutes: Route[] = [
    {
        path     : '',
        component: OrganizationComponent,
        resolve  : {
            data: OrganizationResolver
        }
    }
];
