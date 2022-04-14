export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string; //want to probably remove
    status?: string;
    confirmed?: boolean;
    confirmCode?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    organizations?: any;
    resetCode?: string;
    resetPassword?: boolean;
    resetTime?: any; //TODO: fix
    encryptedPassword?: string;
    accessLevel?: number;
    // 1-user
    // 2-director
    // 3-president
    // 4-admin(Logan)
}
