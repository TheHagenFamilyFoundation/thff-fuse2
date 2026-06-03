import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { MeetingService } from 'app/core/services/admin/meeting.service';

@Component({
    standalone: false,
    selector: 'app-meeting-contacts',
    templateUrl: './meeting-contacts.component.html',
    styleUrls: ['./meeting-contacts.component.scss']
})
export class MeetingContactsComponent implements OnInit {
    private readonly destroyRef = inject(DestroyRef);

    loaded = false;
    meetingId: string = null;
    meeting: any = null;
    contacts: any[] = [];

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private meetingService: MeetingService,
        private _changeDetectorRef: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.route.paramMap
            .pipe(
                map((p) => p.get('id')),
                filter((id): id is string => !!id),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe((id) => {
                this.meetingId = id;
                this.loadContacts(id);
            });
    }

    private loadContacts(id: string): void {
        this.loaded = false;
        this.meetingService.getFundedContacts(id).subscribe({
            next: (data) => {
                this.meeting = data?.meeting || null;
                if (this.meeting?.status !== 'completed') {
                    this.router.navigate(['/pages/director/meeting', id]);
                    return;
                }
                const c = data?.contacts;
                this.contacts = Array.isArray(c) ? c : [];
                this.loaded = true;
                this._changeDetectorRef.markForCheck();
            },
            error: () => {
                this.meeting = null;
                this.contacts = [];
                this.loaded = true;
                this._changeDetectorRef.markForCheck();
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
