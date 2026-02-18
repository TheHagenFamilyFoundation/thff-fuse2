import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MeetingService } from 'app/core/services/admin/meeting.service';
import { AuthService } from 'app/core/auth/auth.service';

@Component({
    selector: 'app-meeting-detail',
    templateUrl: './meeting-detail.component.html',
    styleUrls: ['./meeting-detail.component.scss']
})
export class MeetingDetailComponent implements OnInit {

    isPresidentOrAdmin = false;
    loaded = false;

    meeting: any = null;
    summary: any = null;

    // Setup form
    totalBudget: number = 0;
    meetingNotes: string = '';

    // Allocation tracking
    totalAllocated: number = 0;
    remainingBudget: number = 0;

    // Pending edits
    pendingAllocations: Map<string, number> = new Map();
    hasUnsavedChanges = false;

    displayedColumns = ['organization', 'projectTitle', 'amountRequested', 'score', 'amountGranted'];

    constructor(
        private route: ActivatedRoute,
        private meetingService: MeetingService,
        private authService: AuthService,
        private snackBar: MatSnackBar
    ) {}

    ngOnInit(): void {
        this.authService.checkPresident().subscribe(isP => {
            this.isPresidentOrAdmin = isP;
        });

        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.loadMeetingDetails(id);
        }
    }

    loadMeetingDetails(id: string): void {
        this.loaded = false;
        this.meetingService.getMeeting(id).subscribe({
            next: (meeting) => {
                this.meeting = meeting;
                this.totalBudget = meeting.totalBudget;
                this.meetingNotes = meeting.notes || '';
                this.recalcTotals();
                this.pendingAllocations.clear();
                this.hasUnsavedChanges = false;

                if (meeting.status === 'completed') {
                    this.loadSummary(id);
                }
                this.loaded = true;
            },
            error: () => {
                this.loaded = true;
            }
        });
    }

    loadSummary(id: string): void {
        this.meetingService.getMeetingSummary(id).subscribe({
            next: (summary) => {
                this.summary = summary;
            }
        });
    }

    startMeeting(): void {
        if (!this.meeting) return;

        const data: any = { status: 'in_progress' };
        if (this.totalBudget !== this.meeting.totalBudget) {
            data.totalBudget = this.totalBudget;
        }
        if (this.meetingNotes !== (this.meeting.notes || '')) {
            data.notes = this.meetingNotes;
        }

        this.meetingService.updateMeeting(this.meeting._id, data).subscribe({
            next: (meeting) => {
                this.meeting = meeting;
                this.recalcTotals();
                this.snackBar.open('Meeting started', 'Close', { duration: 3000 });
            },
            error: (err) => {
                const msg = err.error?.message || 'Error starting meeting';
                this.snackBar.open(msg, 'Close', { duration: 5000 });
            }
        });
    }

    updateBudget(): void {
        if (!this.meeting) return;

        this.meetingService.updateMeeting(this.meeting._id, {
            totalBudget: this.totalBudget,
            notes: this.meetingNotes
        }).subscribe({
            next: (meeting) => {
                this.meeting = meeting;
                this.recalcTotals();
                this.snackBar.open('Budget updated', 'Close', { duration: 3000 });
            },
            error: (err) => {
                const msg = err.error?.message || 'Error updating budget';
                this.snackBar.open(msg, 'Close', { duration: 5000 });
            }
        });
    }

    onAllocationChange(allocationId: string, value: number): void {
        this.pendingAllocations.set(allocationId, value);
        this.hasUnsavedChanges = true;

        let total = 0;
        for (const alloc of this.meeting.allocations) {
            const pending = this.pendingAllocations.get(alloc._id);
            total += (pending !== undefined) ? pending : (alloc.amountGranted || 0);
        }
        this.totalAllocated = total;
        this.remainingBudget = this.meeting.totalBudget - total;
    }

    getAllocationValue(alloc: any): number {
        const pending = this.pendingAllocations.get(alloc._id);
        return (pending !== undefined) ? pending : (alloc.amountGranted || 0);
    }

    saveAllocations(): void {
        if (!this.meeting || this.pendingAllocations.size === 0) return;

        const allocations = Array.from(this.pendingAllocations.entries()).map(([_id, amountGranted]) => ({
            _id,
            amountGranted
        }));

        this.meetingService.updateAllocations(this.meeting._id, allocations).subscribe({
            next: (meeting) => {
                this.meeting = meeting;
                this.recalcTotals();
                this.pendingAllocations.clear();
                this.hasUnsavedChanges = false;
                this.snackBar.open('Allocations saved', 'Close', { duration: 3000 });
            },
            error: (err) => {
                const msg = err.error?.message || 'Error saving allocations';
                this.snackBar.open(msg, 'Close', { duration: 5000 });
            }
        });
    }

    completeMeeting(): void {
        if (!this.meeting) return;

        if (this.hasUnsavedChanges) {
            this.saveAllocations();
        }

        this.meetingService.completeMeeting(this.meeting._id).subscribe({
            next: (meeting) => {
                this.meeting = meeting;
                this.loadSummary(meeting._id);
                this.snackBar.open('Meeting finalized! Allocations are now locked.', 'Close', { duration: 5000 });
            },
            error: (err) => {
                const msg = err.error?.message || 'Error completing meeting';
                this.snackBar.open(msg, 'Close', { duration: 5000 });
            }
        });
    }

    private recalcTotals(): void {
        if (!this.meeting?.allocations) return;
        this.totalAllocated = this.meeting.allocations.reduce((sum: number, a: any) => sum + (a.amountGranted || 0), 0);
        this.remainingBudget = this.meeting.totalBudget - this.totalAllocated;
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
