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

import { TranslocoModule } from '@ngneat/transloco';

import { NgApexchartsModule } from 'ng-apexcharts';

import { SharedModule } from 'app/shared/shared.module';

import { EditableModule } from '@ngneat/edit-in-place';

import { OrganizationComponent } from './organization.component';
import { organizationRoutes } from './organization.routing';

import { OrganizationInfoComponent } from './organization-info/organization-info.component';

import { EditableComponent } from 'app/common/components/editable/editable.component';

import { CreateOrganizationComponent } from './create-organization/create-organization.component';

//services
import { GetOrganizationService } from 'app/core/services/organization/get-organization.service';
import { CreateOrganizationService } from 'app/core/services/organization/create-organization.service';

import { PhoneMaskDirective } from 'app/core/directives/phone-mask.directive';
import { OrgDoc501c3Component } from './org-doc501c3/org-doc501c3.component';

@NgModule({
    declarations: [
        PhoneMaskDirective,
        OrganizationComponent,
        OrganizationInfoComponent,
        EditableComponent,
        CreateOrganizationComponent,
        OrgDoc501c3Component,

    ],
    providers: [GetOrganizationService, CreateOrganizationService],
    imports     : [
        RouterModule.forChild(organizationRoutes),
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
        NgApexchartsModule,
        TranslocoModule,
        SharedModule,
        EditableModule
    ],
    exports: [
        PhoneMaskDirective
    ]
})
export class OrganizationModule
{
}
