import { Route } from '@angular/router';

/**
 * Lazy-load each feature separately so visiting /pages/organizations
 * does not download director + proposal + settings chunks.
 */
export const pagesRoutes: Route[] = [
    {
        path: 'organizations',
        loadChildren: () =>
            import('./organizations/organizations.module').then(
                (m) => m.OrganizationsModule
            ),
    },
    {
        path: 'proposals',
        loadChildren: () =>
            import('./proposals/proposals.module').then((m) => m.ProposalsModule),
    },
    {
        path: 'organization',
        loadChildren: () =>
            import('./organization/organization.module').then(
                (m) => m.OrganizationModule
            ),
    },
    {
        path: 'director',
        loadChildren: () =>
            import('./director/director.module').then((m) => m.DirectorModule),
    },
    {
        path: 'proposal',
        loadChildren: () =>
            import('./proposal/proposal.module').then((m) => m.ProposalModule),
    },
    {
        path: 'profile',
        loadChildren: () =>
            import('./profile/profile.module').then((m) => m.ProfileModule),
    },
    {
        path: 'settings',
        loadChildren: () =>
            import('./settings/settings.module').then((m) => m.SettingsModule),
    },
];
