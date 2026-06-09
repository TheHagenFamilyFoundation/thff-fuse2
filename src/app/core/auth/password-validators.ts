import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Matches thff-be validateRegister / validateAuth password rule. */
export const THFF_PASSWORD_PATTERN =
    /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{10,}$/;

export interface ThffPasswordRule {
    id: string;
    label: string;
    test: (password: string) => boolean;
}

export const THFF_PASSWORD_RULES: ThffPasswordRule[] = [
    {
        id: 'length',
        label: 'At least 10 characters',
        test: (password) => password.length >= 10,
    },
    {
        id: 'uppercase',
        label: 'One uppercase letter',
        test: (password) => /[A-Z]/.test(password),
    },
    {
        id: 'lowercase',
        label: 'One lowercase letter',
        test: (password) => /[a-z]/.test(password),
    },
    {
        id: 'number',
        label: 'One number',
        test: (password) => /[0-9]/.test(password),
    },
    {
        id: 'special',
        label: 'One special character (#?!@$%^&*-)',
        test: (password) => /[#?!@$%^&*-]/.test(password),
    },
];

export interface ThffPasswordRuleState extends ThffPasswordRule {
    met: boolean;
}

export function isValidThffPassword(value: unknown): boolean {
    if (value == null || String(value) === '') {
        return false;
    }
    return THFF_PASSWORD_PATTERN.test(String(value));
}

export function getThffPasswordRuleStates(value: unknown): ThffPasswordRuleState[] {
    const password = String(value ?? '');
    return THFF_PASSWORD_RULES.map((rule) => ({
        ...rule,
        met: rule.test(password),
    }));
}

export const thffPasswordValidator: ValidatorFn = (
    control: AbstractControl
): ValidationErrors | null => {
    const value = control.value;
    if (value == null || String(value) === '') {
        return null;
    }

    return isValidThffPassword(value) ? null : { thffPassword: true };
};
