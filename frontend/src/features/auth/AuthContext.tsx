import {type ReactNode} from "react";
import {useQuery} from "@tanstack/react-query";
import {getSession} from "@/features/auth/api.ts";
import {AuthContext} from "@/features/auth/auth-context.tsx";
import {toAuthState} from "@/features/auth/auth-state.ts";


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
