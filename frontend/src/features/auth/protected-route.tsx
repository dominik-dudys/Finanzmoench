import {useAuth} from "@/features/auth/useAuth.ts";
import {Navigate, Outlet} from "react-router";
import {PageError} from "@/shared/components/page-error";

export function ProtectedRoute(){
    const {state, refetch} = useAuth();

    if (state.status === "loading"){
        return(
            <div className="flex min-h-svh w-full items-center justify-center p-6">
                <p>Lädt...</p>
            </div>
        );
    }

    if (state.status === "error"){
        return (
            <div className="flex min-h-svh w-full items-center justify-center">
                <PageError
                    centered
                    message="Server nicht erreichbar. Bitte versuche es gleich noch einmal."
                    onRetry={() => refetch()}
                />
            </div>
        );
    }

    if (state.status !== "authenticated"){
        return <Navigate to="/login" replace/>;
    }
    return <Outlet/>
}