import {useAuth} from "@/features/auth/AuthContext.tsx";
import {Navigate, Outlet} from "react-router";

export function ProtectedRoute(){
    const {state} = useAuth();

    if (state.status === "loading"){
        return(
            <div className="flex min-h-svh w-full items-center justify-center p-6">
                <p>Lädt...</p>
            </div>
        );
    }

    if (state.status !== "authenticated"){
        return <Navigate to="/login" replace/>;
    }
    return <Outlet/>
}