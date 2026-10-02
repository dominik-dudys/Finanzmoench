import {useAuth} from "@/features/auth";
import {Navigate} from "react-router";
import {ForgotPasswordForm} from "@/ui-components/forgot-password-form.tsx";


export function ForgotPassword(){
    const {state} = useAuth();

    if (state.status === "authenticated"){
        return <Navigate to="/dashboard" replace/>;
    }

    return(
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-md">
                <ForgotPasswordForm/>
            </div>
        </div>
    )
}