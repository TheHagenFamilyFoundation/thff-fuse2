import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MeetingService } from 'app/core/services/admin/meeting.service';
import { OutboundEmailService } from 'app/core/services/director/outbound-email.service';
import { AuthService } from 'app/core/auth/auth.service';

@Component({
    standalone: false,
    selector: 'app-meeting-after',
    templateUrl: './meeting-after.component.html',
    styleUrls: ['./meeting-after.component.scss']
})
export class MeetingAfterComponent implements OnInit {

    meetingId: string;
    meeting: any = null;
    loaded = false;
    emailsLoaded = false;
    emails: any[] = [];
    sending = false;
    isPresidentOrAdmin = false;

    constructor(
        private route: ActivatedRoute,
        private meetingService: MeetingService,
        private outboundEmailService: OutboundEmailService,
        private authService: AuthService,
        private snackBar: MatSnackBar
    ) {}

    ngOnInit(): void {
        this.authService.checkPresident().subscribe((isP) => {
            this.isPresidentOrAdmin = isP;
        });

        this.meetingId = this.route.snapshot.paramMap.get('id');
        if (this.meetingId) {
            this.loadMeeting();
        }
    }

    loadMeeting(): void {
        this.loaded = false;
        this.meetingService.getMeeting(this.meetingId).subscribe({
            next: (m) => {
                this.meeting = m;
                this.loaded = true;
                this.loadEmails();
            },
            error: () => {
                this.loaded = true;
            }
        });
    }

    loadEmails(): void {
        this.emailsLoaded = false;
        this.outboundEmailService.getMeetingGrantEmails(this.meetingId).subscribe({
            next: (rows) => {
                this.emails = rows || [];
                this.emailsLoaded = true;
            },
            error: () => {
                this.emailsLoaded = true;
            }
        });
    }

    sendGrantEmails(): void {
        if (!this.isPresidentOrAdmin || this.meeting?.status !== 'completed') {
            return;
        }
        this.sending = true;
        this.outboundEmailService.sendGrantNotifications(this.meetingId).subscribe({
            next: (res) => {
                this.sending = false;
                const n = res?.counts?.sent ?? 0;
                const sk = res?.counts?.skipped ?? 0;
                this.snackBar.open(
                    `Sent ${n} grant notification(s). ${sk} skipped (no email or error).`,
                    'OK',
                    { duration: 6000 }
                );
                this.loadEmails();
            },
            error: (err) => {
                this.sending = false;
                const msg = err?.error?.message || 'Failed to send';
                this.snackBar.open(msg, 'OK', { duration: 5000 });
            }
        });
    }

    senderLabel(e: any): string {
        const u = e?.sentBy;
        if (!u) return '—';
        const name = `${u.firstName || ''} ${u.lastName || ''}`.trim();
        return name || u.email || '—';
    }
}
