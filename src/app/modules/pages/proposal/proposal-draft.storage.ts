/** localStorage key prefix for in-progress proposal composer state (same browser, survives days). */
export const PROPOSAL_DRAFT_PREFIX = 'proposal-draft-';

export const PROPOSAL_DRAFT_VERSION = 1 as const;

/** Stored shape for create-proposal autosave (v1). */
export interface ProposalDraftEnvelope {
    v: typeof PROPOSAL_DRAFT_VERSION;
    /** ISO timestamp — shown on Welcome and for future tooling. */
    savedAt: string;
    /** Organization Mongo `_id` (same as `org` query param on /proposal/create). */
    org: string;
    /** App organization id (query param `orgID`). */
    orgID: string;
    form: Record<string, unknown>;
}

export function proposalDraftStorageKey(orgMongoId: string | undefined | null): string {
    return `${PROPOSAL_DRAFT_PREFIX}${orgMongoId || 'new'}`;
}

export function serializeProposalDraft(envelope: ProposalDraftEnvelope): string {
    return JSON.stringify(envelope);
}

/**
 * Parse raw localStorage JSON — supports v1 envelope or legacy flat form object.
 */
export function parseProposalDraft(raw: string): {
    form: Record<string, unknown>;
    org: string;
    orgID: string;
    savedAt: string | null;
    legacy: boolean;
} {
    const parsed: unknown = JSON.parse(raw);
    if (
        parsed &&
        typeof parsed === 'object' &&
        (parsed as ProposalDraftEnvelope).v === PROPOSAL_DRAFT_VERSION &&
        'form' in parsed &&
        typeof (parsed as ProposalDraftEnvelope).form === 'object' &&
        (parsed as ProposalDraftEnvelope).form !== null
    ) {
        const e = parsed as ProposalDraftEnvelope;
        const form = e.form as Record<string, unknown>;
        return {
            form,
            org: typeof e.org === 'string' ? e.org : '',
            orgID: typeof e.orgID === 'string' ? e.orgID : '',
            savedAt: typeof e.savedAt === 'string' ? e.savedAt : null,
            legacy: false,
        };
    }
    return {
        form: parsed as Record<string, unknown>,
        org: '',
        orgID: '',
        savedAt: null,
        legacy: true,
    };
}

/** True if any proposal field has user-entered content worth surfacing as a draft. */
export function draftFormHasMeaningfulContent(form: Record<string, unknown>): boolean {
    const textKeys = [
        'projectTitle',
        'purpose',
        'goals',
        'narrative',
        'timeTable',
        'itemizedBudget',
    ] as const;
    for (const k of textKeys) {
        const v = form[k];
        if (typeof v === 'string' && v.trim().length > 0) {
            return true;
        }
    }
    if (typeof form.amountRequested === 'number' && form.amountRequested > 0) {
        return true;
    }
    if (typeof form.totalProjectCost === 'number' && form.totalProjectCost > 0) {
        return true;
    }
    return false;
}
