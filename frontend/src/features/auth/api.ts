import {apiClient} from "@/shared/api";

export interface AllauthUser{
    id: number,
    email: string,
    username?: string,
}

interface SessionFlow {
        id: string;
        is_pending?: boolean;
}

export interface SessionResponse {
    status: number;
    data?:{
        user?: AllauthUser;
        flows?: SessionFlow[];
    };
    meta?: {
        is_authenticated: boolean;
    };
}

export async function getSession(): Promise<SessionResponse> {
    try {
        const res = await apiClient.get('/auth/browser/v1/auth/session');
        return res.data;
    } catch (err: any) {
        if (err.response) return err.response.data;
        throw err;
    }
}