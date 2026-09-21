import {apiClient} from "@/shared/api";
import axios from "axios";

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
    } catch (err: unknown) {
        if (axios.isAxiosError<SessionResponse>(err) && err.response){
            return err.response.data;
        }
        throw err;
    }
}

export async function logout(): Promise<void> {
    try {
        await apiClient.delete("/auth/browser/v1/auth/session");
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401)
            return
        throw error;
    }
}