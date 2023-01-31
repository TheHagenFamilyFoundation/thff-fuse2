/* eslint-disable arrow-parens */
import { Route } from '@angular/router';
import { AuthGuard } from 'app/core/auth/guards/auth.guard';
import { NoAuthGuard } from 'app/core/auth/guards/noAuth.guard';
import { LayoutComponent } from 'app/layout/layout.component';
import { InitialDataResolver } from 'app/app.resolvers';

// @formatter:off
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
export const appRoutes: Route[] = [
    // Redirect empty path to '/example'
    { path: '', pathMatch: 'full', redirectTo: 'welcome' },

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
                    ).then(m => m.AuthConfirmationRequiredModule),
            },
            {
                path: 'confirmation',
                loadChildren: () =>
                    import(
                        'app/modules/auth/confirmation/confirmation.module'
                    ).then(m => m.AuthConfirmationModule),
            },
            {
                path: 'forgot-password',
                loadChildren: () =>
                    import(
                        'app/modules/auth/forgot-password/forgot-password.module'
                    ).then(m => m.AuthForgotPasswordModule),
            },
            {
                path: 'reset-password',
                loadChildren: () =>
                    import(
                        'app/modules/auth/reset-password/reset-password.module'
                    ).then(m => m.AuthResetPasswordModule),
            },
            {
                path: 'sign-in',
                loadChildren: () =>
                    import('app/modules/auth/sign-in/sign-in.module').then(
                        m => m.AuthSignInModule
                    ),
            },
            {
                path: 'sign-up',
                loadChildren: () =>
                    import('app/modules/auth/sign-up/sign-up.module').then(
                        m => m.AuthSignUpModule
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
                        m => m.AuthSignOutModule
                    ),
            },
            {
                path: 'unlock-session',
                loadChildren: () =>
                    import(
                        'app/modules/auth/unlock-session/unlock-session.module'
                    ).then(m => m.AuthUnlockSessionModule),
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
                        m => m.LandingHomeModule
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
                    import('app/modules/admin/example/example.module').then(
                        m => m.ExampleModule
                    ),
            },
            {
                path: 'welcome',
                loadChildren: () =>
                    import('app/modules/admin/welcome/welcome.module').then(
                        m => m.WelcomeModule
                    ),
            },
            // Pages
            {
                path: 'pages',
                children: [
                    // Profile
                    {
                        path: 'profile',
                        loadChildren: () =>
                            import(
                                'app/modules/admin/pages/profile/profile.module'
                            ).then(m => m.ProfileModule),
                    },
                    // // Organization
                    // {
                    //     path: 'organization/:id',
                    //     loadChildren: () =>
                    //         import(
                    //             'app/modules/admin/pages/organization/organization.module'
                    //         ).then((m) => m.OrganizationModule),
                    // },
                    // Project
                    {
                        path: 'organization/:id',
                        loadChildren: () =>
                            import(
                                'app/modules/admin/pages/organization/organization.module'
                            ).then(m => m.OrganizationModule),
                    },
                    // Settings
                    {
                        path: 'settings',
                        loadChildren: () =>
                            import(
                                'app/modules/admin/pages/settings/settings.module'
                            ).then(m => m.SettingsModule),
                    },
                ],
            },
        ],
    },
    {
        path: '**',
        redirectTo: 'sign-in',
    },
];

export const appHomeRoutes: Route[] = [
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
                        m => m.LandingHomeModule
                    ),
            },
        ],
    },
    {
        path: '**',
        redirectTo: 'home',
    },
];
