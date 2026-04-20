import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter, map } from 'rxjs/operators';
import { MeetingService } from 'app/core/services/admin/meeting.service';
import { ProposalService } from 'app/core/services/proposal/proposal.service';
import { AuthService } from 'app/core/auth/auth.service';
import { meetingStatusLabel } from '../meeting-status.labels';

@Component({
    standalone: false,
    selector: 'app-meeting-detail',
    templateUrl: './meeting-detail.component.html',
    styleUrls: ['./meeting-detail.component.scss']
})
export class MeetingDetailComponent implements OnInit {

    private readonly destroyRef = inject(DestroyRef);

    isPresidentOrAdmin = false;
    loaded = false;
    meetingId: string = null;

    meeting: any = null;
    summary: any = null;

    /** Stable array for mat-table (avoid calling a method from the template each CD cycle). */
    displayAllocations: any[] = [];

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
        private snackBar: MatSnackBar,
        private _changeDetectorRef: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.authService.checkPresident().subscribe((isP) => {
            this.isPresidentOrAdmin = isP;
            if (this.meeting) {
                this.loadAddableProposals();
            }
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
                this.loadMeetingDetails(id);
            });
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
                this._changeDetectorRef.markForCheck();
            },
            error: () => {
                this.meeting = null;
                this.displayAllocations = [];
                this.loaded = true;
                this._changeDetectorRef.markForCheck();
            }
        });
    }

    loadSummary(id: string): void {
        this.meetingService.getMeetingSummary(id).subscribe({
            next: (summary) => {
                this.summary = summary;
                if (this.summary) {
                    if (!Array.isArray(this.summary.funded)) {
                        this.summary.funded = [];
                    }
                    if (!Array.isArray(this.summary.unfunded)) {
                        this.summary.unfunded = [];
                    }
                }
                this._changeDetectorRef.markForCheck();
            },
            error: () => {
                this.summary = null;
                this._changeDetectorRef.markForCheck();
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
                this.addableProposals = Array.isArray(proposals) ? proposals : [];
                if (!this.addableProposals.some(p => p._id === this.selectedAddBackProposalId)) {
                    this.selectedAddBackProposalId = null;
                }
                this._changeDetectorRef.markForCheck();
            },
            error: () => {
                this.addableProposals = [];
                this._changeDetectorRef.markForCheck();
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
        const key = String(allocationId);
        this.pendingAllocations.set(key, value);
        this.hasUnsavedChanges = true;

        let total = 0;
        for (const alloc of this.meeting.allocations) {
            const id = String(alloc._id);
            const pending = this.pendingAllocations.get(id);
            total += (pending !== undefined) ? pending : (alloc.amountGranted || 0);
        }
        this.totalAllocated = total;
        this.remainingBudget = this.meeting.totalBudget - total;
        this.syncDisplayAllocations();
    }

    getAllocationValue(alloc: any): number {
        const id = String(alloc._id);
        const pending = this.pendingAllocations.get(id);
        return (pending !== undefined) ? pending : (alloc.amountGranted || 0);
    }

    private syncDisplayAllocations(): void {
        this.displayAllocations = this.buildDisplayAllocations();
    }

    private buildDisplayAllocations(): any[] {
        if (!this.meeting?.allocations) {
            return [];
        }

        if (this.meeting.status === 'completed' && this.editingCompletedMeeting) {
            return [...this.meeting.allocations].sort((a, b) => {
                const aGranted = this.getAllocationValue(a);
                const bGranted = this.getAllocationValue(b);
                const aFunded = aGranted > 0 ? 1 : 0;
                const bFunded = bGranted > 0 ? 1 : 0;
                if (aFunded !== bFunded) {
                    return bFunded - aFunded;
                }
                return bGranted - aGranted;
            });
        }

        return [...this.meeting.allocations];
    }

    saveAllocations(): void {
        if (!this.meeting || this.pendingAllocations.size === 0) return;

        const allocations = Array.from(this.pendingAllocations.entries()).map(([id, amountGranted]) => ({
            _id: id,
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

        const finalize = () => {
            this.meetingService.completeMeeting(this.meeting._id).subscribe({
                next: (meeting) => {
                    this.meeting = meeting;
                    this.recalcTotals();
                    this.loadSummary(meeting._id);
                    this.snackBar.open('Meeting completed. You can still edit budget and allocations here if needed.', 'Close', { duration: 5000 });
                    this._changeDetectorRef.markForCheck();
                },
                error: (err) => {
                    const msg = err.error?.message || 'Error completing meeting';
                    this.snackBar.open(msg, 'Close', { duration: 5000 });
                }
            });
        };

        if (this.hasUnsavedChanges && this.pendingAllocations.size > 0) {
            const allocations = Array.from(this.pendingAllocations.entries()).map(([id, amountGranted]) => ({
                _id: id,
                amountGranted
            }));
            this.meetingService.updateAllocations(this.meeting._id, allocations).subscribe({
                next: (meeting) => {
                    this.meeting = meeting;
                    this.recalcTotals();
                    this.pendingAllocations.clear();
                    this.hasUnsavedChanges = false;
                    finalize();
                },
                error: (err) => {
                    const msg = err.error?.message || 'Error saving allocations before completing';
                    this.snackBar.open(msg, 'Close', { duration: 5000 });
                }
            });
        } else {
            finalize();
        }
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
        this.syncDisplayAllocations();
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
        if (!this.meeting?.allocations?.length) {
            this.totalAllocated = 0;
            this.remainingBudget = (this.meeting?.totalBudget ?? 0) - 0;
            this.syncDisplayAllocations();
            return;
        }
        this.totalAllocated = this.meeting.allocations.reduce((sum: number, a: any) => sum + (a.amountGranted || 0), 0);
        this.remainingBudget = this.meeting.totalBudget - this.totalAllocated;
        this.syncDisplayAllocations();
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
