/* eslint-disable arrow-parens */
import { NgModule, InjectionToken } from '@angular/core';
import { RouterModule, Routes, ActivatedRouteSnapshot } from '@angular/router';

import { LayoutComponent } from 'app/layout/layout.component';
import { InitialDataResolver } from 'app/app.resolvers';

// guards
import { AuthGuard } from 'app/core/auth/guards/auth.guard';
import { NoAuthGuard } from 'app/core/auth/guards/noAuth.guard';

// Utility
import { NotFoundComponent } from './core/utilities/not-found/not-found.component';

const externalUrlProvider = new InjectionToken('externalUrlRedirectResolver');

// @formatter:off
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
export const appRoutes: Routes = [
    // Redirect empty path to '/example'
    { path: '', pathMatch: 'full', redirectTo: 'home' },

    // Redirect signed in user to the '/example'
    //
    // After the user signs in, the sign in page will redirect the user to the 'signed-in-redirect'
    // path. Below is another redirection for that path to redirect the user to the desired
    // location. This is a small convenience to keep all main routes together here on this file.
    { path: 'signed-in-redirect', pathMatch: 'full', redirectTo: 'welcome' },

    // Auth routes for guests
    {
        path: '',
        canActivate: [NoAuthGuard],
        canActivateChild: [NoAuthGuard],
        component: LayoutComponent,
        data: {
            layout: 'empty',
        },
        children: [
            {
                path: 'confirmation-required',
                loadChildren: () =>
                    import(
                        'app/modules/auth/confirmation-required/confirmation-required.module'
                    ).then((m) => m.AuthConfirmationRequiredModule),
            },
            {
                path: 'confirmation',
                loadChildren: () =>
                    import(
                        'app/modules/auth/confirmation/confirmation.module'
                    ).then((m) => m.AuthConfirmationModule),
            },
            {
                path: 'forgot-password',
                loadChildren: () =>
                    import(
                        'app/modules/auth/forgot-password/forgot-password.module'
                    ).then((m) => m.AuthForgotPasswordModule),
            },
            {
                path: 'reset-password',
                loadChildren: () =>
                    import(
                        'app/modules/auth/reset-password/reset-password.module'
                    ).then((m) => m.AuthResetPasswordModule),
            },
            {
                path: 'sign-in',
                loadChildren: () =>
                    import('app/modules/auth/sign-in/sign-in.module').then(
                        (m) => m.AuthSignInModule
                    ),
            },
            {
                path: 'sign-up',
                loadChildren: () =>
                    import('app/modules/auth/sign-up/sign-up.module').then(
                        (m) => m.AuthSignUpModule
                    ),
            },
        ],
    },

    // Auth routes for authenticated users
    {
        path: '',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component: LayoutComponent,
        data: {
            layout: 'empty',
        },
        children: [
            {
                path: 'sign-out',
                loadChildren: () =>
                    import('app/modules/auth/sign-out/sign-out.module').then(
                        (m) => m.AuthSignOutModule
                    ),
            },
            {
                path: 'unlock-session',
                loadChildren: () =>
                    import(
                        'app/modules/auth/unlock-session/unlock-session.module'
                    ).then((m) => m.AuthUnlockSessionModule),
            },
        ],
    },

    // Landing routes
    {
        path: '',
        component: LayoutComponent,
        data: {
            layout: 'empty',
        },
        children: [
            //TODO update path
            {
                path: 'home',
                loadChildren: () =>
                    import('app/modules/landing/home/home.module').then(
                        (m) => m.LandingHomeModule
                    ),
            },
        ],
    },
    // Authenticated routes
    {
        path: '',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component: LayoutComponent,
        resolve: {
            initialData: InitialDataResolver,
        },
        children: [
            {
                path: 'example',
                loadChildren: () =>
                    import('app/modules/example/example.module').then(
                        (m) => m.ExampleModule
                    ),
            },
            {
                path: 'welcome',
                loadChildren: () =>
                    import('app/modules/welcome/welcome.module').then(
                        (m) => m.WelcomeModule
                    ),
            },
            // Pages
            {
                path: 'pages',
                loadChildren: () =>
                    import('./modules/pages/pages.module').then(
                        (m) => m.PagesModule
                    ),
                // loadChildren: () => import(''./main/pages/pages.module').then((m) => m.PagesModule),
            },
        ],
    },
    {
        path: 'externalRedirect',
        resolve: {
            url: externalUrlProvider,
        },
        // We need a component here because we cannot define the route otherwise
        component: NotFoundComponent,
    },
    {
        path: '**',
        redirectTo: 'home',
    },
];

//maintenance
export const appHomeRoutes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'home' },
    // Landing routes
    {
        path: '',
        component: LayoutComponent,
        data: {
            layout: 'empty',
        },
        children: [
            //TODO update path
            {
                path: 'home',
                loadChildren: () =>
                    import('app/modules/landing/home/home.module').then(
                        (m) => m.LandingHomeModule
                    ),
            },
        ],
    },
    {
        path: '**',
        redirectTo: 'home',
    },
];

@NgModule({
    imports: [RouterModule.forRoot(appRoutes)],
    exports: [RouterModule],
    providers: [
        {
            provide: externalUrlProvider,
            useValue: (route: ActivatedRouteSnapshot) => {
                const externalUrl = route.paramMap.get('externalUrl');
                // window.open(externalUrl, '_self');//self for same window
                //bank for new tab
                window.open(externalUrl, '_blank');
            },
        },
    ],
})
export class AppRoutingModule {}
