import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

//Components
import { CreateProposalComponent } from './create-proposal/create-proposal.component';

import { proposalRoutes } from './proposal.routing';

@NgModule({
    declarations: [CreateProposalComponent],
    imports: [CommonModule, RouterModule.forChild(proposalRoutes)],
})
export class ProposalModule {}
