import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FuseCardModule } from '@fuse/components/card';
import { ReferralComponent } from './referral.component';
import { referralRoutes } from './referral.routing';

@NgModule({
    declarations: [ReferralComponent],
    imports: [
        CommonModule,
        RouterModule.forChild(referralRoutes),
        MatIconModule,
        MatProgressSpinnerModule,
        FuseCardModule,
    ],
})
export class ReferralModule {}
