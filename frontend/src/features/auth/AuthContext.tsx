import {type AuthState, toAuthState} from "@/features/auth/auth-state.ts";
import {createContext, type ReactNode, useContext} from "react";
import {type QueryObserverResult, useQuery} from "@tanstack/react-query";
import {getSession, type SessionResponse} from "@/features/auth/api.ts";

interface AuthContextValue {
    state: AuthState;
    refetch: () => Promise<QueryObserverResult<SessionResponse>>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({children}: {children: ReactNode}){
    const {data, isLoading, refetch} = useQuery({
        queryKey: ['auth', 'session'],
        queryFn: getSession,
        staleTime: 5*60*1000,
        retry: false
    });

    return(
    <AuthContext.Provider value={{state: toAuthState(data, isLoading), refetch}}>
        {children}
    </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}