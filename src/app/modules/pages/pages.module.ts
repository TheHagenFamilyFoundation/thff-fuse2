import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FuseCardModule } from '@fuse/components/card';
import { SharedModule } from 'app/shared/shared.module';
import { TranslocoModule } from '@ngneat/transloco';
//modules
import { OrganizationModule } from './organization/organization.module';
import { ProfileModule } from './profile/profile.module';
import { SettingsModule } from './settings/settings.module';
import { DirectorModule } from './director/director.module';
import { ProposalModule } from './proposal/proposal.module';

//components
import { OrganizationsComponent } from './organizations/organizations.component';

import { pagesRoutes } from './page.routing';
import { ProposalsComponent } from './proposals/proposals.component';

@NgModule({
    imports: [
        RouterModule.forChild(pagesRoutes),
        OrganizationModule,

        ProfileModule,

        SettingsModule,
        DirectorModule,

        ProposalModule,

        MatButtonModule,
        MatDividerModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatMenuModule,
        MatTooltipModule,
        MatTableModule,
        MatPaginatorModule,
        MatProgressSpinnerModule,

        FuseCardModule,
        SharedModule,
        TranslocoModule,
    ],
    declarations: [OrganizationsComponent, ProposalsComponent],
})
export class PagesModule { }
