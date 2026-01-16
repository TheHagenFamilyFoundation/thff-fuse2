import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core';

import { AuthService } from 'app/core/auth/auth.service';
import { ProposalService } from 'app/core/services/proposal/proposal.service';
import { environment } from 'environments/environment';

@Component({
    selector: 'app-proposal-summary',
    templateUrl: './proposal-summary.component.html',
    styleUrls: ['./proposal-summary.component.scss']
})
export class ProposalSummaryComponent implements OnInit {
    @Output() refreshProp = new EventEmitter<boolean>();
    @Input()
    prop: any;
    @Input()
    isDirector: any;
    currentUser: any;
    hasSponsor: boolean = false;

    sponsorQuestion: boolean = false;

    constructor(private _proposalService: ProposalService, private _authService: AuthService) { }

    ngOnInit(): void {
        if (this.prop.sponsor) {
            this.hasSponsor = true;
        }

        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));

    }

    getBackendURL(): void {
        console.log('proposal - environment', environment);
        // Use environment API URL directly
    }

    sponsor(): void {
        this.sponsorQuestion = true;
    }

    removeSponsor(): void {
        this.sponsorQuestion = true;
    }

    confirmRemoveSponsor(): void {
        this.sponsorQuestion = false;

        console.log('confirming remove sponsor');

        //blank string for user
        this._proposalService.sponsorProposal(this.prop._id, '', false)
            .subscribe((proposal) => {
                console.log('after removing sponsor proposal', proposal);

                //send to backend
                this.refreshProp.emit(true);

                this.hasSponsor = false;

            },
                (err) => {
                    console.log('sponsorProposal - err', err);
                });

    }

    confirmSponsor(): void {
        this.sponsorQuestion = false;

        this._proposalService.sponsorProposal(this.prop._id, this.currentUser._id, true)
            .subscribe((proposal) => {
                console.log('after sponsoring proposal', proposal);

                //send to backend
                this.refreshProp.emit(true);

                this.hasSponsor = true;
            },
                (err) => {
                    console.log('sponsorProposal - err', err);
                });

    }

    cancel(): void {
        this.sponsorQuestion = false;
    }

    //use for voting
    refreshProposal(): void {
        this.refreshProp.emit(true);
    }

    checkHasSponsor(): void {
        this.hasSponsor = this.prop.sponsor !== null ? this.hasSponsor = true : this.hasSponsor = true;
    }

}
