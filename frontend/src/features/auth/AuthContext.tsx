import {type ReactNode} from "react";
import {useQuery} from "@tanstack/react-query";
import {getSession} from "@/features/auth/api.ts";
import {AuthContext} from "@/features/auth/auth-context.tsx";
import {toAuthState, type AuthState} from "@/features/auth/auth-state.ts";

export function AuthProvider({children}: {children: ReactNode}){
    const {data, isLoading, isError, refetch} = useQuery({
        queryKey: ['auth', 'session'],
        queryFn: getSession,
        staleTime: 5*60*1000,
        retry: false
    });

    const state: AuthState = isError && !data ? {status: "error"} : toAuthState(data, isLoading);

    return(
        <AuthContext.Provider value={{state, refetch}}>
            {children}
        </AuthContext.Provider>
    )
}