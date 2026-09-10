import { NgModule } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FuseLoadingBarModule } from '@fuse/components/loading-bar';
import { UserModule } from 'app/layout/common/user/user.module';
import { SharedModule } from 'app/shared/shared.module';
import { ModernLayoutComponent } from 'app/layout/layouts/horizontal/modern/modern.component';

import { GetUserService } from '../../../../core/services/user/get-user.service';
import { InOrgService } from '../../../../core/services/user/in-org.service';

@NgModule({
    declarations: [ModernLayoutComponent],
    exports: [ModernLayoutComponent],
    imports: [
        RouterModule,
        MatButtonModule,
        MatIconModule,
        FuseLoadingBarModule,
        UserModule,
        SharedModule,
    ],
    providers: [GetUserService, InOrgService, provideHttpClient(withInterceptorsFromDi())],
})
export class ModernLayoutModule {}
