import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

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
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { TranslocoModule } from '@ngneat/transloco';
import { SharedModule } from 'app/shared/shared.module';
import { EditableModule } from '@ngneat/edit-in-place';

import { ProposalComponent } from './proposal/proposal.component';
import { CreateProposalComponent } from './create-proposal/create-proposal.component';

import { proposalRoutes } from './proposal.routing';
import { ProposalInfoComponent } from './proposal-info/proposal-info.component';
import { VotingComponent } from './voting/voting.component';

@NgModule({
    declarations: [ProposalComponent, CreateProposalComponent, ProposalInfoComponent, VotingComponent],
    imports: [
        RouterModule.forChild(proposalRoutes),
        CommonModule,
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
        MatSliderModule,
        EditableModule,
    ],
})
export class ProposalModule { }
