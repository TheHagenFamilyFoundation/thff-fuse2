import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MeetingService } from 'app/core/services/admin/meeting.service';

@Component({
    standalone: false,
    selector: 'app-meeting-contacts',
    templateUrl: './meeting-contacts.component.html',
    styleUrls: ['./meeting-contacts.component.scss']
})
export class MeetingContactsComponent implements OnInit {
    loaded = false;
    meetingId: string = null;
    meeting: any = null;
    contacts: any[] = [];

    constructor(
        private route: ActivatedRoute,
        private meetingService: MeetingService
    ) {}

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (!id) {
            this.loaded = true;
            return;
        }
        this.meetingId = id;

        this.meetingService.getFundedContacts(id).subscribe({
            next: (data) => {
                this.meeting = data?.meeting || null;
                this.contacts = data?.contacts || [];
                this.loaded = true;
            },
            error: () => {
                this.loaded = true;
            }
        });
    }

    printPdf(): void {
        window.print();
    }

    formatAddress(c: any): string {
        const parts = [c?.address, [c?.city, c?.state].filter(Boolean).join(', '), c?.zip].filter(Boolean);
        return parts.join(' ');
    }
}
