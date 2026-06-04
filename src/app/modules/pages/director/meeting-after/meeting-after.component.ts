import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { MeetingService } from 'app/core/services/admin/meeting.service';
import { AuthService } from 'app/core/auth/auth.service';

@Component({
    standalone: false,
    selector: 'app-meeting-after',
    templateUrl: './meeting-after.component.html',
    styleUrls: ['./meeting-after.component.scss']
})
export class MeetingAfterComponent implements OnInit {
    private readonly destroyRef = inject(DestroyRef);

    meetingId: string;
    meeting: any = null;
    loaded = false;
    isPresidentOrAdmin = false;

    constructor(
        private route: ActivatedRoute,
        private meetingService: MeetingService,
        private authService: AuthService,
        private _changeDetectorRef: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.authService.checkPresident().subscribe((isP) => {
            this.isPresidentOrAdmin = isP;
            this._changeDetectorRef.markForCheck();
        });

        this.route.paramMap
            .pipe(
                map((p) => p.get('id')),
                filter((id): id is string => !!id),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe((id) => {
                this.meetingId = id;
                this.loadMeeting();
            });
    }

    loadMeeting(): void {
        this.loaded = false;
        this.meetingService.getMeeting(this.meetingId).subscribe({
            next: (m) => {
                this.meeting = m;
                this.loaded = true;
                this._changeDetectorRef.markForCheck();
            },
            error: () => {
                this.meeting = null;
                this.loaded = true;
                this._changeDetectorRef.markForCheck();
            }
        });
    }
}
