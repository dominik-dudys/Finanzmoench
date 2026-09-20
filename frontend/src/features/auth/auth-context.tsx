import type {AuthState} from "@/features/auth/auth-state.ts";
import type {QueryObserverResult} from "@tanstack/react-query";
import type {SessionResponse} from "@/features/auth/api.ts";
import {createContext} from "react";

export interface AuthContextValue {
    state: AuthState;
    refetch: () => Promise<QueryObserverResult<SessionResponse>>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);