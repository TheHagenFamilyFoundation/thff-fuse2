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
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { FuseCardModule } from '@fuse/components/card';
import { FuseAlertModule } from '@fuse/components/alert';
import { SharedModule } from 'app/shared/shared.module';
import { ProfileComponent } from 'app/modules/pages/profile/profile.component';
import { profileRoutes } from 'app/modules/pages/profile/profile.routing';

import { UserOrganizationComponent } from './user-organization/user-organization.component';
import { SelectedOrganizationComponent } from './user-organization/selected-organization/selected-organization.component';
import { AutosaveStatusComponent } from 'app/common/components/autosave-status/autosave-status.component';

@NgModule({
    declarations: [ProfileComponent, UserOrganizationComponent, SelectedOrganizationComponent],
    imports: [
        RouterModule.forChild(profileRoutes),
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
        MatSnackBarModule,
        MatSelectModule,
        FuseCardModule,
        FuseAlertModule,
        SharedModule,
        AutosaveStatusComponent,
    ],
})
export class ProfileModule { }
