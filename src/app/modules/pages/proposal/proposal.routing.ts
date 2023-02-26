import { Route } from '@angular/router';

import { ProposalResolver } from './proposal.resolvers';

import { CreateProposalComponent } from './create-proposal/create-proposal.component';

import { ProposalComponent } from './proposal/proposal.component';

export const proposalRoutes: Route[] = [
    {
        path: 'proposal/create',
        component: CreateProposalComponent,
    },
    {
        path: 'proposal/:id',
        component: ProposalComponent,
        resolve: {
            data: ProposalResolver,
        },
    },
];
