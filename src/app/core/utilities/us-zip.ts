import { ValidatorFn, Validators } from '@angular/forms';

/** US ZIP: 5 digits, or ZIP+4 with optional hyphen (`12345` or `12345-6789`). */
export const US_ZIP_PATTERN = /^\d{5}(-\d{4})?$/;

/** Max length for `12345-6789`. */
export const US_ZIP_MAX_LENGTH = 10;

export function usZipFormValidators(): ValidatorFn[] {
    return [
        Validators.required,
        Validators.maxLength(US_ZIP_MAX_LENGTH),
        Validators.pattern(US_ZIP_PATTERN),
    ];
}

/**
 * Coerce API / legacy values for a text ZIP control (preserves leading zeros when stored as string).
 * Treats numeric `0` or empty as unset.
 */
export function zipFromApiForForm(stored: unknown): string {
    if (stored === null || stored === undefined || stored === '') {
        return '';
    }
    const s = String(stored).trim();
    if (s === '0') {
        return '';
    }
    return s;
}

/** Normalize before save: trim; strip spaces; keep digits and single hyphen for ZIP+4. */
export function normalizeZipForSave(raw: unknown): string {
    const s = String(raw ?? '').trim();
    if (!s) {
        return '';
    }
    const digits = s.replace(/\D/g, '');
    if (digits.length === 9) {
        return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    }
    if (digits.length === 5) {
        return digits;
    }
    return s.replace(/[^\d-]/g, '');
}
