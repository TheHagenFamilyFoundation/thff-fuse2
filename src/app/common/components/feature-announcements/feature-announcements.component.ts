import { ChangeDetectorRef, Component, OnDestroy, OnInit, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from 'app/core/auth/auth.service';
import { FeatureAnnouncement } from 'app/core/announcements/feature-announcements';
import { FeatureAnnouncementService } from 'app/core/services/feature-announcement.service';

@Component({
    standalone: true,
    selector: 'app-feature-announcements',
    imports: [CommonModule, MatButtonModule, MatIconModule],
    templateUrl: './feature-announcements.component.html',
    host: {
        class: 'relative inline-flex',
    },
})
export class FeatureAnnouncementsComponent implements OnInit, OnDestroy {
    @ViewChild('notificationsOrigin') private _origin: MatButton;
    @ViewChild('notificationsPanel') private _panel: TemplateRef<unknown>;

    announcements: FeatureAnnouncement[] = [];
    unreadCount = 0;

    private _overlayRef: OverlayRef | null = null;
    private _seen = new Set<string>();
    private _updates: Subscription | null = null;

    constructor(
        private _announcements: FeatureAnnouncementService,
        private _auth: AuthService,
        private _overlay: Overlay,
        private _viewContainerRef: ViewContainerRef,
        private _router: Router,
        private _changeDetectorRef: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        if (!this._auth.accessToken) {
            return;
        }
        this.load();
        this._updates = this._announcements.updates$.subscribe(() => this.load());
    }

    ngOnDestroy(): void {
        this._updates?.unsubscribe();
        this._overlayRef?.dispose();
    }

    private load(): void {
        this._seen = this._announcements.seenKeys();
        this._announcements.getActive().subscribe({
            next: (items) => {
                this.announcements = items || [];
                this._refreshUnread();
                this._changeDetectorRef.markForCheck();
            },
            error: () => {
                this.announcements = [];
                this.unreadCount = 0;
                this._changeDetectorRef.markForCheck();
            },
        });
    }

    openPanel(): void {
        if (!this._panel || !this._origin) {
            return;
        }
        if (!this._overlayRef) {
            this._overlayRef = this._overlay.create({
                hasBackdrop: true,
                backdropClass: 'fuse-backdrop-on-mobile',
                scrollStrategy: this._overlay.scrollStrategies.block(),
                positionStrategy: this._overlay
                    .position()
                    .flexibleConnectedTo(this._origin._elementRef.nativeElement)
                    .withLockedPosition(true)
                    .withPush(true)
                    .withPositions([
                        {
                            originX: 'end',
                            originY: 'bottom',
                            overlayX: 'end',
                            overlayY: 'top',
                            offsetY: 8,
                        },
                        {
                            originX: 'end',
                            originY: 'top',
                            overlayX: 'end',
                            overlayY: 'bottom',
                            offsetY: -8,
                        },
                    ]),
            });
            this._overlayRef.backdropClick().subscribe(() => this.closePanel());
        }
        if (this._overlayRef.hasAttached()) {
            this.closePanel();
            return;
        }
        this._overlayRef.attach(new TemplatePortal(this._panel, this._viewContainerRef));
        this._announcements.markSeen(this.announcements.map((item) => item.key));
        this._seen = this._announcements.seenKeys();
        this.unreadCount = 0;
        this._changeDetectorRef.markForCheck();
    }

    closePanel(): void {
        this._overlayRef?.detach();
    }

    openAnnouncement(item: FeatureAnnouncement): void {
        this._announcements.markSeen([item.key]);
        this._seen = this._announcements.seenKeys();
        this._refreshUnread();
        this.closePanel();
        if (!item.link) {
            return;
        }
        this._router.navigate([item.link], {
            queryParams: item.queryParams || undefined,
        });
    }

    private _refreshUnread(): void {
        this.unreadCount = this.announcements.filter((item) => !this._seen.has(item.key)).length;
    }
}
