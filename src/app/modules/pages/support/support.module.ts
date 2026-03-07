import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { SharedModule } from 'app/shared/shared.module';
import { SupportComponent } from 'app/modules/pages/support/support.component';
import { supportRoutes } from 'app/modules/pages/support/support.routing';

@NgModule({
    declarations: [SupportComponent],
    imports: [
        RouterModule.forChild(supportRoutes),
        MatButtonModule,
        SharedModule,
    ],
})
export class SupportModule {}
