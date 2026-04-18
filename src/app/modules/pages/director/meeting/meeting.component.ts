import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { MeetingService } from 'app/core/services/admin/meeting.service';
import { SubmissionYearsService } from 'app/core/services/admin/submission-years.service';
import { AuthService } from 'app/core/auth/auth.service';

@Component({
    standalone: false,
    selector: 'app-meeting',
    templateUrl: './meeting.component.html',
    styleUrls: ['./meeting.component.scss']
})
export class MeetingComponent implements OnInit {

    isPresidentOrAdmin = false;
    loaded = false;

    /** Table rows — MatTableDataSource so the grid updates reliably after HTTP. */
    dataSource = new MatTableDataSource<any>([]);

    years: any[] = [];
    selectedYearId: string;
    currentYear: number = new Date().getFullYear();

    // Create form
    totalBudget: number = 0;
    meetingNotes: string = '';
    showCreateForm = false;

    // Archive filter: '' = active, 'only' = archived, 'true' = all
    archivedFilter: string = '';

    displayedColumns = ['year', 'created', 'startedBy', 'budget', 'allocated', 'status', 'action'];

    constructor(
        private meetingService: MeetingService,
        private submissionYearsService: SubmissionYearsService,
        private authService: AuthService,
        private snackBar: MatSnackBar,
        private router: Router,
        private _changeDetectorRef: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.authService.checkPresident().subscribe((isP) => {
            this.isPresidentOrAdmin = isP;
            this._changeDetectorRef.markForCheck();
        });
        // List load must not depend on submission-years (that call can fail or be empty).
        this.loadMeetings();
        this.loadSubmissionYearsForForm();
    }

    /**
     * Submission years are only needed for the "Create meeting" year dropdown.
     */
    private loadSubmissionYearsForForm(): void {
        this.submissionYearsService.getAllSubmissionYears(this.currentYear).subscribe({
            next: (years) => {
                this.years = Array.isArray(years) ? years : [];
                if (this.years.length > 0) {
                    this.selectedYearId = this.years[0]._id;
                }
                this._changeDetectorRef.markForCheck();
            },
            error: () => {
                this.years = [];
                this._changeDetectorRef.markForCheck();
            }
        });
    }

    loadMeetings(): void {
        this.loaded = false;
        this.meetingService.getMeetings(undefined, undefined, this.archivedFilter || undefined).subscribe({
            next: (meetings) => {
                const rows = Array.isArray(meetings) ? meetings : [];
                this.dataSource.data = rows;
                this.loaded = true;
                this._changeDetectorRef.markForCheck();
            },
            error: () => {
                this.dataSource.data = [];
                this.loaded = true;
                this._changeDetectorRef.markForCheck();
            }
        });
    }

    archivedFilterChanged(value: string): void {
        this.archivedFilter = value;
        this.loadMeetings();
    }

    archiveMeeting(event: Event, id: string, archived: boolean): void {
        event.stopPropagation();
        this.meetingService.archiveMeeting(id, archived).subscribe({
            next: () => {
                this.snackBar.open(archived ? 'Meeting archived' : 'Meeting restored', 'Close', { duration: 3000 });
                this.loadMeetings();
            },
            error: (err) => {
                const msg = err.error?.message || 'Error archiving meeting';
                this.snackBar.open(msg, 'Close', { duration: 5000 });
            }
        });
    }

    createMeeting(): void {
        if (!this.selectedYearId) return;

        const year = this.years.find(y => y._id === this.selectedYearId);
        if (!year) return;

        const data = {
            submissionYear: this.selectedYearId,
            year: year.year,
            totalBudget: this.totalBudget || 0,
            notes: this.meetingNotes
        };

        this.meetingService.createMeeting(data).subscribe({
            next: (meeting) => {
                this.snackBar.open('Meeting created', 'Close', { duration: 3000 });
                this.showCreateForm = false;
                this.totalBudget = 0;
                this.meetingNotes = '';
                this.router.navigate(['/pages/director/meeting', meeting._id]);
            },
            error: (err) => {
                const msg = err.error?.message || 'Error creating meeting';
                this.snackBar.open(msg, 'Close', { duration: 5000 });
            }
        });
    }

    goToMeeting(id: string): void {
        this.router.navigate(['/pages/director/meeting', id]);
    }

    getUserName(user: any): string {
        if (!user) return '';
        if (user.firstName || user.lastName) {
            return [user.firstName, user.lastName].filter(Boolean).join(' ');
        }
        return user.email || '';
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

    getStatusIcon(status: string): string {
        switch (status) {
            case 'setup': return 'schedule';
            case 'in_progress': return 'pending';
            case 'completed': return 'check_circle';
            default: return 'help_outline';
        }
    }

    getStatusIconColor(status: string): string {
        switch (status) {
            case 'setup': return 'text-yellow-500';
            case 'in_progress': return 'text-blue-500';
            case 'completed': return 'text-green-500';
            default: return 'text-gray-400';
        }
    }
}
