import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@ngneat/transloco';
import { SharedModule } from 'app/shared/shared.module';
import { EditableModule } from '@ngneat/edit-in-place';

//Components
import { CreateProposalComponent } from './create-proposal/create-proposal.component';

//routes
import { proposalRoutes } from './proposal.routing';

@NgModule({
    declarations: [CreateProposalComponent],
    imports: [
        CommonModule,
        RouterModule.forChild(proposalRoutes),
        TranslocoModule,
        SharedModule,
        // EditableModule,
    ],
})
export class ProposalModule {}
