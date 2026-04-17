import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MeetingService } from 'app/core/services/admin/meeting.service';
import { ProposalService } from 'app/core/services/proposal/proposal.service';
import { AuthService } from 'app/core/auth/auth.service';

@Component({
    standalone: false,
    selector: 'app-meeting-detail',
    templateUrl: './meeting-detail.component.html',
    styleUrls: ['./meeting-detail.component.scss']
})
export class MeetingDetailComponent implements OnInit {

    isPresidentOrAdmin = false;
    loaded = false;
    meetingId: string = null;

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
    editingCompletedMeeting = false;
    addableProposals: any[] = [];
    selectedAddBackProposalId: string = null;

    // Summary collapse state
    fundedCollapsed = false;
    unfundedCollapsed = true;

    displayedColumns = ['projectTitle', 'organization', 'sponsor', 'amountRequested', 'score', 'amountGranted'];
    setupColumns = ['projectTitle', 'organization', 'sponsor', 'amountRequested', 'score', 'actions'];

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private meetingService: MeetingService,
        private proposalService: ProposalService,
        private authService: AuthService,
        private snackBar: MatSnackBar
    ) {}

    ngOnInit(): void {
        this.authService.checkPresident().subscribe(isP => {
            this.isPresidentOrAdmin = isP;
        });

        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.meetingId = id;
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
                this.editingCompletedMeeting = false;
                this.loadAddableProposals();

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

    loadAddableProposals(): void {
        if (!this.meeting?._id || !this.isPresidentOrAdmin) {
            this.addableProposals = [];
            this.selectedAddBackProposalId = null;
            return;
        }

        this.meetingService.getAddableProposals(this.meeting._id).subscribe({
            next: (proposals) => {
                this.addableProposals = proposals || [];
                if (!this.addableProposals.some(p => p._id === this.selectedAddBackProposalId)) {
                    this.selectedAddBackProposalId = null;
                }
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
                if (this.meeting.status === 'completed') {
                    this.loadSummary(this.meeting._id);
                }
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

    getTableAllocations(): any[] {
        if (!this.meeting?.allocations) {
            return [];
        }

        // During completed edit mode, prioritize funded proposals at the top.
        if (this.meeting.status === 'completed' && this.editingCompletedMeeting) {
            return [...this.meeting.allocations].sort((a, b) => {
                const aFunded = (a.amountGranted || 0) > 0 ? 1 : 0;
                const bFunded = (b.amountGranted || 0) > 0 ? 1 : 0;
                if (aFunded !== bFunded) {
                    return bFunded - aFunded;
                }
                return (b.amountGranted || 0) - (a.amountGranted || 0);
            });
        }

        return this.meeting.allocations;
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
                if (this.meeting.status === 'completed') {
                    this.editingCompletedMeeting = false;
                    this.loadSummary(this.meeting._id);
                }
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
                this.snackBar.open('Meeting finalized. You can still edit budget and allocations here if needed.', 'Close', { duration: 5000 });
            },
            error: (err) => {
                const msg = err.error?.message || 'Error completing meeting';
                this.snackBar.open(msg, 'Close', { duration: 5000 });
            }
        });
    }

    addBackProposal(): void {
        if (!this.meeting?._id || !this.selectedAddBackProposalId) return;

        this.meetingService.addAllocation(this.meeting._id, this.selectedAddBackProposalId).subscribe({
            next: (meeting) => {
                this.meeting = meeting;
                this.recalcTotals();
                this.pendingAllocations.clear();
                this.hasUnsavedChanges = false;
                this.selectedAddBackProposalId = null;
                this.loadAddableProposals();
                if (this.meeting.status === 'completed') {
                    this.loadSummary(this.meeting._id);
                }
                this.snackBar.open('Proposal added back to meeting', 'Close', { duration: 3000 });
            },
            error: (err) => {
                const msg = err.error?.message || 'Error adding proposal back';
                this.snackBar.open(msg, 'Close', { duration: 5000 });
            }
        });
    }

    startCompletedEdit(): void {
        this.editingCompletedMeeting = true;
    }

    cancelCompletedEdit(): void {
        this.editingCompletedMeeting = false;
        this.pendingAllocations.clear();
        this.hasUnsavedChanges = false;
        this.totalBudget = this.meeting?.totalBudget || 0;
        this.meetingNotes = this.meeting?.notes || '';
        this.recalcTotals();
    }

    private recalcTotals(): void {
        if (!this.meeting?.allocations) return;
        this.totalAllocated = this.meeting.allocations.reduce((sum: number, a: any) => sum + (a.amountGranted || 0), 0);
        this.remainingBudget = this.meeting.totalBudget - this.totalAllocated;
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

    goToProposal(proposalID: string): void {
        this.router.navigate(['/pages/proposal/', proposalID], {
            queryParams: { from: 'meeting', meetingId: this.meeting._id }
        });
    }

    goToOrganization(orgID: string): void {
        this.router.navigate(['/pages/organization/', orgID]);
    }

    archiveProposalFromMeeting(allocation: any): void {
        if (!this.meeting || !allocation) return;

        const proposalTitle = allocation.proposal?.projectTitle || 'this proposal';
        if (!confirm(`Archive "${proposalTitle}"? This will remove it from the meeting.`)) {
            return;
        }

        this.proposalService.archiveProposal(allocation.proposal?._id, true).subscribe({
            next: () => {
                this.meetingService.removeAllocation(this.meeting._id, allocation._id).subscribe({
                    next: (updated) => {
                        this.meeting = updated;
                        this.recalcTotals();
                        this.snackBar.open(`"${proposalTitle}" archived and removed from meeting`, 'Close', { duration: 3000 });
                    },
                    error: (err) => {
                        const msg = err.error?.message || 'Error removing allocation';
                        this.snackBar.open(msg, 'Close', { duration: 5000 });
                    }
                });
            },
            error: (err) => {
                const msg = err.error?.message || 'Error archiving proposal';
                this.snackBar.open(msg, 'Close', { duration: 5000 });
            }
        });
    }

    getActiveColumns(): string[] {
        if (this.meeting?.status === 'setup') {
            return this.isPresidentOrAdmin ? this.setupColumns : this.setupColumns.filter(c => c !== 'actions');
        }
        return this.displayedColumns;
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
