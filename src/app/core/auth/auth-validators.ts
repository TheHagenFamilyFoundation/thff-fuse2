import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Practical email shape check aligned with typical server-side isEmail rules. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidThffEmail(value: unknown): boolean {
    if (value == null || String(value).trim() === '') {
        return false;
    }
    return EMAIL_PATTERN.test(String(value).trim());
}

export const thffEmailValidator: ValidatorFn = (
    control: AbstractControl
): ValidationErrors | null => {
    const value = control.value;
    if (value == null || String(value).trim() === '') {
        return null;
    }

    const trimmed = String(value).trim();
    return EMAIL_PATTERN.test(trimmed) ? null : { email: true };
};

/** Trim, validate, and surface email errors when the field loses focus (e.g. Tab to password). */
export function validateEmailOnBlur(form: FormGroup, field = 'email'): void {
    const control = form.get(field);
    if (!control) {
        return;
    }
    validateEmailControlOnBlur(control);
}

/** Same as validateEmailOnBlur for a standalone FormControl. */
export function validateEmailControlOnBlur(control: AbstractControl): void {
    const trimmed = String(control.value ?? '').trim();
    if (trimmed !== control.value) {
        control.setValue(trimmed, { emitEvent: false });
    }

    control.markAsTouched();
    control.updateValueAndValidity();
}
