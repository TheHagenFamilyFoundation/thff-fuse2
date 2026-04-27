/**
 * Display labels for Meeting.status (API values: setup | in_progress | completed).
 */
export function meetingStatusLabel(status: string | undefined | null): string {
    switch (status) {
        case 'setup':
            return 'Planning';
        case 'in_progress':
            return 'In progress';
        case 'completed':
            return 'Awarded';
        default:
            return status ?? '';
    }
}
