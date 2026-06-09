// -----------------------------------------------------------------------------------------------------
// @ AUTH UTILITIES
//
// Methods are derivations of the Auth0 Angular-JWT helper service methods
// https://github.com/auth0/angular2-jwt
// -----------------------------------------------------------------------------------------------------

import { FormGroup } from '@angular/forms';

export class AuthUtils {
    /**
     * Constructor
     */
    constructor() {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Is token expired?
     *
     * @param token
     * @param offsetSeconds
     */
    static isTokenExpired(token: string, offsetSeconds?: number): boolean {
        // Return if there is no token
        if (!token || token === '') {
            return true;
        }

        // Get the expiration date
        const date = this._getTokenExpirationDate(token);

        offsetSeconds = offsetSeconds || 0;

        if (date === null) {
            return true;
        }

        // Check if the token is expired
        return !(date.valueOf() > new Date().valueOf() + offsetSeconds * 1000);
    }

    /**
     * Get the fraction of token lifetime remaining (1.0 = just issued, 0.0 = expired).
     * Returns null if the token can't be decoded or has no exp/iat claims.
     */
    static getTokenLifetimeRemaining(token: string): number | null {
        if (!token || token === '') {
            return null;
        }

        try {
            const decoded = this._decodeToken(token);
            if (!decoded || !decoded.exp || !decoded.iat) {
                return null;
            }

            const now = Math.floor(Date.now() / 1000);
            const totalLifetime = decoded.exp - decoded.iat;
            const remaining = decoded.exp - now;

            if (totalLifetime <= 0) {
                return null;
            }

            return Math.max(0, remaining / totalLifetime);
        } catch {
            return null;
        }
    }

    static isDirector(token: string): boolean {

        // Return if there is no token
        if (!token || token === '') {
            return false;
        }

        const decodedToken = this._decodeToken(token);
        return (decodedToken.accessLevel > 1);

    }

    static isPresident(token: string): boolean {
        if (!token || token === '') {
            return false;
        }

        const decodedToken = this._decodeToken(token);
        return (decodedToken.accessLevel >= 3);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Base64 decoder
     * Credits: https://github.com/atk
     *
     * @param str
     * @private
     */
    private static _b64decode(str: string): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        let output = '';

        str = String(str).replace(/=+$/, '');

        if (str.length % 4 === 1) {
            throw new Error(
                '\'atob\' failed: The string to be decoded is not correctly encoded.'
            );
        }

        /* eslint-disable */
        for (
            // initialize result and counters
            let bc = 0, bs: any, buffer: any, idx = 0;
            // get next character
            (buffer = str.charAt(idx++));
            // character found in table? initialize bit storage and add its ascii value;
            ~buffer &&
                (
                    (bs = bc % 4 ? bs * 64 + buffer : buffer),
                    // and if not first of each 4 characters,
                    // convert the first 8 bits to one ascii character
                    bc++ % 4
                )
                ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
                : 0
        ) {
            // try to find character in table (0-63, not found => -1)
            buffer = chars.indexOf(buffer);
        }
        /* eslint-enable */

        return output;
    }

    /**
     * Base64 unicode decoder
     *
     * @param str
     * @private
     */
    private static _b64DecodeUnicode(str: any): string {
        return decodeURIComponent(
            Array.prototype.map
                .call(this._b64decode(str), (c: any) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
    }

    /**
     * URL Base 64 decoder
     *
     * @param str
     * @private
     */
    private static _urlBase64Decode(str: string): string {
        let output = str.replace(/-/g, '+').replace(/_/g, '/');
        switch (output.length % 4) {
            case 0:
                {
                    break;
                }
            case 2:
                {
                    output += '==';
                    break;
                }
            case 3:
                {
                    output += '=';
                    break;
                }
            default:
                {
                    throw Error('Illegal base64url string!');
                }
        }
        return this._b64DecodeUnicode(output);
    }

    /**
     * Decode token
     *
     * @param token
     * @private
     */
    private static _decodeToken(token: string): any {
        // Return if there is no token
        if (!token) {
            return null;
        }

        // Split the token
        const parts = token.split('.');

        if (parts.length !== 3) {
            throw new Error('The inspected token doesn\'t appear to be a JWT. Check to make sure it has three parts and see https://jwt.io for more.');
        }

        // Decode the token using the Base64 decoder
        const decoded = this._urlBase64Decode(parts[1]);

        if (!decoded) {
            throw new Error('Cannot decode the token.');
        }

        return JSON.parse(decoded);
    }

    /**
     * Get token expiration date
     *
     * @param token
     * @private
     */
    private static _getTokenExpirationDate(token: string): Date | null {
        // Get the decoded token
        const decodedToken = this._decodeToken(token);

        // Return if the decodedToken doesn't have an 'exp' field
        if (!decodedToken.hasOwnProperty('exp')) {
            return null;
        }

        // Convert the expiration date
        const date = new Date(0);
        date.setUTCSeconds(decodedToken.exp);

        return date;
    }

    /**
     * After password login, avoid sending users to public routes that still show a “Sign in” CTA
     * (e.g. redirectURL `/` from the /sign-out guard special-case, or `/home`).
     */
    static normalizePostLoginRedirect(
        raw: string | null | undefined,
        fallback = '/signed-in-redirect'
    ): string {
        if (raw == null || !String(raw).trim()) {
            return fallback;
        }
        const trimmed = String(raw).trim();
        if (
            trimmed.startsWith('http://') ||
            trimmed.startsWith('https://') ||
            trimmed.startsWith('//')
        ) {
            return fallback;
        }
        const pathOnly = (trimmed.match(/^[^?#]*/) ?? [''])[0];
        const normalizedPath = pathOnly.startsWith('/')
            ? pathOnly
            : `/${pathOnly}`;
        if (
            normalizedPath === '/' ||
            normalizedPath === '/home' ||
            normalizedPath === '/sign-out'
        ) {
            return fallback;
        }
        return trimmed;
    }

    /** Validation errors from auth API 422 responses (`{ error: [{ param, msg }] }`). */
    static getValidationErrors(response: any): Array<{ param?: string; msg?: string }> {
        const raw = response?.error?.error;
        return Array.isArray(raw) ? raw : [];
    }

    /** User-facing message for auth form failures (maps generic validator text). */
    static getAuthErrorMessage(response: any, fallback: string): string {
        const errors = this.getValidationErrors(response);
        if (errors.length > 0) {
            const first = errors[0];
            if (first.param === 'email') {
                return 'Please enter a valid email address.';
            }
            if (first.msg && first.msg !== 'Invalid value') {
                return first.msg;
            }
        }

        const message = response?.error?.message;
        if (message && message !== 'Invalid value') {
            return message;
        }

        return fallback;
    }

    /** Highlight invalid fields after a server-side validation error. */
    static applyFieldValidationErrors(form: FormGroup, response: any): void {
        for (const err of this.getValidationErrors(response)) {
            const param = err.param;
            if (!param) {
                continue;
            }

            const control = form.get(param);
            if (!control) {
                continue;
            }

            if (param === 'email') {
                control.setErrors({ email: true });
            } else {
                control.setErrors({ server: true });
            }
            control.markAsTouched();
        }
    }
}
