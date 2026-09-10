import { Route } from '@angular/router';
import { ProposalResolver } from './proposal.resolvers';
import { CreateProposalComponent } from './create-proposal/create-proposal.component';
import { ProposalComponent } from './proposal/proposal.component';

export const proposalRoutes: Route[] = [
    {
        path: 'create',
        component: CreateProposalComponent,
    },
    {
        path: ':id',
        component: ProposalComponent,
        resolve: {
            data: ProposalResolver,
        },
    },
];
