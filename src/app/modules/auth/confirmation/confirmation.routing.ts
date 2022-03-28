import { Route } from '@angular/router';
import { AuthConfirmationComponent } from 'app/modules/auth/confirmation/confirmation.component';

export const authConfirmationRoutes: Route[] = [
    {
        path: '',
        component: AuthConfirmationComponent,
    },
];
