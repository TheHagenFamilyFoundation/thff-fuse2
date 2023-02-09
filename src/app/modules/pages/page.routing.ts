import { Route } from '@angular/router';
import { OrganizationsComponent } from 'app/modules/pages/organizations/organizations.component';

export const pagesRoutes: Route[] = [
    {
        path: 'organizations',
        component: OrganizationsComponent,
    },
];
