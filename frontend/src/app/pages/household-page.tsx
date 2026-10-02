import  {useState} from "react";
import {useMyHousehold, useHouseholdMembers} from "@/features/household/use-household.ts";
import {NoHouseholdDashboard} from "@/features/household/no-household-dashboard.tsx";
import {HouseholdDashboard} from "@/features/household/household-dashboard.tsx";
import {CreateHouseholdForm} from "@/features/household/create-household-form.tsx";
import {JoinHouseholdForm} from "@/features/household/join-household-form.tsx";
import {EditHouseholdForm} from "@/features/household/edit-household-form.tsx";

type View = "dashboard" | "create" | "join" | "edit";

export function HouseholdPage() {
    const {data: household, isLoading} = useMyHousehold();
    const {data: members} = useHouseholdMembers(!!household);
    const [view, setView] = useState<View>("dashboard");
    if (isLoading) {
        return <div className="p-6">Lädt...</div>;
    }

    return (
        <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
            {!household && view === "dashboard" && (
                <NoHouseholdDashboard onCreate={() => setView("create")} onJoin={() => setView("join")} />
            )}
            {!household && view === "create" && (
                <CreateHouseholdForm onDone={() => setView("dashboard")} onBack={() => setView("dashboard")} />
            )}
            {!household && view === "join" && (
                <JoinHouseholdForm onDone={() => setView("dashboard")} onBack={() => setView("dashboard")} />
            )}
            {household && view === "dashboard" && (
                <HouseholdDashboard household={household} members={members} onEdit={() => setView("edit")} />
            )}
            {household && view === "edit" && (
                <EditHouseholdForm household={household} onBack={() => setView("dashboard")} />
            )}
        </div>
    );
}