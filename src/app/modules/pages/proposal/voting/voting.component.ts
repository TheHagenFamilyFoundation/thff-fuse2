import { Component, OnInit, Input, SimpleChange } from '@angular/core';

import { coerceNumberProperty } from '@angular/cdk/coercion';


import { DirectorService } from 'app/core/services/director/director.service';

@Component({
    selector: 'app-voting',
    templateUrl: './voting.component.html',
    styleUrls: ['./voting.component.scss']
})
export class VotingComponent implements OnInit {

    @Input()
    isDirector: any;
    @Input()
    prop: any;

    propID: string;

    user: any;
    userID: string;

    outputVote: string = 'No Vote';
    defaultVote: -1;

    autoTicks = false;

    disabled = false;

    invert = false;

    max = 2;

    min = -1;

    showTicks = true;

    step = 1;

    thumbLabel = false;

    vote = -1;

    vertical = false;

    private _tickInterval = 1;

    constructor(public _directorService: DirectorService) { }

    get tickInterval(): number | 'auto' {
        return this.showTicks ? (this.autoTicks ? 'auto' : this._tickInterval) : 0;
    }

    set tickInterval(value) {
        this._tickInterval = coerceNumberProperty(value);
    }

    ngOnInit(): void {

        this.user = JSON.parse(localStorage.getItem('currentUser'));
        console.log('voting - user', this.user);
        this.userID = this.user.id;
        console.log('this.userID', this.userID);
        console.log('this.prop.votes.length', this.prop.votes.length);

        if (this.prop.votes.length > 0) {
            this.checkDirVote(this.prop.votes);
        } else {
            // set the default
            this.vote = this.defaultVote;
        }

        this.outVote(this.vote);

    }

    onInputChange(event: any): void {
        console.log('This is emitted as the thumb slides', event);

        this.vote = event.value;

        this.outVote(this.vote);

        const data = {
            prop: this.prop.id,
            userID: this.userID,
            vote: this.vote,
        };

        console.log('director proposal voting - data', data);

        this._directorService.vote(data).subscribe(
            (vote) => {
                console.log('vote', vote);
            },
            (err) => {
                console.log('err', err);
            },
            // () => {},
        );
    }

    checkDirVote(votes): void {
        this.vote = this.defaultVote;

        votes.forEach((vote) => {
            if (vote.userID === this.userID) {
                this.vote = vote.vote;
            }

            this.outVote(this.vote);
        });
    }

    outVote(v): void {

        switch (v) {
            case -1:
                this.outputVote = 'No Vote';
                break;
            case 0:
                this.outputVote = 'No';
                break;
            case 1:
                this.outputVote = 'Maybe';
                break;
            case 2:
                this.outputVote = 'Yes';
                break;
            default:
                console.log('error - invalid vote');
        }
    }

}
