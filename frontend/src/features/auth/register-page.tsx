import {SignupForm} from "@/ui-components/signup-form.tsx";
import {useAuth} from "@/features/auth/useAuth.ts";
import {Navigate} from "react-router";

export function RegisterPage(){

    const {state} = useAuth();

    if (state.status === "authenticated"){
        return <Navigate to="/dashboard" replace/>
    }

    return(
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-4xl">
                <SignupForm/>
            </div>
        </div>
    )
}