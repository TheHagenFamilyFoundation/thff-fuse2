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
