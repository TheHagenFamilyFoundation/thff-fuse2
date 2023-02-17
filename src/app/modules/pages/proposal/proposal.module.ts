import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@ngneat/transloco';
import { SharedModule } from 'app/shared/shared.module';

//Components
import { CreateProposalComponent } from './create-proposal/create-proposal.component';

import { proposalRoutes } from './proposal.routing';

@NgModule({
    declarations: [CreateProposalComponent],
    imports: [
        CommonModule,
        RouterModule.forChild(proposalRoutes),
        TranslocoModule,
        SharedModule,
    ],
})
export class ProposalModule {}
