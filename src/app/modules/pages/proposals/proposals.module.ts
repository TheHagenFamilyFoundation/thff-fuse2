import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FuseCardModule } from '@fuse/components/card';
import { SharedModule } from 'app/shared/shared.module';
import { ConfirmDialogComponent } from 'app/common/components/confirm-dialog/confirm-dialog.component';
import { ProposalsComponent } from './proposals.component';

const routes: Routes = [
    {
        path: '',
        component: ProposalsComponent,
    },
];

@NgModule({
    declarations: [ProposalsComponent],
    imports: [
        RouterModule.forChild(routes),
        MatButtonModule,
        MatIconModule,
        MatTableModule,
        MatPaginatorModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatSnackBarModule,
        MatDialogModule,
        MatTooltipModule,
        MatFormFieldModule,
        FuseCardModule,
        SharedModule,
        ConfirmDialogComponent,
    ],
})
export class ProposalsModule {}
