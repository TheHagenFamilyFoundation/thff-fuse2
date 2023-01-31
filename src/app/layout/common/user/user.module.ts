import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { UserComponent } from 'app/layout/common/user/user.component';
import { SharedModule } from 'app/shared/shared.module';
import { RouterModule } from '@angular/router';

@NgModule({
    declarations: [UserComponent],
    imports: [
        RouterModule,
        MatButtonModule,
        MatDividerModule,
        MatIconModule,
        MatMenuModule,
        SharedModule,
    ],
    exports: [UserComponent],
})
export class UserModule {}
