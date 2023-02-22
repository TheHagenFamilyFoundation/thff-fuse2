import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRippleModule } from '@angular/material/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@ngneat/transloco';
import { SharedModule } from 'app/shared/shared.module';
import { EditableModule } from '@ngneat/edit-in-place';

//Components
import { CreateProposalComponent } from './create-proposal/create-proposal.component';

//routes
import { proposalRoutes } from './proposal.routing';

import { ProposalService } from 'app/core/services/proposal/proposal.service';
// import { EditableComponent } from '@ngneat/edit-in-place';
@NgModule({
    declarations: [CreateProposalComponent],
    providers: [ProposalService],

    imports: [
        // CommonModule,
        RouterModule.forChild(proposalRoutes),
        TranslocoModule,
        SharedModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatDividerModule,
        MatIconModule,
        MatMenuModule,
        MatProgressBarModule,
        MatRippleModule,
        MatSidenavModule,
        MatSortModule,
        MatTableModule,
        MatTabsModule,
        MatFormFieldModule,
        MatInputModule,
        EditableModule,
    ],
})
export class ProposalModule {}
