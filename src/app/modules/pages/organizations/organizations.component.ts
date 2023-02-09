import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
@Component({
    selector: 'app-organizations',
    templateUrl: './organizations.component.html',
    styleUrls: ['./organizations.component.scss'],
})
export class OrganizationsComponent implements OnInit {
    constructor(private router: Router) {}
    ngOnInit(): void {}
    createOrganization(): void {
        console.log('create organization');
        this.router.navigate(['/pages/organization/create']);
    }
}
