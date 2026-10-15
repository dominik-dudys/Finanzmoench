import {useState} from "react";
import {useMyHousehold, useHouseholdMembers} from "@/features/household/use-household.ts";
import {useMe} from "@/features/profile/use-me.ts";
import {NoHouseholdDashboard} from "@/features/household/no-household-dashboard.tsx";
import {HouseholdDashboard} from "@/features/household/household-dashboard.tsx";
import {CreateHouseholdForm} from "@/features/household/create-household-form.tsx";
import {JoinHouseholdForm} from "@/features/household/join-household-form.tsx";
import {MyJoinRequestsCard} from "@/features/household/my-join-requests-card.tsx";


type View = "dashboard" | "create" | "join";

export function HouseholdPage() {
    const {data: household, isLoading} = useMyHousehold();
    const {data: members} = useHouseholdMembers(!!household);
    const {data: me} = useMe();
    const [view, setView] = useState<View>("dashboard");

    if (isLoading) {
        return <div className="p-6">Lädt...</div>;
    }

    return (
        <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
            {!household && view === "dashboard" && (
                <>
                <MyJoinRequestsCard/>
                <NoHouseholdDashboard onCreate={() => setView("create")} onJoin={() => setView("join")}/>
                </>
            )}
            {!household && view === "create" && (
                <CreateHouseholdForm onDone={() => setView("dashboard")} onBack={() => setView("dashboard")}/>
            )}
            {!household && view === "join" && (
                <JoinHouseholdForm onDone={() => setView("dashboard")} onBack={() => setView("dashboard")}/>
            )}
            {household && (
                <HouseholdDashboard household={household} members={members} myId={me?.person_id}/>
            )}
        </div>
    );
}