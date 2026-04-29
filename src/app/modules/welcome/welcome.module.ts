import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { SharedModule } from 'app/shared/shared.module';
import { WelcomeComponent } from 'app/modules/welcome/welcome.component';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';

const welcomeRoutes: Route[] = [
    {
        path: '',
        component: WelcomeComponent,
    },
];

@NgModule({
    declarations: [WelcomeComponent],
    imports: [
        RouterModule.forChild(welcomeRoutes),
        SharedModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatButtonModule,
    ],
})
export class WelcomeModule {}
