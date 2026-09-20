import {useAuth} from "@/features/auth/useAuth.ts";
import {useNavigate} from "react-router";
import {useEffect, useState} from "react";
import {toAuthState} from "@/features/auth/auth-state.ts";

export function LoginCallbackPage(){
    const {refetch} = useAuth();
    const navigate = useNavigate();
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;

        refetch().then((result) => {
            if (cancelled) return;

            if (!result.data) {
                setFailed(true);
                return;
            }

            const state = toAuthState(result.data, false)

            if (state.status === "authenticated"){
                navigate("/dashboard", {replace: true})
            } else if (state.status === "pending_2fa"){
                navigate("/login", {replace: true})
            } else {
                setFailed(true);
            }
        });

        return()=>{
            cancelled = true;
        };

    }, [refetch, navigate]);

    if (failed) {
        return (
            <div className="flex min-h-svh w-full flex-col items-center justify-center gap-4 px-6">
                <p>Die Anmeldung ist fehlgeschlagen.</p>
                <a href="/login" className="unterline">Zurück zum Login</a>
            </div>
        );
    }

    return (
        <div className="flex min-h-svh w-full items-center justify-center px-6">
            <p>Anmeldung wird geprüft...</p>
        </div>
    );
}