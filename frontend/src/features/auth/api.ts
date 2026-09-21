import {apiClient} from "@/shared/api";

export interface AllauthUser{
    id: number,
    email: string,
    username?: string,
}

export interface AllauthError{
    code: string;
    message: string;
    param?: string;
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
    errors?: AllauthError[];
}

export function isAllauthResponse(e: unknown): e is SessionResponse {
    return typeof e === "object" && e !== null && "status" in e;
}

const AUTH = "auth/browser/v1/auth";

async function post(path: string, body?: unknown): Promise<SessionResponse>{
    try {
        const res = await apiClient.post(`${AUTH}${path}`, body);
        return res.data;
    } catch (err: unknown){
        if (isAllauthResponse(err) && err.status === 401){
            return err;
        }
        throw err;
    }
}

export const signup = (email: string, password: string)=>
    post("/signup", {email, password});

export const verifyEmail = (code: string) =>
    post("/email/verify", {key: code});

export const resendVerificationCode = () =>
    post("/email/verify/resend")

export const login = (email: string, password: string)=>
    post("/login", {email, password});

export const confirmLoginCode = (code: string) =>
    post("/code/confirm", {code});

export const resendLoginCode = () =>
    post("/code/resend");




export async function getSession(): Promise<SessionResponse> {
    try {
        const res = await apiClient.get('/auth/browser/v1/auth/session');
        return res.data;
    } catch (err: unknown) {
        if (isAllauthResponse(err)){
            return err;
        }
        throw err;
    }
}

export async function logout(): Promise<void> {
    try {
        await apiClient.delete("/auth/browser/v1/auth/session");
    } catch (error) {
        if (isAllauthResponse(error) && error.status === 401) return;
            throw error;

    }
}