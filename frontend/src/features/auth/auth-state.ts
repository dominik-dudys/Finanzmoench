import type {AllauthUser, SessionResponse} from "@/features/auth/api.ts";

export type AuthState =
    | {status: 'loading'}
    | {status: 'anonymous'}
    | {status: 'pending_2fa'}
    | {status: 'pending_verify_email'}
    | {status: 'pending_login_code'}
    | {status: 'authenticated'; user: AllauthUser };

export function toAuthState(session: SessionResponse | undefined, isLoading: boolean): AuthState{
    if (isLoading || !session) return {status: 'loading'};

    const flows = session.data?.flows ?? [];
    const pending = (id: string) => flows.some((f)=>f.id === id && f.is_pending);

    if (pending('mfa_authenticate')){
        return {status: "pending_2fa"};
    }
    if (pending('verify_email')){
        return {status: "pending_verify_email"};
    }
    if (pending('login_by_code')){
        return {status: "pending_login_code"};
    }

    if(session.meta?.is_authenticated && session.data?.user){
        return {status: 'authenticated', user: session.data.user};
    }
    return {status: "anonymous"};
}
