import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/**
 * Inline autosave feedback (saving spinner, brief saved state, idle hint).
 * Use wherever debounced or background persistence runs (meetings, drafts, etc.).
 */
@Component({
    standalone: true,
    selector: 'app-autosave-status',
    imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
    templateUrl: './autosave-status.component.html',
})
export class AutosaveStatusComponent {
    /** Request in flight */
    @Input() saving = false;
    /** Show success state (parent usually clears after a timeout) */
    @Input() savedFlash = false;
    /** Shown when idle; omit or leave empty to hide */
    @Input() idleHint = '';
    @Input() savingLabel = 'Saving…';
    @Input() savedLabel = 'Saved';
    /** `xs` for form hints; `sm` for header / toolbar style rows */
    @Input() size: 'xs' | 'sm' = 'xs';
}
