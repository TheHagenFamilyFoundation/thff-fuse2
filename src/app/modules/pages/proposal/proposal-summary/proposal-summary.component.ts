import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core';

import { ProposalService } from 'app/core/services/proposal/proposal.service';

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

    constructor(private _proposalService: ProposalService) { }

    ngOnInit(): void {
        if (this.prop.sponsor) {
            this.hasSponsor = true;
        }

        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));

    }

    sponsor(): void {
        this.sponsorQuestion = true;
    }

    removeSponsor(): void {
        this.sponsorQuestion = true;
    }

    confirmRemoveSponsor(): void {
        this.sponsorQuestion = false;

        this._proposalService.sponsorProposal(this.prop._id, '', false)
            .subscribe((proposal) => {
                this.refreshProp.emit(true);

                this.hasSponsor = false;

            },
                () => {});

    }

    confirmSponsor(): void {
        this.sponsorQuestion = false;

        this._proposalService.sponsorProposal(this.prop._id, this.currentUser._id, true)
            .subscribe((proposal) => {
                this.refreshProp.emit(true);

                this.hasSponsor = true;
            },
                () => {});

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
