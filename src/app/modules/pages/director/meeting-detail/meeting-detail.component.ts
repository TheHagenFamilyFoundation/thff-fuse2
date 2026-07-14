import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    DestroyRef,
    ElementRef,
    HostListener,
    OnInit,
    ViewChild,
    inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Sort } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';
import { Subject, EMPTY, forkJoin, of, interval } from 'rxjs';
import { catchError, debounceTime, filter, finalize, map, switchMap, take, tap } from 'rxjs/operators';
import { MeetingService } from 'app/core/services/admin/meeting.service';
import { MeetingRealtimeService } from 'app/core/services/admin/meeting-realtime.service';
import { OutboundEmailService } from 'app/core/services/director/outbound-email.service';
import { AuthService } from 'app/core/auth/auth.service';
import { UserPreferencesService } from 'app/core/services/user/user-preferences.service';
import { meetingStatusLabel } from '../meeting-status.labels';
import { ConfirmDialogComponent } from 'app/common/components/confirm-dialog/confirm-dialog.component';

@Component({
    standalone: false,
    selector: 'app-meeting-detail',
    templateUrl: './meeting-detail.component.html',
    styleUrls: ['./meeting-detail.component.scss']
})
export class MeetingDetailComponent implements OnInit, AfterViewInit {

    private readonly destroyRef = inject(DestroyRef);

    /** Full filtered/sorted list for the setup proposals step. */
    setupTableRows: any[] = [];
    setupTablePageIndex = 0;
    readonly setupTablePageSizeOptions = [10, 25, 50, 100];
    setupTablePageSize: number;

    /** In progress / completed-edit main proposals table (client-side pages). */
    activeTableRows: any[] = [];
    activeTablePageIndex = 0;
    readonly activeTablePageSizeOptions = [10, 25, 50, 100];
    activeTablePageSize: number;

    isPresidentOrAdmin = false;
    loaded = false;
    /** True while the proposals table is loading or syncing (initial load or refresh). */
    proposalsTableLoading = false;
    meetingId: string = null;

    meeting: any = null;
    summary: any = null;

    /** Active deliberation list (mat-table / setup stepper). */
    displayAllocations: any[] = [];

    /** Set aside for this meeting — still attached, not counted toward budget usage. */
    displayAllocationsSetAside: any[] = [];

    setAsideCollapsed = true;

    /** Setup stepper index (0 = budget, 1 = proposals, 2 = review). Restored from sessionStorage on refresh. */
    setupStepIndex = 0;
    private setupStepRestorePending = false;

    /** Single proposals step in the setup stepper (`label` is always "Proposals"). */
    setupProposalBatches: { label: string; rows: any[] }[] = [];

    /** Filter + sort for the setup proposals step. */
    setupSearchQuery = '';
    setupSortActive = 'createdOn';
    setupSortDirection: 'asc' | 'desc' = 'asc';
    setupFilteredTotal = 0;
    private readonly setupSearchSubject = new Subject<string>();

    // Setup form
    totalBudget: number = 0;
    meetingNotes: string = '';

    /** Debounced auto-save for budget + notes during `setup` (president/admin only). */
    setupBudgetNotesSaving = false;
    /** Brief success state after a save completes (cleared when user edits again or after a timeout). */
    setupBudgetNotesSavedFlash = false;
    private readonly setupBudgetNotesSaveSubject = new Subject<void>();
    private setupBudgetNotesSavedTimer: ReturnType<typeof setTimeout> | null = null;

    // Allocation tracking
    totalAllocated: number = 0;
    remainingBudget: number = 0;

    // Pending allocation amount edits (debounced auto-save)
    pendingAllocations: Map<string, number> = new Map();
    /** Raw input text while editing grant amounts (avoids re-render glitches). */
    private allocationAmountDrafts = new Map<string, string>();
    private focusedAllocationInputId: string | null = null;
    private focusedAllocationInputSelection: { start: number; end: number } | null = null;
    /** True while there are edits not yet sent to the server. */
    hasUnsavedChanges = false;
    allocationsSaving = false;
    allocationsSavedFlash = false;
    private readonly allocationSaveSubject = new Subject<void>();
    private allocationsSavedTimer: ReturnType<typeof setTimeout> | null = null;
    editingCompletedMeeting = false;
    /** President/admin must opt in before changing total budget during an in-progress meeting. */
    editingInProgressBudget = false;

    /** Columns for setup: proposal details plus an optional pre-meeting proposed amount. */
    setupViewColumns = ['projectTitle', 'organization', 'sponsor', 'createdOn', 'amountRequested', 'amountGranted'];
    /** Stable column list for setup mat-table (avoid getter in *matHeaderRowDef). */
    setupTableColumns: string[] = [...this.setupViewColumns];

    /** Pre-meeting "amount each" default, applied to every proposal when the meeting starts. */
    bulkAllocateAmount: number | null = null;

    private syncAllocationsInFlight = false;

    /** Prevents double-clicks while set-aside / restore requests are in flight. */
    private readonly allocationActiveToggleInFlight = new Set<string>();

    /**
     * Allocation changes this client just made (set aside / restored), mapped to the
     * intended active state and an expiry timestamp. Serves two purposes:
     *  1. Suppress the "watcher" toast for the actor's own changes.
     *  2. Reconcile against a stale live-update payload that can arrive just after the
     *     action completes and would otherwise flood set-aside proposals back into the table.
     */
    private readonly recentSelfAllocationChanges = new Map<string, { active: boolean; expiry: number }>();
    private static readonly SELF_CHANGE_SUPPRESS_MS = 8000;

    /** Multiselect for bulk set aside (main consideration list). */
    readonly selectedActiveAllocationIds = new Set<string>();

    /** Multiselect for bulk restore (set aside list). */
    readonly selectedSetAsideAllocationIds = new Set<string>();

    /**
     * Set-aside decisions made during the setup phase are kept as a local draft (never saved
     * to the server) and applied all at once when the meeting starts. Persisted to
     * sessionStorage so a refresh keeps the planning work.
     */
    private readonly setupSetAsideDraftIds = new Set<string>();

    /** True while a bulk set-aside / restore batch is running. */
    bulkAllocationActionInFlight = false;

    /** How often to poll the server for live updates while a meeting is setup / in progress. */
    private static readonly LIVE_POLL_INTERVAL_MS = 10000;

    /** Timestamp of the last successful live refresh (drives the "Live" indicator). */
    liveUpdatedAt: Date | null = null;

    /** True while the realtime socket is connected (polling falls back when false). */
    realtimeConnected = false;

    /** True once the socket has connected at least once (so we say "Connecting…" vs "Reconnecting…"). */
    private hasEverConnected = false;

    /** Allocation ids whose grant/status just changed on a live update (drives the row flash). */
    readonly recentlyChangedAllocationIds = new Set<string>();
    /** Transient highlight flags for the stat cards after a live update. */
    budgetJustChanged = false;
    allocatedJustChanged = false;
    remainingJustChanged = false;
    private liveChangeFlashTimer: ReturnType<typeof setTimeout> | null = null;

    // Summary collapse state
    fundedCollapsed = false;
    inConsiderationSummaryCollapsed = true;
    setAsideSummaryCollapsed = true;

    /** True when the compact budget stats bar should stick below the app header. */
    statsStickyVisible = false;

    /** Measured bottom edge of the app layout header (px); 0 when header has scrolled off. */
    layoutHeaderBottomPx = 0;

    /** Sticky top offset + max height (px) for the History panel so its header always
     *  clears the fixed stats/actions bar instead of being hidden behind it. */
    historyTopPx = 88;
    historyMaxHeightPx: number | null = null;

    @ViewChild('statsStickySentinel') statsStickySentinel?: ElementRef<HTMLElement>;
    @ViewChild('topStickyBar') topStickyBar?: ElementRef<HTMLElement>;

