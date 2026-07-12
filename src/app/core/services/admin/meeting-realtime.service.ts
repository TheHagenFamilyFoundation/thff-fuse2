import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../../environments/environment';

/**
 * Thin Socket.IO wrapper for live meeting updates. A single shared connection is
 * lazily created on first use, authenticated with the stored access token, and
 * used to join/leave per-meeting rooms. Emits populated meeting payloads pushed
 * by the backend after any mutation.
 */
@Injectable({ providedIn: 'root' })
export class MeetingRealtimeService {
    private socket: Socket | null = null;
    private joinedMeetingId: string | null = null;

    private readonly meetingUpdates$ = new Subject<any>();
    private readonly connected$ = new BehaviorSubject<boolean>(false);

    constructor(private zone: NgZone) {}

    private ensureSocket(): Socket {
        if (this.socket) {
            return this.socket;
        }

        const token = localStorage.getItem('accessToken') ?? '';
        // Empty socketUrl => connect to same origin (dev proxy forwards /socket.io).
        const url = environment.socketUrl || undefined;

        this.socket = io(url as string, {
            auth: { token },
            // HTTP long-polling first (App Runner has no WebSocket support), then
            // auto-upgrade to WebSocket where available. Matches the server config.
            transports: ['polling', 'websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 8000,
        });

        this.socket.on('connect', () =>
            this.zone.run(() => {
                this.connected$.next(true);
                // Re-join the active room after (re)connect.
                if (this.joinedMeetingId) {
                    this.socket?.emit('meeting:join', this.joinedMeetingId);
                }
            })
        );

        this.socket.on('disconnect', () =>
            this.zone.run(() => this.connected$.next(false))
        );

        this.socket.on('connect_error', () =>
            this.zone.run(() => this.connected$.next(false))
        );

        this.socket.on('meeting:updated', (meeting: any) =>
            this.zone.run(() => this.meetingUpdates$.next(meeting))
        );

        return this.socket;
    }

    /** Stream of populated meeting payloads for the currently joined room. */
    meetingUpdates(): Observable<any> {
        return this.meetingUpdates$.asObservable();
    }

    /** Live connection state (true once the socket handshake succeeds). */
    connected(): Observable<boolean> {
        return this.connected$.asObservable();
    }

    get isConnected(): boolean {
        return this.connected$.value;
    }

    joinMeeting(meetingId: string): void {
        if (!meetingId) {
            return;
        }
        const socket = this.ensureSocket();
        if (this.joinedMeetingId && this.joinedMeetingId !== meetingId) {
            socket.emit('meeting:leave', this.joinedMeetingId);
        }
        this.joinedMeetingId = meetingId;
        if (socket.connected) {
            socket.emit('meeting:join', meetingId);
        }
    }

    leaveMeeting(meetingId: string): void {
        if (this.socket && meetingId) {
            this.socket.emit('meeting:leave', meetingId);
        }
        if (this.joinedMeetingId === meetingId) {
            this.joinedMeetingId = null;
        }
    }
}
