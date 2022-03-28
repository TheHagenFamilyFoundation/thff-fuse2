import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { FuseCardModule } from '@fuse/components/card';
import { SharedModule } from 'app/shared/shared.module';
import { AuthConfirmationComponent } from 'app/modules/auth/confirmation/confirmation.component';
import { authConfirmationRoutes } from 'app/modules/auth/confirmation/confirmation.routing';

@NgModule({
    declarations: [AuthConfirmationComponent],
    imports: [
        RouterModule.forChild(authConfirmationRoutes),
        MatButtonModule,
        FuseCardModule,
        SharedModule,
    ],
})
export class AuthConfirmationModule {}
