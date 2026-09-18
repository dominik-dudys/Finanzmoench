import type {AllauthUser, SessionResponse} from "@/features/auth/api.ts";

export type AuthState =
    | {status: 'loading'}
    | {status: 'anonymous'}
    | {status: 'pending_2fa'}
    | {status: 'authenticated'; user: AllauthUser };

export function toAuthState(session: SessionResponse | undefined, isLoading: boolean): AuthState{
    if (isLoading || !session) return {status: 'loading'};

    const flows = session.data?.flows ?? [];
    const pending2fa = flows.some((f) => f.id === 'mfa_authenticate' && f.is_pending);

    if(pending2fa) return {status: 'pending_2fa'};
    if(session.meta?.is_authentificated && session.data?.user){
        return {status: 'authenticated', user: session.data.user};
    }
    return {status: "anonymous"};
}
