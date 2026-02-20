import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MeetingService } from 'app/core/services/admin/meeting.service';

@Component({
    selector: 'app-director',
    templateUrl: './director.component.html',
    styleUrls: ['./director.component.scss']
})
export class DirectorComponent implements OnInit {

    activeMeeting: any = null;

    constructor(
        private _router: Router,
        private _meetingService: MeetingService
    ) {}

    ngOnInit(): void {
        this._meetingService.getMeetings().subscribe({
            next: (meetings) => {
                this.activeMeeting = meetings.find((m: any) => m.status !== 'completed') || null;
            }
        });
    }

    goToOrganizations(): void {
        this._router.navigate(['/pages/director/organizations']);
    }

    goToProposals(): void {
        this._router.navigate(['/pages/director/proposals']);
    }

    goToVoting(): void {
        this._router.navigate(['/pages/director/voting']);
    }

    goToSubmissionYears(): void {
        this._router.navigate(['/pages/director/submission-years']);
    }

    goToReferralLinks(): void {
        this._router.navigate(['/pages/director/referral-links']);
    }

    goToMeeting(): void {
        this._router.navigate(['/pages/director/meeting']);
    }

    goToActiveMeeting(): void {
        if (this.activeMeeting) {
            this._router.navigate(['/pages/director/meeting', this.activeMeeting._id]);
        }
    }

    getStatusLabel(status: string): string {
        switch (status) {
            case 'setup': return 'Not Started';
            case 'in_progress': return 'In Progress';
            case 'completed': return 'Finalized';
            default: return status;
        }
    }

    getStatusColor(status: string): string {
        switch (status) {
            case 'setup': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:bg-opacity-40 dark:text-yellow-300';
            case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:bg-opacity-40 dark:text-blue-300';
            case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:bg-opacity-40 dark:text-green-300';
            default: return '';
        }
    }
}
