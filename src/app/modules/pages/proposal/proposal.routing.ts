import { Route } from '@angular/router';
import { ProposalComponent } from './proposal.component';
import { ProposalResolver } from './proposal.resolvers';

import { CreateProposalComponent } from './create-proposal/create-proposal.component';

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
