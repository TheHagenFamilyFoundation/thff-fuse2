import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { MeetingService } from 'app/core/services/admin/meeting.service';
import { SubmissionYearsService } from 'app/core/services/admin/submission-years.service';
import { AuthService } from 'app/core/auth/auth.service';
import { UserPreferencesService } from 'app/core/services/user/user-preferences.service';
import { meetingStatusLabel } from '../meeting-status.labels';
import { CreateMeetingDialogComponent } from './create-meeting-dialog.component';

@Component({
    standalone: false,
    selector: 'app-meeting',
    templateUrl: './meeting.component.html',
    styleUrls: ['./meeting.component.scss']
})
export class MeetingComponent implements OnInit, AfterViewInit {

    @ViewChild(MatPaginator) meetingPaginator: MatPaginator;

    isPresidentOrAdmin = false;
    loaded = false;

    dataSource = new MatTableDataSource<any>([]);
    /** Row open in the action menu (single shared mat-menu). */
    menuRow: any = null;

    years: any[] = [];
    currentYear: number = new Date().getFullYear();

    // Archive filter: '' = active, 'only' = archived, 'true' = all
    archivedFilter: string = '';

    /** List filter: '' = all calendar years; otherwise numeric string e.g. '2025'. */
    listYearFilter: string = '';

    displayedColumns = ['year', 'created', 'startedBy', 'budget', 'allocated', 'status', 'action'];

    readonly tablePageSizeOptions = [10, 25, 50];
    tablePageSize: number;

    constructor(
        private meetingService: MeetingService,
        private submissionYearsService: SubmissionYearsService,
        private authService: AuthService,
        private snackBar: MatSnackBar,
        private router: Router,
        private dialog: MatDialog,
        private _changeDetectorRef: ChangeDetectorRef,
        private _userPreferences: UserPreferencesService,
    ) {
        this.tablePageSize = this._userPreferences.pageSizeForOptions(this.tablePageSizeOptions);
    }

    ngOnInit(): void {
        this.authService.checkPresident().subscribe((isP) => {
            this.isPresidentOrAdmin = isP;
            this._changeDetectorRef.markForCheck();
        });
        this.loadMeetings();
        this.loadSubmissionYearsForForm();
    }

    ngAfterViewInit(): void {
        this.connectPaginator();
    }

    get meetingCount(): number {
        return this.dataSource.data?.length ?? 0;
    }

    /**
     * Submission years are only needed for the "Create meeting" year dropdown.
     */
    private loadSubmissionYearsForForm(): void {
        this.submissionYearsService.getAllSubmissionYears(this.currentYear).subscribe({
            next: (years) => {
                const arr = Array.isArray(years) ? years : [];
                this.years = arr.slice().sort((a, b) => (b?.year ?? 0) - (a?.year ?? 0));
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
        const parsed =
            this.listYearFilter === '' ? NaN : Number(this.listYearFilter);
        const yearNum = Number.isFinite(parsed) ? parsed : undefined;
        this.meetingService.getMeetings(yearNum, undefined, this.archivedFilter || undefined).subscribe({
            next: (meetings) => {
                const rows = Array.isArray(meetings) ? meetings : [];
                this.dataSource.data = this.sortMeetings(rows);
                this.loaded = true;
                this._changeDetectorRef.markForCheck();
                setTimeout(() => this.connectPaginator());
            },
            error: () => {
                this.dataSource.data = [];
                this.loaded = true;
                this._changeDetectorRef.markForCheck();
            }
        });
    }

    private connectPaginator(): void {
        if (this.meetingPaginator) {
            this.dataSource.paginator = this.meetingPaginator;
            this.meetingPaginator.pageSize = this.tablePageSize;
            this.meetingPaginator.firstPage();
        }
    }

    onMeetingPage(event: { pageSize: number }): void {
        if (event.pageSize !== this.tablePageSize) {
            this._userPreferences.setTablePageSize(event.pageSize);
            this.tablePageSize = event.pageSize;
        }
    }

    private sortMeetings(rows: any[]): any[] {
        return [...rows].sort((a, b) => {
            const yearDiff = (b.year ?? 0) - (a.year ?? 0);
            if (yearDiff !== 0) {
                return yearDiff;
            }
            return (
                new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
            );
        });
    }

    archivedFilterChanged(value: string): void {
        this.archivedFilter = value;
        this.loadMeetings();
    }

    yearFilterChanged(value: string | number | null | undefined): void {
        this.listYearFilter = value === null || value === undefined ? '' : String(value);
        this.loadMeetings();
    }

    openRowMenu(event: Event, row: any): void {
        event.stopPropagation();
        this.menuRow = row;
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

    openCreateMeetingDialog(): void {
        this.dialog
            .open(CreateMeetingDialogComponent, {
                width: '720px',
                maxWidth: '95vw',
                data: { years: this.years }
            })
            .afterClosed()
            .subscribe((meeting) => {
                if (meeting?._id) {
                    this.snackBar.open('Meeting created', 'Close', { duration: 3000 });
                    this.loadMeetings();
                    this.router.navigate(['/pages/director/meeting', meeting._id]);
                }
            });
    }

    goToMeeting(id: string): void {
        this.router.navigate(['/pages/director/meeting', id]);
    }

    trackMeeting(_index: number, row: any): string {
        return String(row?._id ?? _index);
    }

    getUserName(user: any): string {
        if (!user) return '';
        if (user.firstName || user.lastName) {
            return [user.firstName, user.lastName].filter(Boolean).join(' ');
        }
        return user.email || '';
    }

    getStatusLabel(status: string): string {
        return meetingStatusLabel(status);
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