    displayedColumns = ['projectTitle', 'organization', 'sponsor', 'createdOn', 'amountRequested', 'amountGranted'];

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private meetingService: MeetingService,
        private realtime: MeetingRealtimeService,
        private outboundEmailService: OutboundEmailService,
        private authService: AuthService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private _changeDetectorRef: ChangeDetectorRef,
        private _userPreferences: UserPreferencesService,
    ) {
        this.setupTablePageSize = this._userPreferences.pageSizeForOptions(this.setupTablePageSizeOptions);
        this.activeTablePageSize = this._userPreferences.pageSizeForOptions(this.activeTablePageSizeOptions);
    }

    ngAfterViewInit(): void {
        this.measureLayoutHeader();
        this.updateStatsStickyVisible();
        this.updateHistoryLayout();
    }

    @HostListener('window:scroll')
    @HostListener('window:resize')
    onWindowScrollOrResize(): void {
        this.measureLayoutHeader();
        this.updateStatsStickyVisible();
        this.updateHistoryLayout();
    }

    /**
     * Pin the History panel just below the fixed stats/actions bar so its header
     * stays visible while the list scrolls, and cap its height to the space left
     * in the viewport. Recomputed on scroll/resize since the bar height varies.
     */
    private updateHistoryLayout(): void {
        if (typeof window === 'undefined') {
            return;
        }
        // Below the lg breakpoint the panel stacks (static) and CSS caps its height.
        if (window.innerWidth < 1024) {
            if (this.historyMaxHeightPx !== null || this.historyTopPx !== 88) {
                this.historyMaxHeightPx = null;
                this.historyTopPx = 88;
                this._changeDetectorRef.markForCheck();
            }
            return;
        }
        const gap = 12;
        const barHeight =
            this.topStickyBarVisible && this.topStickyBar?.nativeElement
                ? Math.round(this.topStickyBar.nativeElement.getBoundingClientRect().height)
                : 0;
        const top = this.layoutHeaderBottomPx + barHeight + gap;
        const maxHeight = Math.max(180, Math.round(window.innerHeight - top - gap));
        if (top !== this.historyTopPx || maxHeight !== this.historyMaxHeightPx) {
            this.historyTopPx = top;
            this.historyMaxHeightPx = maxHeight;
            this._changeDetectorRef.markForCheck();
        }
    }

    private measureLayoutHeader(): void {
        const nav = document.querySelector('.modern-layout-top-nav');
        const header = nav?.closest('.flex.flex-0.items-center') as HTMLElement | null;
        // As the layout header scrolls off, track its bottom edge down to 0 (no fallback gap).
        const next = header ? Math.max(0, Math.round(header.getBoundingClientRect().bottom)) : 0;
        if (next !== this.layoutHeaderBottomPx) {
            this.layoutHeaderBottomPx = next;
            this._changeDetectorRef.markForCheck();
        }
    }

    private statsStickyTopOffset(): number {
        return this.layoutHeaderBottomPx;
    }

    private updateStatsStickyVisible(): void {
        if (!this.loaded || !this.meeting || !this.statsStickySentinel?.nativeElement) {
            if (this.statsStickyVisible) {
                this.statsStickyVisible = false;
                this._changeDetectorRef.markForCheck();
            }
            return;
        }

        const top = this.statsStickySentinel.nativeElement.getBoundingClientRect().top;
        const visible = top < this.statsStickyTopOffset();
        if (visible !== this.statsStickyVisible) {
            this.statsStickyVisible = visible;
            this._changeDetectorRef.markForCheck();
        }
    }

    get budgetUsagePercent(): number {
        const budget = this.budgetForDisplay();
        if (!budget) {
            return 0;
        }
        return Math.min(100, (this.totalAllocated / budget) * 100);
    }

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
                this.realtime.joinMeeting(id);
                this.loadMeetingDetails(id);
            });

        // Live updates pushed by the server after any meeting mutation.
        this.realtime
            .meetingUpdates()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((meeting) => this.applyLiveMeetingUpdate(meeting));

        this.realtime
            .connected()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((connected) => {
                this.realtimeConnected = connected;
                if (connected) {
                    this.hasEverConnected = true;
                }
                this._changeDetectorRef.markForCheck();
            });

        // Keep the "updated N ago" label current while a meeting is live.
        interval(1000)
            .pipe(
                filter(() => this.showLiveIndicator && !!this.liveUpdatedAt),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe(() => this._changeDetectorRef.markForCheck());

        this.destroyRef.onDestroy(() => {
            this.clearSetupBudgetNotesSavedTimer();
            this.clearAllocationsSavedTimer();
            this.clearLiveChangeFlashTimer();
            if (this.meetingId) {
                this.realtime.leaveMeeting(this.meetingId);
            }
        });

        this.setupSearchSubject
            .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.rebuildSetupProposalBatches();
                this._changeDetectorRef.markForCheck();
            });

        this.setupBudgetNotesSaveSubject
            .pipe(
                debounceTime(600),
                tap(() => {
                    this.clearSetupBudgetNotesSavedTimer();
                    this.setupBudgetNotesSavedFlash = false;
                    this.setupBudgetNotesSaving = true;
                    this._changeDetectorRef.markForCheck();
                }),
                // Outer finalize never ran (Subject never completes); clear saving when each save finishes.
                switchMap(() =>
                    this.persistSetupBudgetAndNotesIfChanged().pipe(
                        finalize(() => {
                            this.setupBudgetNotesSaving = false;
                            this._changeDetectorRef.markForCheck();
                        })
                    )
                ),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe({
                next: (meeting) => {
                    if (meeting) {
                        this.meeting = meeting;
                        this.recalcTotals();
                        this.flashSetupBudgetNotesSaved();
                        if (this.meeting.status === 'completed') {
                            this.loadSummary(this.meeting._id);
                        }
                    }
                },
                error: (err) => {
                    this.clearSetupBudgetNotesSavedTimer();
                    this.setupBudgetNotesSavedFlash = false;
                    const msg = err.error?.message || 'Error saving budget or notes';
                    this.snackBar.open(msg, 'Close', { duration: 5000 });
                }
            });

        this.allocationSaveSubject
            .pipe(
                debounceTime(600),
                tap(() => {
                    this.clearAllocationsSavedTimer();
                    this.allocationsSavedFlash = false;
                    this.allocationsSaving = true;
                    this._changeDetectorRef.markForCheck();
                }),
                switchMap(() =>
                    this.persistPendingAllocationsIfAny().pipe(
                        finalize(() => {
                            this.allocationsSaving = false;
                            this._changeDetectorRef.markForCheck();
                        })
                    )
                ),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe({
                next: (meeting) => {
                    if (meeting) {
                        this.applyAllocationSaveResponse(meeting);
                    }
                },
                error: (err) => {
                    this.clearAllocationsSavedTimer();
                    this.allocationsSavedFlash = false;
                    const msg = err.error?.message || 'Error saving allocations';
                    this.snackBar.open(msg, 'Close', { duration: 5000 });
                },
            });

        // Live sync: while a meeting is being set up or run, poll for the latest
        // state so directors watching see the president's edits without refreshing.
        interval(MeetingDetailComponent.LIVE_POLL_INTERVAL_MS)
            .pipe(
                filter(() => this.canLivePoll()),
                switchMap(() =>
                    this.meetingService.getMeeting(this.meetingId).pipe(
                        catchError(() => of(null))
                    )
                ),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe((meeting) => {
                if (meeting) {
                    this.applyLiveMeetingUpdate(meeting);
                }
            });
    }

    private clearSetupBudgetNotesSavedTimer(): void {
        if (this.setupBudgetNotesSavedTimer !== null) {
            clearTimeout(this.setupBudgetNotesSavedTimer);
            this.setupBudgetNotesSavedTimer = null;
        }
    }

    /** Show inline “Saved” feedback for a few seconds after a successful auto-save. */
    private flashSetupBudgetNotesSaved(): void {
        this.clearSetupBudgetNotesSavedTimer();
        this.setupBudgetNotesSavedFlash = true;
        this._changeDetectorRef.markForCheck();
        this.setupBudgetNotesSavedTimer = setTimeout(() => {
            this.setupBudgetNotesSavedFlash = false;
            this.setupBudgetNotesSavedTimer = null;
            this._changeDetectorRef.markForCheck();
        }, 2800);
    }

    private clearAllocationsSavedTimer(): void {
        if (this.allocationsSavedTimer !== null) {
            clearTimeout(this.allocationsSavedTimer);
            this.allocationsSavedTimer = null;
        }
    }

    private flashAllocationsSaved(): void {
        this.clearAllocationsSavedTimer();
        this.allocationsSavedFlash = true;
        this._changeDetectorRef.markForCheck();
        this.allocationsSavedTimer = setTimeout(() => {
            this.allocationsSavedFlash = false;
            this.allocationsSavedTimer = null;
            this._changeDetectorRef.markForCheck();
        }, 2800);
    }

    private canAutosaveAllocations(): boolean {
        if (!this.meeting?._id || !this.isPresidentOrAdmin) {
            return false;
        }
        // While editing a completed meeting we hold edits locally and only persist
        // when the user clicks "Done" — no per-keystroke autosave (or its toasts).
        return this.meeting.status === 'in_progress';
    }

    private scheduleAllocationAutosave(): void {
        if (this.canAutosaveAllocations()) {
            this.allocationSaveSubject.next();
        }
    }

    /**
     * Emits saved meeting or `null` when there is nothing to persist (never completes silently).
     * Pass `force` to persist even when autosave is off (e.g. applying setup drafts at start).
     */
    private persistPendingAllocationsIfAny(force = false) {
        const allowed = force
            ? !!this.meeting?._id && this.isPresidentOrAdmin
            : this.canAutosaveAllocations();
        if (!allowed || this.pendingAllocations.size === 0) {
            return of(null);
        }

        const allocations = Array.from(this.pendingAllocations.entries())
            .filter(([id]) => {
                const alloc = this.meeting.allocations?.find((a: any) => String(a._id) === id);
                return alloc && this.allocationIsActive(alloc);
            })
            .map(([id, amountGranted]) => ({
                _id: id,
                amountGranted,
            }));

        if (!allocations.length) {
            this.pendingAllocations.clear();
            this.hasUnsavedChanges = false;
            return of(null);
        }

        return this.meetingService.updateAllocations(this.meeting._id, allocations);
    }

    /**
     * Make the server's active/inactive allocation state match the local setup plan when the
     * meeting starts. Set-aside decisions are local drafts during setup, and a proposal moved
     * back to consideration must be restored on the server too (it may have been set aside in a
     * prior session). Runs sequentially (never in parallel) to avoid version conflicts.
     */
    private reconcileSetupActiveState() {
        if (!this.meeting?._id || !this.isPresidentOrAdmin) {
            return of(null);
        }
        const meetingId = this.meeting._id;
        const allocations = this.meeting.allocations || [];
        const inactiveIds = allocations
            .filter((a: any) => !this.allocationIsActive(a))
            .map((a: any) => String(a._id));
        const activeIds = allocations
            .filter((a: any) => this.allocationIsActive(a))
            .map((a: any) => String(a._id));

        const setAside$ = inactiveIds.length
            ? this.meetingService.bulkSetAllocationsActive(meetingId, inactiveIds, false)
            : of(null);
        const restore$ = activeIds.length
            ? this.meetingService.bulkSetAllocationsActive(meetingId, activeIds, true)
            : of(null);

        return setAside$.pipe(switchMap(() => restore$));
    }

    /** Merge a save response without dropping in-flight edits that did not persist. */
    private applyAllocationSaveResponse(
        meeting: any,
        options?: { showSavedFlash?: boolean; suppressToast?: boolean }
    ): void {
        const sent = new Map(this.pendingAllocations);
        this.meeting = meeting;

        if (sent.size === 0) {
            this.recalcTotals();
            return;
        }

        let allMatched = true;
        const savedAmounts = new Map<string, number>();
        for (const [id, sentAmount] of sent) {
            const alloc = this.meeting.allocations?.find((a: any) => String(a._id) === id);
            const savedAmount = Number(alloc?.amountGranted ?? 0);
            if (savedAmount === Number(sentAmount)) {
                this.pendingAllocations.delete(id);
                savedAmounts.set(id, savedAmount);
                if (this.focusedAllocationInputId !== id) {
                    this.allocationAmountDrafts.delete(id);
                }
            } else {
                allMatched = false;
            }
        }

        this.hasUnsavedChanges = this.pendingAllocations.size > 0;
        const needsResort =
            this.meeting.status === 'completed' && this.editingCompletedMeeting;
        if (needsResort) {
            this.recalcTotals();
        } else {
            this.patchSavedAllocationAmounts(savedAmounts);
            this.updateAllocationBudgetTotals();
        }
        this._changeDetectorRef.markForCheck();

        if (allMatched && options?.showSavedFlash !== false) {
            this.flashAllocationsSaved();
        } else if (!allMatched && !options?.suppressToast) {
            this.snackBar.open(
                'Could not save that grant amount. Your edit is still on screen — try again.',
                'Close',
                { duration: 6000 }
            );
        }

        this.refreshSummaryIfCompleted();
        this.restoreFocusedAllocationInput();
    }

    loadMeetingDetails(id: string): void {
        this.loaded = false;
        this.proposalsTableLoading = true;
        this.meeting = null;
        this.summary = null;
        this.displayAllocations = [];
        this.displayAllocationsSetAside = [];
        this.setupTableRows = [];
        this.statsStickyVisible = false;
        this.editingCompletedMeeting = false;
        this.editingInProgressBudget = false;
        this.clearAllocationSelections();
        this.setupStepRestorePending = true;

        forkJoin({
            meeting: this.meetingService.getMeeting(id),
            isPresident: this.authService.checkPresident().pipe(
                take(1),
                catchError(() => of(false))
            ),
        })
            .pipe(
                switchMap(({ meeting, isPresident }) => {
                    this.isPresidentOrAdmin = !!isPresident;
                    this.applyMeetingResponse(meeting);
                    if (this.shouldSyncEligibleProposals()) {
                        return this.meetingService.syncEligibleProposals(id).pipe(
                            catchError(() => {
                                this.snackBar.open(
                                    'Could not refresh the proposal list for this meeting',
                                    'Close',
                                    { duration: 5000 }
                                );
                                return of(null);
                            })
                        );
                    }
                    return of(null);
                }),
                finalize(() => {
                    this.proposalsTableLoading = false;
                    this.loaded = true;
                    this._changeDetectorRef.markForCheck();
                    setTimeout(() => {
                        this.measureLayoutHeader();
                        this.updateStatsStickyVisible();
                        this.updateHistoryLayout();
                        this.tryRestoreSetupStepIndex();
                        this.restoreAmountEachDraft();
                        this.restoreSetAsideDraft();
                    });
                })
            )
            .subscribe((syncedMeeting) => {
                if (syncedMeeting) {
                    this.applyMeetingResponse(syncedMeeting);
                }
                if (this.meeting?.status === 'completed') {
                    this.loadSummary(id);
                    this.loadGrantEmailStatus(id);
                }
            }, () => {
                this.meeting = null;
                this.displayAllocations = [];
                this.displayAllocationsSetAside = [];
                this.setupTableRows = [];
            });
    }

    /** Apply meeting payload from GET or sync-eligible-proposals. */
    private applyMeetingResponse(meeting: any): void {
        this.meeting = meeting;
        this.totalBudget = meeting.totalBudget;
        this.meetingNotes = meeting.notes || '';
        this.setupSearchQuery = '';
        this.setupSortActive = 'createdOn';
        this.setupSortDirection = 'asc';
        this.recalcTotals();
        this.pendingAllocations.clear();
        this.allocationAmountDrafts.clear();
        this.hasUnsavedChanges = false;
    }

    /**
     * True when it's safe to poll the server for a live refresh: the meeting is
     * loaded, still in a live state (setup / in progress), the tab is visible, and
     * the current user is not in the middle of editing (so we never clobber edits).
     */
    private canLivePoll(): boolean {
        if (!this.loaded || !this.meetingId || !this.meeting) {
            return false;
        }
        // Realtime socket is authoritative; only poll as a fallback when it's down.
        if (this.realtimeConnected) {
            return false;
        }
        if (typeof document !== 'undefined' && document.hidden) {
            return false;
        }
        const status = this.meeting.status;
        if (status !== 'setup' && status !== 'in_progress') {
            return false;
        }
        return !this.isLocallyEditing();
    }

    /** Any local editing/in-flight state that a live refresh must not overwrite. */
    private isLocallyEditing(): boolean {
        return (
            this.hasUnsavedChanges ||
            this.pendingAllocations.size > 0 ||
            this.editingInProgressBudget ||
            this.editingCompletedMeeting ||
            this.setupBudgetNotesSaving ||
            this.allocationsSaving ||
            this.bulkAllocationActionInFlight ||
            this.allocationActiveToggleInFlight.size > 0 ||
            this.syncAllocationsInFlight ||
            this.setupSetAsideDraftIds.size > 0 ||
            this.focusedAllocationInputId !== null
        );
    }

    /**
     * Apply a polled meeting payload without disturbing local edits, search, or sort.
     * Editable drafts (budget/notes) are only overwritten for read-only viewers.
     */
    private applyLiveMeetingUpdate(meeting: any): void {
        if (!meeting || !this.meeting) {
            return;
        }
        // Re-check: the user may have started editing while the request was in flight.
        if (this.isLocallyEditing()) {
            return;
        }
        // Ignore stale/mismatched responses (e.g. after navigating to another meeting).
        if (this.meetingId && String(meeting._id) !== String(this.meetingId)) {
            return;
        }

        // Snapshot the current values so we can highlight exactly what changed.
        const prevGranted = new Map<string, number>();
        const prevActive = new Map<string, boolean>();
        for (const a of this.meeting.allocations || []) {
            prevGranted.set(String(a._id), Number(a.amountGranted || 0));
            prevActive.set(String(a._id), a.activeInMeeting !== false);
        }
        const prevBudget = Number(this.meeting.totalBudget || 0);
        const prevAllocated = this.totalAllocated;
        const prevStatus = this.meeting.status;

        this.meeting = meeting;
        // Our own recent set-aside/restore decisions win over a possibly-stale broadcast.
        this.reconcileRecentSelfChanges();
        if (!this.canEditBudget()) {
            this.totalBudget = meeting.totalBudget;
            this.meetingNotes = meeting.notes || '';
        }
        this.recalcTotals();
        this.liveUpdatedAt = new Date();
        this.flagLiveChanges(prevGranted, prevActive, prevBudget, prevAllocated);
        this.refreshSummaryIfCompleted();
        this.notifyStatusTransition(prevStatus, meeting.status);
        this._changeDetectorRef.markForCheck();
    }

    /** Toast watchers when the president moves the meeting to a new lifecycle stage. */
    private notifyStatusTransition(prev: string, next: string): void {
        if (!prev || prev === next) {
            return;
        }
        if (next === 'completed') {
            this.snackBar.open(
                'This meeting has been completed — final awards are shown below.',
                'Close',
                { duration: 6000 }
            );
        } else if (prev === 'setup' && next === 'in_progress') {
            this.snackBar.open('The meeting has started.', 'Close', { duration: 5000 });
        }
    }

    /** Relative "updated N ago" label for watchers; empty until the first live update. */
    get liveAgoLabel(): string {
        if (!this.liveUpdatedAt) {
            return '';
        }
        const secs = Math.max(0, Math.floor((Date.now() - this.liveUpdatedAt.getTime()) / 1000));
        if (secs < 5) {
            return 'Updated just now';
        }
        if (secs < 60) {
            return `Updated ${secs}s ago`;
        }
        const mins = Math.floor(secs / 60);
        return mins === 1 ? 'Updated 1 min ago' : `Updated ${mins} min ago`;
    }

    /** Badge label reflecting the real connection state (not just "live during setup"). */
    get liveStatusLabel(): string {
        if (this.realtimeConnected) {
            return 'Live';
        }
        return this.hasEverConnected ? 'Reconnecting…' : 'Connecting…';
    }

    isAllocationRecentlyChanged(row: any): boolean {
        return !!row && this.recentlyChangedAllocationIds.has(String(row._id));
    }

    private liveChangeProposalTitle(allocation: any): string {
        const title = allocation?.proposal?.projectTitle;
        return title && String(title).trim() ? String(title).trim() : 'A proposal';
    }

    /** Remember that this client just set aside (active=false) / restored (active=true) these proposals. */
    private markSelfAllocationChanges(ids: string[], active: boolean): void {
        const expiry = Date.now() + MeetingDetailComponent.SELF_CHANGE_SUPPRESS_MS;
        for (const id of ids) {
            this.recentSelfAllocationChanges.set(String(id), { active, expiry });
        }
    }

    /** Forget a self-change (e.g. the request failed and we reverted the optimistic state). */
    private clearSelfAllocationChange(id: string): void {
        this.recentSelfAllocationChanges.delete(String(id));
    }

    /** True if this client made a set-aside/restore change to this allocation very recently. */
    private isRecentSelfAllocationChange(id: string): boolean {
        const entry = this.recentSelfAllocationChanges.get(String(id));
        if (!entry) {
            return false;
        }
        if (Date.now() > entry.expiry) {
            this.recentSelfAllocationChanges.delete(String(id));
            return false;
        }
        return true;
    }

    /**
     * A live-update payload can lag just behind this client's own set-aside/restore action.
     * Re-apply our recent local decisions on top of the incoming meeting so proposals we
     * just set aside don't flicker back into the active table.
     */
    private reconcileRecentSelfChanges(): void {
        if (this.recentSelfAllocationChanges.size === 0) {
            return;
        }
        const now = Date.now();
        for (const a of this.meeting?.allocations || []) {
            const entry = this.recentSelfAllocationChanges.get(String(a._id));
            if (!entry) {
                continue;
            }
            if (now > entry.expiry) {
                this.recentSelfAllocationChanges.delete(String(a._id));
                continue;
            }
            a.activeInMeeting = entry.active;
            if (!entry.active) {
                a.amountGranted = 0;
            }
        }
    }

    /**
     * Toast for watchers when the president moves proposals to / from the set aside
     * list. The person who performed the action is guarded out upstream (their own
     * edit is in flight), so this only fires for people watching.
     */
    private notifyAllocationListChanges(setAside: string[], restored: string[]): void {
        const parts: string[] = [];
        if (setAside.length === 1) {
            parts.push(`“${setAside[0]}” was set aside`);
        } else if (setAside.length > 1) {
            parts.push(`${setAside.length} proposals were set aside`);
        }
        if (restored.length === 1) {
            parts.push(`“${restored[0]}” moved back to consideration`);
        } else if (restored.length > 1) {
            parts.push(`${restored.length} proposals moved back to consideration`);
        }
        if (parts.length > 0) {
            this.snackBar.open(parts.join(' · '), 'Close', { duration: 4000 });
        }
    }

    private clearLiveChangeFlashTimer(): void {
        if (this.liveChangeFlashTimer !== null) {
            clearTimeout(this.liveChangeFlashTimer);
            this.liveChangeFlashTimer = null;
        }
    }

    /** Diff the applied update against the prior state and trigger the transient highlights. */
    private flagLiveChanges(
        prevGranted: Map<string, number>,
        prevActive: Map<string, boolean>,
        prevBudget: number,
        prevAllocated: number
    ): void {
        const changedIds = new Set<string>();
        const setAsideTitles: string[] = [];
        const restoredTitles: string[] = [];
        for (const a of this.meeting?.allocations || []) {
            const id = String(a._id);
            const grantedChanged = Number(a.amountGranted || 0) !== (prevGranted.get(id) ?? 0);
            const wasActive = prevActive.get(id) ?? true;
            const nowActive = a.activeInMeeting !== false;
            const activeChanged = prevActive.has(id) && nowActive !== wasActive;
            const isNew = !prevGranted.has(id);
            if (grantedChanged || activeChanged || isNew) {
                changedIds.add(id);
            }
            // Only toast for changes made by *other* people; the actor already has their
            // own confirmation (and a live echo of their bulk action would otherwise show
            // up as partial "N proposals set aside" toasts).
            if (activeChanged && !this.isRecentSelfAllocationChange(id)) {
                if (!nowActive) {
                    setAsideTitles.push(this.liveChangeProposalTitle(a));
                } else {
                    restoredTitles.push(this.liveChangeProposalTitle(a));
                }
            }
        }

        this.notifyAllocationListChanges(setAsideTitles, restoredTitles);

        const budgetChanged = Number(this.meeting?.totalBudget || 0) !== prevBudget;
        const allocatedChanged = this.totalAllocated !== prevAllocated;

        if (changedIds.size === 0 && !budgetChanged && !allocatedChanged) {
            return;
        }

        this.recentlyChangedAllocationIds.clear();
        changedIds.forEach((id) => this.recentlyChangedAllocationIds.add(id));
        this.budgetJustChanged = budgetChanged;
        this.allocatedJustChanged = allocatedChanged;
        this.remainingJustChanged = budgetChanged || allocatedChanged;

        this.clearLiveChangeFlashTimer();
        this.liveChangeFlashTimer = setTimeout(() => {
            this.recentlyChangedAllocationIds.clear();
            this.budgetJustChanged = false;
            this.allocatedJustChanged = false;
            this.remainingJustChanged = false;
            this.liveChangeFlashTimer = null;
            this._changeDetectorRef.markForCheck();
        }, 1800);
    }

    /** Show the "Live" indicator only while a meeting is actively running (not during setup). */
    get showLiveIndicator(): boolean {
        return this.loaded && this.meeting?.status === 'in_progress';
    }

    /** Whether to run sync-eligible-proposals for the current meeting + role. */
    private shouldSyncEligibleProposals(): boolean {
        if (!this.meeting?._id || !this.isPresidentOrAdmin) {
            return false;
        }
        const st = this.meeting.status;
        if (st === 'completed' && !this.editingCompletedMeeting) {
            return false;
        }
        return st === 'setup' || st === 'in_progress' || st === 'completed';
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
                    if (!Array.isArray(this.summary.setAside)) {
                        this.summary.setAside = [];
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

    private refreshSummaryIfCompleted(): void {
        if (this.meeting?.status === 'completed' && this.meeting._id) {
            this.loadSummary(this.meeting._id);
            this.loadGrantEmailStatus(this.meeting._id);
        }
    }

    /**
     * President: merge in any new submitted proposals for the meeting year (excludes archived & composer drafts).
     * Called after auth resolves, and when opening completed meeting for edit.
     */
    maybeSyncEligibleProposals(): void {
        if (!this.shouldSyncEligibleProposals()) {
            return;
        }
        if (this.syncAllocationsInFlight) {
            return;
        }
        this.syncAllocationsInFlight = true;
        if (this.loaded) {
            this.proposalsTableLoading = true;
            this._changeDetectorRef.markForCheck();
        }
        this.meetingService.syncEligibleProposals(this.meeting._id).subscribe({
            next: (m) => {
                this.syncAllocationsInFlight = false;
                this.applyMeetingResponse(m);
                if (m.status === 'completed') {
                    this.loadSummary(m._id);
                }
                this.proposalsTableLoading = false;
                this._changeDetectorRef.markForCheck();
            },
            error: () => {
                this.syncAllocationsInFlight = false;
                this.proposalsTableLoading = false;
                this.snackBar.open('Could not refresh the proposal list for this meeting', 'Close', {
                    duration: 5000
                });
                this._changeDetectorRef.markForCheck();
            }
        });
    }

    startingMeeting = false;

    startMeeting(): void {
        if (!this.meeting || this.startingMeeting) return;

        this.startingMeeting = true;
        this._changeDetectorRef.markForCheck();

        const data: any = { status: 'in_progress' };
        if (this.totalBudget !== this.meeting.totalBudget) {
            data.totalBudget = this.totalBudget;
        }
        if (this.meetingNotes !== (this.meeting.notes || '')) {
            data.notes = this.meetingNotes;
        }

        // Resolve each in-consideration proposal to its final amount (a positive per-proposal
        // amount, otherwise the "amount each" default) and stage it, then persist all drafts
        // (setup drafts aren't autosaved).
        for (const alloc of this.meeting.allocations || []) {
            if (!this.allocationIsActive(alloc)) {
                continue;
            }
            const id = String(alloc._id);
            const finalAmount = this.effectiveAllocationAmountForTotals(alloc);
            if (Number(alloc.amountGranted || 0) !== finalAmount) {
                this.pendingAllocations.set(id, finalAmount);
            }
        }

        // Set-aside / restore were kept as local drafts during setup; reconcile the server's
        // active state to the local plan before persisting amounts and starting the meeting.
        this.reconcileSetupActiveState()
            .pipe(
                switchMap(() => this.persistPendingAllocationsIfAny(true)),
                switchMap((saved) => {
                    if (saved) {
                        this.applyAllocationSaveResponse(saved, { showSavedFlash: false });
                    }
                    return this.meetingService.syncEligibleProposals(this.meeting._id);
                })
            )
            .subscribe({
            next: (synced) => {
                this.meeting = synced;
                this.totalBudget = synced.totalBudget;
                this.meetingNotes = synced.notes || '';
                this.recalcTotals();

                this.meetingService.updateMeeting(this.meeting._id, data).subscribe({
                    next: (meeting) => {
                        this.meeting = meeting;
                        this.editingInProgressBudget = false;
                        this.recalcTotals();
                        this.clearSetupStepStorage();
                        this.startingMeeting = false;
                        this.snackBar.open('Meeting started', 'Close', { duration: 3000 });
                        this._changeDetectorRef.markForCheck();
                    },
                    error: (err) => {
                        this.startingMeeting = false;
                        const msg = err.error?.message || 'Error starting meeting';
                        this.snackBar.open(msg, 'Close', { duration: 5000 });
                        this._changeDetectorRef.markForCheck();
                    }
                });
            },
            error: (err) => {
                this.startingMeeting = false;
                const msg =
                    err.error?.message ||
                    (this.pendingAllocations.size > 0
                        ? 'Error saving allocations before start'
                        : 'Error syncing proposals before start');
                this.snackBar.open(msg, 'Close', { duration: 5000 });
                this._changeDetectorRef.markForCheck();
            },
        });
    }

    /** President can edit budget during setup, when explicitly editing during in progress, or when editing a completed meeting. */
    canEditBudget(): boolean {
        if (!this.isPresidentOrAdmin || !this.meeting) {
            return false;
        }
        if (this.meeting.status === 'setup') {
            return true;
        }
        if (this.meeting.status === 'in_progress') {
            return this.editingInProgressBudget;
        }
        return this.meeting.status === 'completed' && this.editingCompletedMeeting;
    }

    /** Call when budget or notes change during setup; triggers debounced save. */
    onSetupBudgetOrNotesUserChange(): void {
        this.onBudgetUserChange();
    }

    /** Keep stat cards in sync while the budget field is edited. */
    onBudgetUserChange(): void {
        this.recalcTotals();
        if (this.canAutosaveBudget()) {
            this.setupBudgetNotesSaveSubject.next();
        }
    }

    private canAutosaveBudget(): boolean {
        if (!this.meeting?._id || !this.isPresidentOrAdmin) {
            return false;
        }
        if (this.meeting.status === 'setup') {
            return true;
        }
        if (this.meeting.status === 'in_progress') {
            return this.editingInProgressBudget;
        }
        return this.meeting.status === 'completed' && this.editingCompletedMeeting;
    }

    private persistSetupBudgetAndNotesIfChanged() {
        if (!this.meeting?._id || !this.isPresidentOrAdmin) {
            return EMPTY;
        }

        const isSetup = this.meeting.status === 'setup';
        const isInProgress =
            this.meeting.status === 'in_progress' && this.editingInProgressBudget;
        const isCompletedEdit =
            this.meeting.status === 'completed' && this.editingCompletedMeeting;
        if (!isSetup && !isInProgress && !isCompletedEdit) {
            return EMPTY;
        }

        const b = Number(this.totalBudget);
        if (!Number.isFinite(b)) {
            return EMPTY;
        }

        if (isSetup) {
            const notes = this.meetingNotes ?? '';
            if (b === Number(this.meeting.totalBudget) && notes === (this.meeting.notes || '')) {
                return EMPTY;
            }
            return this.meetingService.updateMeeting(this.meeting._id, {
                totalBudget: b,
                notes: notes
            });
        }

        if (b === Number(this.meeting.totalBudget)) {
            return EMPTY;
        }
        return this.meetingService.updateMeeting(this.meeting._id, {
            totalBudget: b
        });
    }

    onAllocationAmountFocus(allocationId: string, event: Event, row: any): void {
        const input = event.target as HTMLInputElement;
        const key = String(allocationId);
        this.focusedAllocationInputId = key;

        if (!this.allocationAmountDrafts.has(key)) {
            const fromRow = this.getAllocationInputValue(row);
            const seed = input.value !== '' ? input.value : fromRow;
            this.allocationAmountDrafts.set(key, seed);
            if (input.value !== seed) {
                input.value = seed;
            }
        }

        this.captureAllocationInputSelection(input);
    }

    onAllocationAmountBlur(allocationId: string): void {
        const key = String(allocationId);
        if (this.focusedAllocationInputId === key) {
            this.focusedAllocationInputId = null;
            this.focusedAllocationInputSelection = null;
        }
        if (!this.pendingAllocations.has(key)) {
            this.allocationAmountDrafts.delete(key);
        }
    }

    onAllocationAmountInput(allocationId: string, event: Event): void {
        const input = event.target as HTMLInputElement;
        const raw = input.value;
        const key = String(allocationId);
        this.focusedAllocationInputId = key;
        this.captureAllocationInputSelection(input);
        this.allocationAmountDrafts.set(key, raw);

        let parsed = 0;
        if (raw.trim() !== '') {
            parsed = Number(raw);
            if (!Number.isFinite(parsed)) {
                return;
            }
        }

        this.pendingAllocations.set(key, parsed);
        this.hasUnsavedChanges = true;
        this.clearAllocationsSavedTimer();
        this.allocationsSavedFlash = false;
        this.scheduleAllocationAutosave();
        this.updateAllocationBudgetTotals();
    }

    /** The flat "amount each" default (>= 0), or null when the field is empty/invalid. */
    get amountEachValue(): number | null {
        if (this.bulkAllocateAmount === null || this.bulkAllocateAmount === undefined) {
            return null;
        }
        const n = Number(this.bulkAllocateAmount);
        return Number.isFinite(n) && n >= 0 ? n : null;
    }

    /**
     * Amount an active proposal will be allocated when the meeting starts: an explicit
     * per-proposal draft wins, otherwise the flat "amount each" default (setup only),
     * otherwise the already-saved grant.
     */
    private effectiveAllocationAmountForTotals(alloc: any): number {
        // During setup, per-proposal amounts are not editable — every proposal simply gets the
        // flat "amount each" default (falling back to any already-saved grant).
        if (this.meeting?.status === 'setup') {
            return this.amountEachValue != null ? this.amountEachValue : (alloc.amountGranted || 0);
        }
        // In progress / completed edit: an explicit draft (including 0) wins.
        const pending = this.pendingAllocations.get(String(alloc._id));
        return pending !== undefined ? pending : (alloc.amountGranted || 0);
    }

    /** Read-only amount shown per proposal during setup (everyone gets the flat default). */
    setupRowAmount(alloc: any): number {
        return this.effectiveAllocationAmountForTotals(alloc);
    }

    /** Count of in-consideration proposals that will receive a non-zero amount at start. */
    get proposalsReceivingAmountCount(): number {
        let n = 0;
        for (const a of this.meeting?.allocations || []) {
            if (this.allocationIsActive(a) && this.effectiveAllocationAmountForTotals(a) > 0) {
                n += 1;
            }
        }
        return n;
    }

    /** Recompute budget impact + persist the "amount each" default as the user types it. */
    onAmountEachChange(): void {
        this.updateAllocationBudgetTotals();
        this.persistAmountEachDraft();
        this._changeDetectorRef.markForCheck();
    }

    private amountEachStorageKey(meetingId?: string): string | null {
        const id = meetingId ?? this.meeting?._id;
        return id ? `meeting-detail-amount-each:${id}` : null;
    }

    /** Persist the "amount each" default so a refresh keeps it (setup only). */
    private persistAmountEachDraft(): void {
        if (this.meeting?.status !== 'setup') {
            return;
        }
        const key = this.amountEachStorageKey();
        if (!key) {
            return;
        }
        try {
            const value = this.amountEachValue;
            if (value == null) {
                sessionStorage.removeItem(key);
            } else {
                sessionStorage.setItem(key, String(value));
            }
        } catch {
            // storage unavailable; value remains in memory only
        }
    }

    private restoreAmountEachDraft(): void {
        if (this.meeting?.status !== 'setup' || !this.isPresidentOrAdmin) {
            return;
        }
        const key = this.amountEachStorageKey();
        if (!key) {
            return;
        }
        try {
            const raw = sessionStorage.getItem(key);
            if (raw == null || raw === '') {
                return;
            }
            const n = Number(raw);
            if (Number.isFinite(n) && n >= 0) {
                this.bulkAllocateAmount = n;
                this.updateAllocationBudgetTotals();
                this._changeDetectorRef.markForCheck();
            }
        } catch {
            // storage unavailable
        }
    }

    private captureAllocationInputSelection(input: HTMLInputElement): void {
        this.focusedAllocationInputSelection = {
            start: input.selectionStart ?? input.value.length,
            end: input.selectionEnd ?? input.value.length,
        };
    }

    private shouldRestoreAllocationInputFocus(allocationId: string): boolean {
        const active = document.activeElement;
        if (!active || active === document.body) {
            return true;
        }
        if (active instanceof HTMLInputElement && active.getAttribute('data-allocation-id') === allocationId) {
            return false;
        }
        if (active instanceof HTMLButtonElement || active instanceof HTMLAnchorElement) {
            return false;
        }
        if (
            active instanceof HTMLInputElement
            || active instanceof HTMLTextAreaElement
            || active instanceof HTMLSelectElement
        ) {
            const activeAllocId = active.getAttribute('data-allocation-id');
            if (activeAllocId && activeAllocId !== allocationId) {
                return false;
            }
            if (!activeAllocId) {
                return false;
            }
        }
        return true;
    }

    private restoreFocusedAllocationInput(): void {
        const id = this.focusedAllocationInputId;
        if (!id) {
            return;
        }

        const selection = this.focusedAllocationInputSelection;
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (!this.shouldRestoreAllocationInputFocus(id)) {
                    return;
                }

                const input = document.querySelector<HTMLInputElement>(
                    `input[data-allocation-id="${CSS.escape(id)}"]`
                );
                if (!input) {
                    return;
                }

                input.focus();
                const sel = selection;
                if (sel) {
                    try {
                        input.setSelectionRange(sel.start, sel.end);
                    } catch {
                        // number inputs may not support selection in some browsers
                    }
                }
            });
        });
    }

    private patchSavedAllocationAmounts(savedAmounts: Map<string, number>): void {
        if (!savedAmounts.size) {
            return;
        }
        for (const list of [this.displayAllocations, this.displayAllocationsSetAside]) {
            for (const row of list) {
                const id = String(row._id);
                if (savedAmounts.has(id)) {
                    row.amountGranted = savedAmounts.get(id);
                }
            }
        }
    }

    getAllocationInputValue(alloc: any): string {
        const id = String(alloc._id);
        if (this.allocationAmountDrafts.has(id)) {
            return this.allocationAmountDrafts.get(id);
        }
        const v = this.getAllocationValue(alloc);
        return v === 0 ? '' : String(v);
    }

    private updateAllocationBudgetTotals(): void {
        if (!this.meeting?.allocations?.length) {
            this.totalAllocated = 0;
            this.remainingBudget = this.budgetForDisplay();
            return;
        }
        let total = 0;
        for (const alloc of this.meeting.allocations) {
            if (!this.allocationIsActive(alloc)) {
                continue;
            }
            total += this.effectiveAllocationAmountForTotals(alloc);
        }
        this.totalAllocated = total;
        this.remainingBudget = this.budgetForDisplay() - total;
    }

    getAllocationValue(alloc: any): number {
        const id = String(alloc._id);
        const pending = this.pendingAllocations.get(id);
        return (pending !== undefined) ? pending : (alloc.amountGranted || 0);
    }

    /** Missing/undefined counts as active (older API data). */
    allocationIsActive(a: any): boolean {
        return a?.activeInMeeting !== false;
    }

    private syncDisplayAllocations(): void {
        const ordered = this.buildOrderedAllocations().map((row) => this.enrichAllocationRow(row));
        this.displayAllocations = ordered.filter((a) => this.allocationIsActive(a));
        this.displayAllocationsSetAside = ordered.filter((a) => !this.allocationIsActive(a));
        this.activeTableRows = this.displayAllocations;
        this.rebuildSetupProposalBatches();
        this.pruneAllocationSelections();
    }

    trackAllocationRow(_index: number, row: any): string {
        return String(row?._id ?? _index);
    }

    get activeTableDisplayedRows(): any[] {
        const start = this.activeTablePageIndex * this.activeTablePageSize;
        return this.activeTableRows.slice(start, start + this.activeTablePageSize);
    }

    onActiveTablePage(event: PageEvent): void {
        this.activeTablePageIndex = event.pageIndex;
        this.activeTablePageSize = event.pageSize;
    }

    private rebuildSetupProposalBatches(): void {
        if (this.meeting?.status !== 'setup') {
            this.setupProposalBatches = [];
            this.setupFilteredTotal = 0;
            return;
        }
        const filtered = this.filterSetupAllocations(this.displayAllocations || []);
        const sorted = [...filtered].sort((a, b) => this.compareSetupAllocations(a, b));
        this.setupFilteredTotal = sorted.length;
        const totalAll = this.displayAllocations.length;
        if (sorted.length > 0 || (totalAll > 0 && this.setupSearchQuery.trim())) {
            this.setupProposalBatches = [{ label: 'Proposals', rows: sorted }];
        } else {
            this.setupProposalBatches = [];
        }
        this.setupTableRows = sorted;
        this.setupTablePageIndex = 0;
        this.refreshSetupTableColumns();
    }

    private refreshSetupTableColumns(): void {
        this.setupTableColumns = this.getActiveColumns();
    }

    /** Copy proposal.createdAt onto the allocation row for mat-table binding. */
    private enrichAllocationRow(row: any): any {
        if (!row) {
            return row;
        }
        const createdAt = row.proposal?.createdAt;
        if (createdAt != null) {
            row.proposalCreatedAt = createdAt;
        }
        return row;
    }

    onSetupStepChange(index: number): void {
        this.setupStepIndex = index;
        if (this.meeting?.status === 'setup') {
            const key = this.setupStepStorageKey();
            if (key) {
                sessionStorage.setItem(key, String(index));
            }
            setTimeout(() => this.refreshSetupTableColumns());
        }
    }

    private setupStepStorageKey(meetingId?: string): string | null {
        const id = meetingId ?? this.meeting?._id;
        return id ? `meeting-detail-setup-step:${id}` : null;
    }

    private getSetupStepCount(): number {
        if (this.meeting?.status !== 'setup') {
            return 0;
        }
        // Budget + proposal batch step(s) + review.
        return 1 + this.setupProposalBatches.length + 1;
    }

    private tryRestoreSetupStepIndex(): void {
        if (!this.setupStepRestorePending || this.meeting?.status !== 'setup') {
            return;
        }
        const key = this.setupStepStorageKey();
        if (!key) {
            return;
        }
        let index = 0;
        const raw = sessionStorage.getItem(key);
        if (raw != null) {
            const parsed = parseInt(raw, 10);
            if (Number.isFinite(parsed) && parsed >= 0) {
                index = parsed;
            }
        }
        const max = Math.max(0, this.getSetupStepCount() - 1);
        this.setupStepIndex = Math.min(index, max);
        this.setupStepRestorePending = false;
        this._changeDetectorRef.markForCheck();
        setTimeout(() => this.refreshSetupTableColumns());
    }

    private clearSetupStepStorage(): void {
        const id = this.meeting?._id;
        const keys = [
            this.setupStepStorageKey(),
            this.amountEachStorageKey(),
            this.setAsideDraftStorageKey(),
        ];
        // Also clear the legacy per-proposal draft store (no longer used) so stale amounts
        // from older builds don't linger.
        if (id) {
            keys.push(`meeting-detail-setup-amounts:${id}`);
        }
        for (const key of keys) {
            if (key) {
                try {
                    sessionStorage.removeItem(key);
                } catch {
                    // ignore storage errors
                }
            }
        }
        this.setupSetAsideDraftIds.clear();
        this.bulkAllocateAmount = null;
        this.setupStepIndex = 0;
        this.setupStepRestorePending = false;
    }

    /** Current page slice for the setup proposals table (paginator lives in ng-template). */
    get setupTableDisplayedRows(): any[] {
        const start = this.setupTablePageIndex * this.setupTablePageSize;
        return this.setupTableRows.slice(start, start + this.setupTablePageSize);
    }

    onSetupTablePage(event: PageEvent): void {
        this.setupTablePageIndex = event.pageIndex;
        this.setupTablePageSize = event.pageSize;
    }

    onSetupSearchChange(value: string): void {
        this.setupSearchQuery = value;
        this.setupSearchSubject.next(value);
    }

    clearSetupSearch(): void {
        if (!this.setupSearchQuery.trim()) {
            return;
        }
        this.setupSearchQuery = '';
        this.setupTablePageIndex = 0;
        this.rebuildSetupProposalBatches();
        this._changeDetectorRef.markForCheck();
    }

    onSetupSort(sort: Sort): void {
        if (!sort.direction) {
            this.setupSortActive = 'createdOn';
            this.setupSortDirection = 'asc';
        } else {
            this.setupSortActive = sort.active;
            this.setupSortDirection = sort.direction as 'asc' | 'desc';
        }
        this.rebuildSetupProposalBatches();
        this._changeDetectorRef.markForCheck();
    }

    private filterSetupAllocations(rows: any[]): any[] {
        const q = this.setupSearchQuery.trim().toLowerCase();
        if (!q) {
            return [...rows];
        }
        return rows.filter((row) => {
            const title = (row.proposal?.projectTitle || '').toLowerCase();
            const org = (row.organization?.name || '').toLowerCase();
            const sponsor = this.sponsorSortKey(row).toLowerCase();
            const requested = String(row.amountRequested ?? '');
            return (
                title.includes(q) ||
                org.includes(q) ||
                sponsor.includes(q) ||
                requested.includes(q)
            );
        });
    }

    private sponsorSortKey(row: any): string {
        const s = row?.proposal?.sponsor;
        if (!s) {
            return '';
        }
        const named = this.getUserName(s);
        if (named) {
            return named;
        }
        if (typeof s === 'string') {
            return s;
        }
        return String(s?.email || '').trim();
    }

    private getProposalSubmittedTime(alloc: any): number {
        const raw = alloc?.proposalCreatedAt ?? alloc?.proposal?.createdAt;
        if (!raw) {
            return 0;
        }
        const t = new Date(raw).getTime();
        return Number.isFinite(t) ? t : 0;
    }

    private sortAllocationsBySubmittedAt(allocations: any[], ascending = true): any[] {
        const dir = ascending ? 1 : -1;
        return [...allocations].sort((a, b) => {
            const ta = this.getProposalSubmittedTime(a);
            const tb = this.getProposalSubmittedTime(b);
            if (ta !== tb) {
                return (ta - tb) * dir;
            }
            return (a.proposal?.projectTitle || '').localeCompare(
                b.proposal?.projectTitle || '',
                undefined,
                { sensitivity: 'base' }
            );
        });
    }

    private compareSetupAllocations(a: any, b: any): number {
        const col = this.setupSortActive || 'createdOn';
        const dir = this.setupSortDirection === 'asc' ? 1 : -1;
        let cmp = 0;
        switch (col) {
            case 'projectTitle':
                cmp = (a.proposal?.projectTitle || '').localeCompare(
                    b.proposal?.projectTitle || '',
                    undefined,
                    { sensitivity: 'base' }
                );
                break;
            case 'organization':
                cmp = (a.organization?.name || '').localeCompare(
                    b.organization?.name || '',
                    undefined,
                    { sensitivity: 'base' }
                );
                break;
            case 'sponsor':
                cmp = this.sponsorSortKey(a).localeCompare(this.sponsorSortKey(b), undefined, {
                    sensitivity: 'base',
                });
                break;
            case 'createdOn':
                cmp = this.getProposalSubmittedTime(a) - this.getProposalSubmittedTime(b);
                break;
            case 'amountRequested':
                cmp = (Number(a.amountRequested) || 0) - (Number(b.amountRequested) || 0);
                break;
            case 'amountGranted':
                cmp = this.getAllocationValue(a) - this.getAllocationValue(b);
                break;
            default:
                cmp = 0;
        }
        return cmp * dir;
    }

    private buildOrderedAllocations(): any[] {
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

        return this.sortAllocationsBySubmittedAt(this.meeting.allocations, true);
    }

    /** Funded allocations exceed the budget. Allowed; completion just asks for confirmation. */
    get isOverBudget(): boolean {
        return this.remainingBudget < 0;
    }

    completeMeeting(): void {
        if (!this.meeting) return;

        // Over budget: allowed, but confirm since allocations exceed the budget.
        if (this.isOverBudget) {
            const ref = this.dialog.open(ConfirmDialogComponent, {
                width: '460px',
                data: {
                    title: 'Complete while over budget?',
                    message: `Allocations are ${this.formatMeetingMoney(-this.remainingBudget)} over the ${this.formatMeetingMoney(this.budgetForDisplay())} budget. Complete the meeting anyway?`,
                    confirmText: 'Complete meeting',
                    cancelText: 'Keep editing',
                    warn: true,
                },
            });
            ref.afterClosed().subscribe((confirmed) => {
                if (confirmed) {
                    this.executeCompleteMeeting();
                }
            });
            return;
        }

        // Under budget: allowed, but confirm since there's money left unallocated.
        if (this.remainingBudget > 0) {
            const ref = this.dialog.open(ConfirmDialogComponent, {
                width: '460px',
                data: {
                    title: 'Complete with unallocated budget?',
                    message: `You have ${this.formatMeetingMoney(this.remainingBudget)} of the ${this.formatMeetingMoney(this.budgetForDisplay())} budget still unallocated. Complete the meeting anyway? Proposals with no grant will be moved to set aside.`,
                    confirmText: 'Complete meeting',
                    cancelText: 'Keep editing',
                    warn: false,
                },
            });
            ref.afterClosed().subscribe((confirmed) => {
                if (confirmed) {
                    this.executeCompleteMeeting();
                }
            });
            return;
        }

        this.executeCompleteMeeting();
    }

    private executeCompleteMeeting(): void {
        if (!this.meeting) return;

        this.persistPendingAllocationsIfAny()
            .pipe(
                switchMap((meeting) => {
                    if (meeting) {
                        this.applyAllocationSaveResponse(meeting, { showSavedFlash: false });
                    }
                    const b = Number(this.totalBudget);
                    if (
                        Number.isFinite(b) &&
                        b !== Number(this.meeting.totalBudget)
                    ) {
                        return this.meetingService
                            .updateMeeting(this.meeting._id, { totalBudget: b })
                            .pipe(
                                tap((updated) => {
                                    this.meeting = updated;
                                    this.totalBudget = updated.totalBudget;
                                })
                            );
                    }
                    return of(null);
                }),
                switchMap(() => this.meetingService.completeMeeting(this.meeting._id))
            )
            .subscribe({
                next: (meeting) => {
                    this.meeting = meeting;
                    this.editingInProgressBudget = false;
                    this.recalcTotals();
                    this.loadSummary(meeting._id);
                    this.snackBar.open(
                        'Meeting completed. Unfunded proposals were moved to set aside.',
                        'Close',
                        { duration: 6000 }
                    );
                    this._changeDetectorRef.markForCheck();
                },
                error: (err) => {
                    const msg = err.error?.message || 'Error completing meeting';
                    this.snackBar.open(msg, 'Close', { duration: 5000 });
                },
            });
    }

    startInProgressBudgetEdit(): void {
        this.editingInProgressBudget = true;
        this._changeDetectorRef.markForCheck();
    }

    finishInProgressBudgetEdit(): void {
        if (!this.meeting?._id) {
            return;
        }

        const close = () => {
            this.editingInProgressBudget = false;
            this.recalcTotals();
            this._changeDetectorRef.markForCheck();
        };

        this.setupBudgetNotesSaving = true;
        this.persistSetupBudgetAndNotesIfChanged()
            .pipe(
                finalize(() => {
                    this.setupBudgetNotesSaving = false;
                    this._changeDetectorRef.markForCheck();
                })
            )
            .subscribe({
                next: (meeting) => {
                    if (meeting) {
                        this.meeting = meeting;
                        this.totalBudget = meeting.totalBudget;
                        this.flashSetupBudgetNotesSaved();
                    } else {
                        this.totalBudget = this.meeting.totalBudget;
                    }
                },
                complete: () => close(),
                error: (err) => {
                    const msg = err.error?.message || 'Error saving budget';
                    this.snackBar.open(msg, 'Close', { duration: 5000 });
                },
            });
    }

    startCompletedEdit(): void {
        this.editingCompletedMeeting = true;
        this.syncDisplayAllocations();
        this.maybeSyncEligibleProposals();
    }

    finishCompletedEdit(): void {
        if (!this.meeting?._id) {
            return;
        }

        const hadPendingEdits = this.pendingAllocations.size > 0;
        this.persistPendingAllocationsIfAny(true).subscribe({
            next: (saved) => {
                if (saved) {
                    this.applyAllocationSaveResponse(saved, {
                        showSavedFlash: false,
                        suppressToast: true,
                    });
                }
                const stillPending = this.pendingAllocations.size > 0;
                this.editingCompletedMeeting = false;
                this.clearAllocationSelections();
                this.refreshSummaryIfCompleted();
                if (stillPending) {
                    this.snackBar.open(
                        'Some changes could not be saved. Please try again.',
                        'Close',
                        { duration: 6000 }
                    );
                } else if (hadPendingEdits) {
                    this.snackBar.open('Changes saved', 'Close', { duration: 3000 });
                }
                this._changeDetectorRef.markForCheck();
            },
            error: () => {
                this.snackBar.open('Could not save pending changes before closing edit', 'Close', {
                    duration: 5000
                });
            },
        });
    }

    cancelCompletedEdit(): void {
        if (!this.meeting?._id) {
            return;
        }

        const meetingId = this.meeting._id;
        this.editingCompletedMeeting = false;
        this.pendingAllocations.clear();
        this.allocationAmountDrafts.clear();
        this.hasUnsavedChanges = false;
        this.clearAllocationsSavedTimer();
        this.allocationsSavedFlash = false;
        this.allocationsSaving = false;
        this.clearAllocationSelections();
        this.proposalsTableLoading = true;
        this._changeDetectorRef.markForCheck();

        this.meetingService.getMeeting(meetingId).subscribe({
            next: (meeting) => {
                this.applyMeetingResponse(meeting);
                this.loadSummary(meetingId);
                this.proposalsTableLoading = false;
                this._changeDetectorRef.markForCheck();
            },
            error: () => {
                this.proposalsTableLoading = false;
                this.snackBar.open('Could not reload meeting', 'Close', { duration: 5000 });
                this._changeDetectorRef.markForCheck();
            },
        });
    }

    /** Collapsible set-aside block (setup / in progress only). */
    showCollapsibleSetAsideSection(): boolean {
        if (!this.canManageAllocationLists()) {
            return false;
        }
        return !(this.meeting?.status === 'completed' && this.editingCompletedMeeting);
    }

    /** Always-visible set-aside list when editing a completed meeting. */
    showCompletedEditSetAsideSection(): boolean {
        return !!(
            this.meeting?.status === 'completed' &&
            this.editingCompletedMeeting &&
            this.displayAllocationsSetAside.length > 0
        );
    }

    private recalcTotals(): void {
        const cap = this.budgetForDisplay();
        if (!this.meeting?.allocations?.length) {
            this.totalAllocated = 0;
            this.remainingBudget = cap - 0;
            this.syncDisplayAllocations();
            this.refreshSetupTableColumns();
            return;
        }
        let total = 0;
        for (const alloc of this.meeting.allocations) {
            if (!this.allocationIsActive(alloc)) {
                continue;
            }
            total += this.effectiveAllocationAmountForTotals(alloc);
        }
        this.totalAllocated = total;
        this.remainingBudget = cap - this.totalAllocated;
        this.syncDisplayAllocations();
        this.refreshSetupTableColumns();
    }

    /**
     * Stat cards and remaining budget use the in-form budget value while it is being edited
     * (setup, in progress, or president editing a completed meeting).
     */
    budgetForDisplay(): number {
        if (!this.meeting) {
            return 0;
        }
        if (this.usesEditableBudgetDraft()) {
            const n = Number(this.totalBudget);
            return Number.isFinite(n) ? n : 0;
        }
        return this.meeting.totalBudget ?? 0;
    }

    private usesEditableBudgetDraft(): boolean {
        if (!this.meeting) {
            return false;
        }
        if (this.meeting.status === 'setup') {
            return true;
        }
        if (this.meeting.status === 'in_progress') {
            return this.editingInProgressBudget;
        }
        return this.meeting.status === 'completed' && this.editingCompletedMeeting;
    }

    /** Keeps Remaining / progress bar in sync while typing budget during setup. */
    onSetupTotalBudgetChange(): void {
        this.onBudgetUserChange();
    }

    getUserName(user: any): string {
        if (!user) return '';
        if (user.firstName || user.lastName) {
            return [user.firstName, user.lastName].filter(Boolean).join(' ');
        }
        return user.email || '';
    }

    /** Last total budget before the current value (from audit log, with legacy fallback). */
    previousBudgetAmount(): number | null {
        if (!this.meeting) {
            return null;
        }
        const events = [...(this.meeting.events || [])]
            .filter((e) => e?.type === 'budget_changed')
            .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
        if (events.length > 0) {
            const last = events[0];
            const current = Number(this.meeting.totalBudget);
            if (Number.isFinite(last.toBudget) && last.toBudget === current) {
                const prev = Number(last.fromBudget);
                return Number.isFinite(prev) ? prev : null;
            }
        }
        const original = Number(this.meeting.originalBudget);
        const current = Number(this.meeting.totalBudget);
        if (Number.isFinite(original) && original !== current && original > 0) {
            return original;
        }
        return null;
    }

    meetingHistoryEvents(): any[] {
        return [...(this.meeting?.events || [])].sort(
            (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
        );
    }

    meetingEventUserLabel(user: any): string {
        const name = this.getUserName(user);
        return name || user?.email || 'Unknown';
    }

    meetingEventSummary(event: any): string {
        switch (event?.type) {
            case 'budget_changed':
                return `Total budget ${this.formatMeetingMoney(event.fromBudget)} → ${this.formatMeetingMoney(event.toBudget)}`;
            case 'grant_changed':
                return `Grant for “${event.proposalTitle || 'Untitled'}” ${this.formatMeetingMoney(event.fromAmount)} → ${this.formatMeetingMoney(event.toAmount)}`;
            case 'set_aside': {
                const grant = Number(event.fromAmount) || 0;
                const label = `“${event.proposalTitle || 'Untitled'}” set aside`;
                return grant > 0 ? `${label} (grant was ${this.formatMeetingMoney(grant)})` : label;
            }
            case 'restored':
                return `“${event.proposalTitle || 'Untitled'}” restored to consideration`;
            default:
                return 'Change recorded';
        }
    }

    private formatMeetingMoney(value: number | undefined | null): string {
        const n = Number(value);
        if (!Number.isFinite(n)) {
            return '$0';
        }
        return n.toLocaleString(undefined, {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        });
    }

    getStatusLabel(status: string): string {
        return meetingStatusLabel(status);
    }

    /** Count of grant notification emails already sent for this meeting (null = not yet checked). */
    grantEmailsSentCount: number | null = null;

    /** Number of funded proposals eligible for a grant notification. */
    get fundedProposalCount(): number {
        if ((this.summary?.totals?.fundedCount ?? 0) > 0) {
            return this.summary.totals.fundedCount;
        }
        if ((this.summary?.funded?.length ?? 0) > 0) {
            return this.summary.funded.length;
        }
        if (!this.meeting?.allocations?.length) {
            return 0;
        }
        return this.meeting.allocations.filter(
            (alloc: any) => alloc?.activeInMeeting !== false && (alloc.amountGranted ?? 0) > 0
        ).length;
    }

    get hasSentGrantEmails(): boolean {
        return (this.grantEmailsSentCount ?? 0) > 0;
    }

    /** Short label describing grant-email progress for the completed meeting header. */
    get grantEmailStatusLabel(): string {
        const sent = this.grantEmailsSentCount ?? 0;
        if (sent === 0) {
            return 'No grant emails sent';
        }
        return sent === 1 ? '1 grant email sent' : `${sent} grant emails sent`;
    }

    /** Pull the count of grant notifications sent so the meeting header can reflect it. */
    private loadGrantEmailStatus(id: string): void {
        this.outboundEmailService.getMeetingGrantEmails(id, 1, 1).subscribe({
            next: (res) => {
                this.grantEmailsSentCount = typeof res?.total === 'number' ? res.total : 0;
                this._changeDetectorRef.markForCheck();
            },
            error: () => {
                this.grantEmailsSentCount = null;
                this._changeDetectorRef.markForCheck();
            },
        });
    }

    /** At least one active allocation with a grant — controls After meeting link. */
    hasFundedProposals(): boolean {
        if ((this.summary?.totals?.fundedCount ?? 0) > 0) {
            return true;
        }
        if ((this.summary?.funded?.length ?? 0) > 0) {
            return true;
        }
        if (!this.meeting?.allocations?.length) {
            return false;
        }
        return this.meeting.allocations.some((alloc: any) => {
            if (alloc?.activeInMeeting === false) {
                return false;
            }
            return (alloc.amountGranted ?? 0) > 0;
        });
    }

    goToProposal(proposalID: string): void {
        this.router.navigate(['/pages/proposal/', proposalID], {
            queryParams: { from: 'meeting', meetingId: this.meeting._id }
        });
    }

    goToOrganization(orgID: string): void {
        this.router.navigate(['/pages/organization/', orgID], {
            queryParams: { from: 'meeting', meetingId: this.meeting._id },
        });
    }

    isAllocationActiveTogglePending(row: any): boolean {
        return row?._id != null && this.allocationActiveToggleInFlight.has(String(row._id));
    }

    canMultiselectAllocations(): boolean {
        return this.isPresidentOrAdmin && this.canManageAllocationLists();
    }

    /** Setup, in progress, or president editing a completed meeting. */
    canManageAllocationLists(): boolean {
        if (!this.isPresidentOrAdmin || !this.meeting) {
            return false;
        }
        if (this.meeting.status === 'setup' || this.meeting.status === 'in_progress') {
            return true;
        }
        return this.meeting.status === 'completed' && this.editingCompletedMeeting;
    }

    get activeSelectionCount(): number {
        return this.selectedActiveAllocationIds.size;
    }

    get setAsideSelectionCount(): number {
        return this.selectedSetAsideAllocationIds.size;
    }

    get showSelectionOverlay(): boolean {
        return (
            this.canMultiselectAllocations() &&
            (this.activeSelectionCount > 0 || this.setAsideSelectionCount > 0)
        );
    }

    get topStickyBarVisible(): boolean {
        return this.statsStickyVisible || this.showSelectionOverlay;
    }

    get activeSelectionOverlayMessage(): string {
        const n = this.activeSelectionCount;
        if (n === 1) {
            return 'You are moving 1 proposal to set aside.';
        }
        return `You are moving ${n} proposals to set aside.`;
    }

    get setAsideSelectionOverlayMessage(): string {
        const n = this.setAsideSelectionCount;
        if (n === 1) {
            return 'You are moving 1 proposal back to consideration.';
        }
        return `You are moving ${n} proposals back to consideration.`;
    }

    private allocationRowId(row: any): string {
        return String(row._id);
    }

    isActiveAllocationSelected(row: any): boolean {
        return this.selectedActiveAllocationIds.has(this.allocationRowId(row));
    }

    isSetAsideAllocationSelected(row: any): boolean {
        return this.selectedSetAsideAllocationIds.has(this.allocationRowId(row));
    }

    toggleActiveAllocationSelection(row: any, checked: boolean): void {
        const id = this.allocationRowId(row);
        if (checked) {
            this.selectedActiveAllocationIds.add(id);
        } else {
            this.selectedActiveAllocationIds.delete(id);
        }
        this._changeDetectorRef.markForCheck();
    }

    toggleSetAsideAllocationSelection(row: any, checked: boolean): void {
        const id = this.allocationRowId(row);
        if (checked) {
            this.selectedSetAsideAllocationIds.add(id);
        } else {
            this.selectedSetAsideAllocationIds.delete(id);
        }
        this._changeDetectorRef.markForCheck();
    }

    isAllActiveAllocationsSelected(rows: any[]): boolean {
        const selectable = this.selectableActiveAllocations(rows);
        return selectable.length > 0 && selectable.every((row) => this.isActiveAllocationSelected(row));
    }

    isSomeActiveAllocationsSelected(rows: any[]): boolean {
        const selectable = this.selectableActiveAllocations(rows);
        const selected = selectable.filter((row) => this.isActiveAllocationSelected(row)).length;
        return selected > 0 && selected < selectable.length;
    }

    toggleAllActiveAllocationsSelection(rows: any[], checked: boolean): void {
        const selectable = this.selectableActiveAllocations(rows);
        if (checked) {
            selectable.forEach((row) => this.selectedActiveAllocationIds.add(this.allocationRowId(row)));
        } else {
            selectable.forEach((row) => this.selectedActiveAllocationIds.delete(this.allocationRowId(row)));
        }
        this._changeDetectorRef.markForCheck();
    }

    isAllSetAsideAllocationsSelected(rows: any[]): boolean {
        const selectable = this.selectableSetAsideAllocations(rows);
        return selectable.length > 0 && selectable.every((row) => this.isSetAsideAllocationSelected(row));
    }

    isSomeSetAsideAllocationsSelected(rows: any[]): boolean {
        const selectable = this.selectableSetAsideAllocations(rows);
        const selected = selectable.filter((row) => this.isSetAsideAllocationSelected(row)).length;
        return selected > 0 && selected < selectable.length;
    }

    toggleAllSetAsideAllocationsSelection(rows: any[], checked: boolean): void {
        const selectable = this.selectableSetAsideAllocations(rows);
        if (checked) {
            selectable.forEach((row) => this.selectedSetAsideAllocationIds.add(this.allocationRowId(row)));
        } else {
            selectable.forEach((row) => this.selectedSetAsideAllocationIds.delete(this.allocationRowId(row)));
        }
        this._changeDetectorRef.markForCheck();
    }

    clearActiveAllocationSelection(): void {
        this.selectedActiveAllocationIds.clear();
        this._changeDetectorRef.markForCheck();
    }

    clearSetAsideAllocationSelection(): void {
        this.selectedSetAsideAllocationIds.clear();
        this._changeDetectorRef.markForCheck();
    }

    private clearAllocationSelections(): void {
        this.selectedActiveAllocationIds.clear();
        this.selectedSetAsideAllocationIds.clear();
    }

    private pruneAllocationSelections(): void {
        const activeIds = new Set(this.displayAllocations.map((a) => this.allocationRowId(a)));
        const setAsideIds = new Set(this.displayAllocationsSetAside.map((a) => this.allocationRowId(a)));
        for (const id of [...this.selectedActiveAllocationIds]) {
            if (!activeIds.has(id)) {
                this.selectedActiveAllocationIds.delete(id);
            }
        }
        for (const id of [...this.selectedSetAsideAllocationIds]) {
            if (!setAsideIds.has(id)) {
                this.selectedSetAsideAllocationIds.delete(id);
            }
        }
    }

    private selectableActiveAllocations(rows: any[]): any[] {
        return (rows || []).filter(
            (row) =>
                this.allocationIsActive(row) &&
                !this.isAllocationActiveTogglePending(row)
        );
    }

    private selectableSetAsideAllocations(rows: any[]): any[] {
        return (rows || []).filter(
            (row) =>
                !this.allocationIsActive(row) &&
                !this.isAllocationActiveTogglePending(row)
        );
    }

    private selectedActiveAllocations(): any[] {
        return this.displayAllocations.filter((row) =>
            this.selectedActiveAllocationIds.has(this.allocationRowId(row))
        );
    }

    private selectedSetAsideAllocations(): any[] {
        return this.displayAllocationsSetAside.filter((row) =>
            this.selectedSetAsideAllocationIds.has(this.allocationRowId(row))
        );
    }

    setAsideSelectedActiveAllocations(): void {
        const allocations = this.selectedActiveAllocations();
        if (!allocations.length) {
            return;
        }
        this.confirmBulkSetAside(allocations);
    }

    /** During setup, set-aside/restore are local drafts applied to the server only at start. */
    private isSetupPlanningMode(): boolean {
        return this.meeting?.status === 'setup' && this.isPresidentOrAdmin;
    }

    /**
     * Apply a set-aside (active=false) / restore (active=true) locally as a setup draft,
     * without touching the server. Updates selections, totals and the persisted draft.
     */
    private applyLocalBulkActive(ids: string[], active: boolean): void {
        ids.forEach((rawId) => {
            const id = String(rawId);
            if (active) {
                this.applyLocalActiveInMeeting(id, true);
                this.setupSetAsideDraftIds.delete(id);
                this.selectedSetAsideAllocationIds.delete(id);
            } else {
                this.applyLocalSetAside(id);
                this.setupSetAsideDraftIds.add(id);
                this.selectedActiveAllocationIds.delete(id);
            }
        });
        this.hasUnsavedChanges = this.pendingAllocations.size > 0;
        this.persistSetAsideDraft();
        this.recalcTotals();
        this._changeDetectorRef.markForCheck();
    }

    private setAsideDraftStorageKey(meetingId?: string): string | null {
        const id = meetingId ?? this.meeting?._id;
        return id ? `meeting-detail-set-aside:${id}` : null;
    }

    /** Persist the setup set-aside draft so a refresh keeps the planning work. */
    private persistSetAsideDraft(): void {
        if (!this.isSetupPlanningMode()) {
            return;
        }
        const key = this.setAsideDraftStorageKey();
        if (!key) {
            return;
        }
        try {
            const ids = [...this.setupSetAsideDraftIds];
            if (!ids.length) {
                sessionStorage.removeItem(key);
                return;
            }
            sessionStorage.setItem(key, JSON.stringify(ids));
        } catch {
            // storage unavailable; draft stays in memory only
        }
    }

    /** Re-apply the setup set-aside draft after a fresh meeting payload load. */
    private restoreSetAsideDraft(): void {
        if (!this.isSetupPlanningMode()) {
            return;
        }
        const key = this.setAsideDraftStorageKey();
        if (!key) {
            return;
        }
        let parsed: string[] | null = null;
        try {
            const raw = sessionStorage.getItem(key);
            parsed = raw ? JSON.parse(raw) : null;
        } catch {
            return;
        }
        if (!Array.isArray(parsed) || !parsed.length) {
            return;
        }
        const validIds = new Set((this.meeting?.allocations || []).map((a: any) => String(a._id)));
        let restored = 0;
        for (const rawId of parsed) {
            const id = String(rawId);
            if (validIds.has(id)) {
                this.applyLocalSetAside(id);
                this.setupSetAsideDraftIds.add(id);
                restored += 1;
            }
        }
        if (restored > 0) {
            this.recalcTotals();
            this._changeDetectorRef.markForCheck();
        }
    }

    /** In-consideration proposals that are NOT selected (would be set aside via "keep selected"). */
    private unselectedActiveAllocations(): any[] {
        return this.displayAllocations.filter(
            (row) =>
                this.allocationIsActive(row) &&
                !this.selectedActiveAllocationIds.has(this.allocationRowId(row))
        );
    }

    /** How many proposals would be set aside if the president keeps only the selected ones. */
    get keepSelectedSetAsideCount(): number {
        return this.unselectedActiveAllocations().length;
    }

    /**
     * Invert the selection: keep the currently selected proposals in consideration and
     * set aside everything else that's still active.
     */
    keepSelectedActiveAllocations(): void {
        const toSetAside = this.unselectedActiveAllocations();
        if (!toSetAside.length) {
            return;
        }
        this.confirmKeepSelected(toSetAside, this.activeSelectionCount);
    }

    private confirmKeepSelected(allocations: any[], keepCount: number): void {
        if (!this.meeting || !allocations.length) {
            return;
        }
        const count = allocations.length;
        const keepLabel = keepCount === 1 ? '1 proposal' : `${keepCount} proposals`;
        const asideLabel =
            count === 1
                ? `“${this.allocationProposalTitle(allocations[0])}”`
                : `the other ${count} proposals`;
        const message =
            count === 1
                ? `Keep ${keepLabel} in consideration and set aside ${asideLabel}? Its grant amount will be set to $0 and it won’t count toward budget usage.`
                : `Keep ${keepLabel} in consideration and set aside ${asideLabel}? Their grant amounts will be set to $0 and they won’t count toward budget usage.`;
        const ref = this.dialog.open(ConfirmDialogComponent, {
            width: '460px',
            data: {
                title:
                    count === 1
                        ? 'Set aside 1 proposal?'
                        : `Set aside ${count} proposals?`,
                message,
                confirmText: 'Set aside the rest',
                cancelText: 'Cancel',
                warn: false,
            },
        });
        ref.afterClosed().subscribe((confirmed) => {
            if (confirmed) {
                this.executeBulkSetAside(allocations);
                // The kept proposals stay checked otherwise; clear them now that the rest are set aside.
                this.clearActiveAllocationSelection();
            }
        });
    }

    restoreSelectedSetAsideAllocations(): void {
        const allocations = this.selectedSetAsideAllocations();
        if (!allocations.length) {
            return;
        }
        this.confirmBulkRestore(allocations);
    }

    private confirmBulkSetAside(allocations: any[]): void {
        if (!this.meeting || !allocations.length) {
            return;
        }
        const count = allocations.length;
        const message =
            count === 1
                ? `Move “${this.allocationProposalTitle(allocations[0])}” to the set aside list? Its grant amount will be set to $0 and it won’t count toward budget usage.`
                : `Move ${count} proposals to the set aside list? Grant amounts will be set to $0 and they won’t count toward budget usage.`;
        const ref = this.dialog.open(ConfirmDialogComponent, {
            width: '440px',
            data: {
                title: count === 1 ? 'Set aside proposal?' : `Set aside ${count} proposals?`,
                message,
                confirmText: 'Set aside',
                cancelText: 'Cancel',
                warn: false,
            },
        });
        ref.afterClosed().subscribe((confirmed) => {
            if (confirmed) {
                this.executeBulkSetAside(allocations);
            }
        });
    }

    private confirmBulkRestore(allocations: any[]): void {
        if (!this.meeting || !allocations.length) {
            return;
        }
        const count = allocations.length;
        const message =
            count === 1
                ? `Move “${this.allocationProposalTitle(allocations[0])}” back to the main consideration list? It will count toward budget usage again.`
                : `Move ${count} proposals back to the main consideration list? They will count toward budget usage again.`;
        const ref = this.dialog.open(ConfirmDialogComponent, {
            width: '440px',
            data: {
                title: count === 1 ? 'Back to consideration?' : `Back to consideration (${count})?`,
                message,
                confirmText: 'Back to consideration',
                cancelText: 'Cancel',
                warn: false,
            },
        });
        ref.afterClosed().subscribe((confirmed) => {
            if (confirmed) {
                this.executeBulkRestore(allocations);
            }
        });
    }

    private executeBulkSetAside(allocations: any[], options?: { offerUndo?: boolean }): void {
        const pending = allocations.filter((allocation) => {
            const id = this.allocationRowId(allocation);
            return (
                this.allocationIsActive(allocation) &&
                !this.allocationActiveToggleInFlight.has(id)
            );
        });
        if (!pending.length) {
            return;
        }

        const ids = pending.map((a) => this.allocationRowId(a));

        // Setup phase: keep it a local draft, applied to the server only when the meeting starts.
        if (this.isSetupPlanningMode()) {
            this.applyLocalBulkActive(ids, false);
            if (options?.offerUndo !== false) {
                this.offerBulkAllocationUndo(ids, 'setAside');
            }
            return;
        }

        this.bulkAllocationActionInFlight = true;
        this.markSelfAllocationChanges(ids, false);
        pending.forEach((allocation) => {
            const id = this.allocationRowId(allocation);
            this.applyLocalSetAside(id);
            this.selectedActiveAllocationIds.delete(id);
        });
        this.hasUnsavedChanges = this.pendingAllocations.size > 0;
        this.recalcTotals();
        this._changeDetectorRef.markForCheck();

        this.meetingService
            .bulkSetAllocationsActive(this.meeting._id, ids, false)
            .pipe(
                finalize(() => {
                    this.bulkAllocationActionInFlight = false;
                    this.clearActiveAllocationSelection();
                    this._changeDetectorRef.markForCheck();
                })
            )
            .subscribe({
                next: (updated) => {
                    this.meeting = updated;
                    this.reconcileRecentSelfChanges();
                    this.recalcTotals();
                    this.refreshSummaryIfCompleted();
                    if (options?.offerUndo !== false) {
                        this.offerBulkAllocationUndo(ids, 'setAside');
                    }
                },
                error: (err) => {
                    ids.forEach((id) => {
                        this.applyLocalActiveInMeeting(id, true);
                        this.clearSelfAllocationChange(id);
                    });
                    this.recalcTotals();
                    const msg = this.isBackendUnreachable(err)
                        ? 'Could not reach the server. Set-aside changes were not saved.'
                        : err?.error?.message ||
                          (ids.length === 1
                              ? '1 proposal could not be set aside'
                              : `${ids.length} proposals could not be set aside`);
                    this.snackBar.open(msg, 'Close', { duration: 6000 });
                },
            });
    }

    private executeBulkRestore(allocations: any[], options?: { offerUndo?: boolean }): void {
        const pending = allocations.filter((allocation) => {
            const id = this.allocationRowId(allocation);
            return (
                !this.allocationIsActive(allocation) &&
                !this.allocationActiveToggleInFlight.has(id)
            );
        });
        if (!pending.length) {
            return;
        }

        const ids = pending.map((a) => this.allocationRowId(a));

        // Setup phase: keep it a local draft, applied to the server only when the meeting starts.
        if (this.isSetupPlanningMode()) {
            this.applyLocalBulkActive(ids, true);
            if (options?.offerUndo !== false) {
                this.offerBulkAllocationUndo(ids, 'restore');
            }
            return;
        }

        this.bulkAllocationActionInFlight = true;
        this.markSelfAllocationChanges(ids, true);
        pending.forEach((allocation) => {
            const id = this.allocationRowId(allocation);
            this.applyLocalActiveInMeeting(id, true);
            this.selectedSetAsideAllocationIds.delete(id);
        });
        this.recalcTotals();
        this._changeDetectorRef.markForCheck();

        this.meetingService
            .bulkSetAllocationsActive(this.meeting._id, ids, true)
            .pipe(
                finalize(() => {
                    this.bulkAllocationActionInFlight = false;
                    this.clearSetAsideAllocationSelection();
                    this._changeDetectorRef.markForCheck();
                })
            )
            .subscribe({
                next: (updated) => {
                    this.meeting = updated;
                    this.reconcileRecentSelfChanges();
                    this.recalcTotals();
                    this.refreshSummaryIfCompleted();
                    if (options?.offerUndo !== false) {
                        this.offerBulkAllocationUndo(ids, 'restore');
                    }
                },
                error: (err) => {
                    ids.forEach((id) => {
                        this.applyLocalActiveInMeeting(id, false);
                        this.clearSelfAllocationChange(id);
                    });
                    this.recalcTotals();
                    const msg = this.isBackendUnreachable(err)
                        ? 'Could not reach the server. Restore changes were not saved.'
                        : err?.error?.message ||
                          (ids.length === 1
                              ? '1 proposal could not be restored'
                              : `${ids.length} proposals could not be restored`);
                    this.snackBar.open(msg, 'Close', { duration: 6000 });
                },
            });
    }

    private isBackendUnreachable(err: unknown): boolean {
        return err instanceof HttpErrorResponse && err.status === 0;
    }

    private allocationsByIds(ids: string[]): any[] {
        const idSet = new Set(ids.map((id) => String(id)));
        return (this.meeting?.allocations || []).filter((a) => idSet.has(String(a._id)));
    }

    /** Snackbar undo after bulk or single set-aside / restore. */
    private offerBulkAllocationUndo(
        allocationIds: string[],
        action: 'setAside' | 'restore'
    ): void {
        const count = allocationIds.length;
        const message =
            action === 'setAside'
                ? count === 1
                    ? '1 proposal set aside'
                    : `${count} proposals set aside`
                : count === 1
                  ? '1 proposal moved back to consideration'
                  : `${count} proposals moved back to consideration`;

        const ref = this.snackBar.open(message, 'Undo', { duration: 8000 });
        ref.onAction().pipe(take(1)).subscribe(() => {
            const allocations = this.allocationsByIds(allocationIds);
            if (!allocations.length) {
                return;
            }
            if (action === 'setAside') {
                this.executeBulkRestore(allocations, { offerUndo: false });
            } else {
                this.executeBulkSetAside(allocations, { offerUndo: false });
            }
        });
    }

    private applyLocalActiveInMeeting(allocationId: string, active: boolean): void {
        const id = String(allocationId);
        const alloc = this.meeting?.allocations?.find((a: any) => String(a._id) === id);
        if (alloc) {
            alloc.activeInMeeting = active;
        }
    }

    /** Set aside locally: inactive and grant amount cleared (matches server). */
    private applyLocalSetAside(allocationId: string): void {
        const id = String(allocationId);
        const alloc = this.meeting?.allocations?.find((a: any) => String(a._id) === id);
        if (alloc) {
            alloc.activeInMeeting = false;
            alloc.amountGranted = 0;
        }
        this.pendingAllocations.delete(id);
    }

    /**
     * Move proposal to the “Set aside” list (still on the meeting; budget counts only active list).
     * Optimistic UI: lists update immediately; server sync runs in the background.
     */
    setAsideProposalFromMeeting(allocation: any): void {
        if (!this.meeting || !allocation || !this.canManageAllocationLists()) return;

        const title = this.allocationProposalTitle(allocation);
        const ref = this.dialog.open(ConfirmDialogComponent, {
            width: '440px',
            data: {
                title: 'Set aside proposal?',
                message: `Move “${title}” to the set aside list? Its grant amount will be set to $0 and it won’t count toward budget usage.`,
                confirmText: 'Set aside',
                cancelText: 'Cancel',
                warn: false,
            },
        });
        ref.afterClosed().subscribe((confirmed) => {
            if (confirmed) {
                this.executeSetAsideProposalFromMeeting(allocation);
            }
        });
    }

    private executeSetAsideProposalFromMeeting(allocation: any): void {
        const id = String(allocation._id);
        if (this.allocationActiveToggleInFlight.has(id)) {
            return;
        }
        if (!this.allocationIsActive(allocation)) {
            return;
        }

        // Setup phase: keep it a local draft, applied to the server only when the meeting starts.
        if (this.isSetupPlanningMode()) {
            this.applyLocalBulkActive([id], false);
            this.offerBulkAllocationUndo([id], 'setAside');
            return;
        }

        this.allocationActiveToggleInFlight.add(id);
        this.markSelfAllocationChanges([id], false);
        this.applyLocalSetAside(id);
        this.selectedActiveAllocationIds.delete(id);
        this.hasUnsavedChanges = this.pendingAllocations.size > 0;
        this.recalcTotals();
        this._changeDetectorRef.markForCheck();

        this.meetingService
            .removeAllocation(this.meeting._id, allocation._id)
            .pipe(finalize(() => this.clearAllocationActiveToggle(id)))
            .subscribe({
                next: (updated) => {
                    this.meeting = updated;
                    this.recalcTotals();
                    this.refreshSummaryIfCompleted();
                    this.offerBulkAllocationUndo([id], 'setAside');
                },
                error: (err) => {
                    this.applyLocalActiveInMeeting(id, true);
                    this.clearSelfAllocationChange(id);
                    this.recalcTotals();
                    const msg = err.error?.message || 'Could not set proposal aside';
                    this.snackBar.open(msg, 'Close', { duration: 5000 });
                },
            });
    }

    restoreProposalToMeeting(allocation: any): void {
        if (!this.meeting || !allocation || !this.canManageAllocationLists()) return;

        const title = this.allocationProposalTitle(allocation);
        const ref = this.dialog.open(ConfirmDialogComponent, {
            width: '440px',
            data: {
                title: 'Back to consideration?',
                message: `Move “${title}” back to the main consideration list? It will count toward budget usage again.`,
                confirmText: 'Back to consideration',
                cancelText: 'Cancel',
                warn: false,
            },
        });
        ref.afterClosed().subscribe((confirmed) => {
            if (confirmed) {
                this.executeRestoreProposalToMeeting(allocation);
            }
        });
    }

    private executeRestoreProposalToMeeting(allocation: any): void {
        if (!this.meeting || !allocation || !this.canManageAllocationLists()) return;

        const id = String(allocation._id);
        if (this.allocationActiveToggleInFlight.has(id)) {
            return;
        }
        if (this.allocationIsActive(allocation)) {
            return;
        }

        // Setup phase: keep it a local draft, applied to the server only when the meeting starts.
        if (this.isSetupPlanningMode()) {
            this.applyLocalBulkActive([id], true);
            this.offerBulkAllocationUndo([id], 'restore');
            return;
        }

        this.allocationActiveToggleInFlight.add(id);
        this.markSelfAllocationChanges([id], true);
        this.applyLocalActiveInMeeting(id, true);
        this.selectedSetAsideAllocationIds.delete(id);
        this.recalcTotals();
        this._changeDetectorRef.markForCheck();

        this.meetingService
            .setAllocationActive(this.meeting._id, allocation._id, true)
            .pipe(finalize(() => this.clearAllocationActiveToggle(id)))
            .subscribe({
                next: (updated) => {
                    this.meeting = updated;
                    this.recalcTotals();
                    this.refreshSummaryIfCompleted();
                    this.offerBulkAllocationUndo([id], 'restore');
                },
                error: (err) => {
                    this.applyLocalActiveInMeeting(id, false);
                    this.clearSelfAllocationChange(id);
                    this.recalcTotals();
                    const msg = err.error?.message || 'Could not restore proposal';
                    this.snackBar.open(msg, 'Close', { duration: 5000 });
                },
            });
    }

    private allocationProposalTitle(allocation: any): string {
        const title = allocation?.proposal?.projectTitle;
        if (title && String(title).trim()) {
            return String(title).trim();
        }
        return 'this proposal';
    }

    private clearAllocationActiveToggle(id: string): void {
        this.allocationActiveToggleInFlight.delete(id);
        this._changeDetectorRef.markForCheck();
    }

    getActiveColumns(): string[] {
        const cols =
            this.meeting?.status === 'setup'
                ? [...this.setupViewColumns]
                : [...this.displayedColumns];
        if (this.isPresidentOrAdmin) {
            if (this.canManageAllocationLists()) {
                cols.push('actions');
            }
            if (this.canMultiselectAllocations()) {
                cols.unshift('select');
            }
        }
        return cols;
    }

    getSetAsideColumns(): string[] {
        const cols = ['projectTitle', 'organization', 'sponsor', 'createdOn', 'amountRequested'];
        if (this.isPresidentOrAdmin && this.canManageAllocationLists()) {
            if (this.canMultiselectAllocations()) {
                cols.unshift('select');
            }
            cols.push('actions');
        }
        return cols;
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
