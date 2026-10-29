import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
    standalone: false,
    selector       : 'settings-team',
    templateUrl    : './team.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsTeamComponent implements OnInit
{
    members: any[];
    roles: any[];

    /**
     * Constructor
     */
    constructor()
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Setup the team members
        this.members = [
            {
                avatar: null,
                name  : 'Dejesus Michael',
                email : 'dejesusmichael@mail.org',
                role  : 'admin'
            },
            {
                avatar: null,
                name  : 'Mclaughlin Steele',
                email : 'mclaughlinsteele@mail.me',
                role  : 'admin'
            },
            {
                avatar: null,
                name  : 'Laverne Dodson',
                email : 'lavernedodson@mail.ca',
                role  : 'write'
            },
            {
                avatar: null,
                name  : 'Trudy Berg',
                email : 'trudyberg@mail.us',
                role  : 'read'
            },
            {
                avatar: null,
                name  : 'Lamb Underwood',
                email : 'lambunderwood@mail.me',
                role  : 'read'
            },
            {
                avatar: null,
                name  : 'Mcleod Wagner',
                email : 'mcleodwagner@mail.biz',
                role  : 'read'
            },
            {
                avatar: null,
                name  : 'Shannon Kennedy',
                email : 'shannonkennedy@mail.ca',
                role  : 'read'
            }
        ];

        // Setup the roles
        this.roles = [
            {
                label      : 'Read',
                value      : 'read',
                description: 'Can read and clone this repository. Can also open and comment on issues and pull requests.'
            },
            {
                label      : 'Write',
                value      : 'write',
                description: 'Can read, clone, and push to this repository. Can also manage issues and pull requests.'
            },
            {
                label      : 'Admin',
                value      : 'admin',
                description: 'Can read, clone, and push to this repository. Can also manage issues, pull requests, and repository settings, including adding collaborators.'
            }
        ];
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any
    {
        return item.id || index;
    }
}
