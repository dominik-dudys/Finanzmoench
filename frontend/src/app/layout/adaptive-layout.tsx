import {useAuth} from "@/features/auth";
import {DashboardLayout} from "@/app/layout/dashboard-layout.tsx";
import {MarketingLayout} from "@/app/layout/marketing-layout.tsx";

export function AdaptiveLayout() {
    const {state} = useAuth();

    if (state.status === "loading") {
        return null;
    }

    return state.status === "authenticated"
        ? <DashboardLayout/>
        : <MarketingLayout/>;
}