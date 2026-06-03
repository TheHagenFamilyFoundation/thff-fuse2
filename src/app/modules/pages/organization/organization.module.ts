import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatRippleModule } from '@angular/material/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { TranslocoModule } from '@ngneat/transloco';
import { NgApexchartsModule } from 'ng-apexcharts';
import { FuseCardModule } from '@fuse/components/card';
import { SharedModule } from 'app/shared/shared.module';
import { EditableModule } from '@ngneat/edit-in-place';
import { OrganizationComponent } from './organization.component';
import { organizationRoutes } from './organization.routing';
import { OrganizationInfoComponent } from './organization-info/organization-info.component';
import { EditableComponent } from 'app/common/components/editable/editable.component';
import { CreateOrganizationComponent } from './create-organization/create-organization.component';
import { OrgProposalsComponent } from './org-proposals/org-proposals.component';

//services
import { GetOrganizationService } from 'app/core/services/organization/get-organization.service';
import { CreateOrganizationService } from 'app/core/services/organization/create-organization.service';

import { PhoneMaskDirective } from 'app/core/directives/phone-mask.directive';
import { OrgDoc501c3Component } from './org-doc501c3/org-doc501c3.component';
import { OrgTeamComponent } from './org-team/org-team.component';
import { ConfirmDialogComponent } from 'app/common/components/confirm-dialog/confirm-dialog.component';
import { AutosaveStatusComponent } from 'app/common/components/autosave-status/autosave-status.component';
import { Upload501c3DialogComponent } from './org-doc501c3/upload-501c3-dialog/upload-501c3-dialog.component';

@NgModule({
    declarations: [
        PhoneMaskDirective,
        OrganizationComponent,
        OrganizationInfoComponent,
        EditableComponent,
        CreateOrganizationComponent,
        OrgDoc501c3Component,
        OrgProposalsComponent,
        OrgTeamComponent,
        Upload501c3DialogComponent,

    ],
    providers: [
        GetOrganizationService, CreateOrganizationService
    ],
    imports: [
        RouterModule.forChild(organizationRoutes),
        MatButtonModule,
        MatButtonToggleModule,
        MatDividerModule,
        MatIconModule,
        MatMenuModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        MatDialogModule,
        MatRippleModule,
        MatSidenavModule,
        MatSortModule,
        MatTableModule,
        MatPaginatorModule,
        MatTabsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSnackBarModule,
        MatSelectModule,
        NgApexchartsModule,
        TranslocoModule,
        FuseCardModule,
        SharedModule,
        EditableModule,
        ConfirmDialogComponent,
        AutosaveStatusComponent,
    ],
    exports: [
        PhoneMaskDirective
    ]
})
export class OrganizationModule {
}
