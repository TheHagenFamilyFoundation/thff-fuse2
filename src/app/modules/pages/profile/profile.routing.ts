import { Route } from '@angular/router';
import { ProfileComponent } from 'app/modules/pages/profile/profile.component';

export const profileRoutes: Route[] = [
    {
        path: 'profile',
        component: ProfileComponent,
    },
];
