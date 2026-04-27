/** Populated org rows from GET /user (org list tables use these fields). */
export interface PopulatedUserOrganizationRow {
    _id?: unknown;
    name?: string;
    createdAt?: string | Date;
    organizationID?: string;
}

/**
 * Collapses duplicate org entries (same `_id`) in populated `user.organizations`.
 * Mongo `$addToSet` prevents new dupes, but older users can still have repeated refs.
 */
export function dedupeUserOrganizations<T>(orgs: T[] | undefined): T[] {
    if (!orgs?.length) {
        return [];
    }
    const seen = new Set<string>();
    const out: T[] = [];
    for (const o of orgs) {
        if (o == null) {
            continue;
        }
        const id =
            typeof o === 'object' && o && '_id' in (o as object)
                ? String((o as unknown as { _id: unknown })._id)
                : null;
        if (!id || id === 'undefined') {
            continue;
        }
        if (seen.has(id)) {
            continue;
        }
        seen.add(id);
        out.push(o);
    }
    return out;
}

/**
 * True if userId appears in org.users from GET /organization (flat users or membership subdocs).
 */
export function isUserInOrgUsers(
    users: unknown[] | undefined,
    userId: string | undefined
): boolean {
    if (!userId || !users?.length) {
        return false;
    }
    const uid = String(userId);
    return users.some((entry: unknown) => {
        if (entry == null) {
            return false;
        }
        const e = entry as { _id?: unknown; user?: unknown };
        if (e._id != null && String(e._id) === uid) {
            return true;
        }
        if (e.user != null) {
            const inner = e.user as { _id?: unknown } | string;
            const innerId =
                typeof inner === 'object' && inner && '_id' in inner
                    ? (inner as { _id: unknown })._id
                    : inner;
            return String(innerId) === uid;
        }
        return false;
    });
}
