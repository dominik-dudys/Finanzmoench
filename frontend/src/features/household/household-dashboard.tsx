import {Copy} from "lucide-react";
import {toast} from "sonner";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/ui-components/ui/card";
import {Button} from "@/ui-components/ui/button";
import {Badge} from "@/ui-components/ui/badge";
import type {Household, HouseholdMember} from "./api";
import {HouseholdDetailsCard} from "./household-details-card";
import {DangerZoneCard} from "./danger-zone-card";

interface Props {
    household: Household;
    members: HouseholdMember[] | undefined;
    myId?: string;
}

export function HouseholdDashboard({household, members, myId}: Props) {
    const copyId = async () => {
        try {
            await navigator.clipboard.writeText(household.household_id);
            toast.success("Haushalts-ID kopiert");
        } catch {
            toast.error("Kopieren nicht möglich – bitte die ID manuell markieren.");
        }
    };

    return (
        <>
            <HouseholdDetailsCard household={household}/>
            <Card>
                <CardHeader>
                    <CardTitle>Mitglieder einladen</CardTitle>
                    <CardDescription>
                        Gib diese ID weiter. Damit kann man unter „Haushalt beitreten“ dazukommen.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-2">
                    <code className="min-w-0 flex-1 truncate rounded-md bg-muted px-2 py-1.5 font-mono text-sm">
                        {household.household_id}
                    </code>
                    <Button type="button" variant="outline" size="sm" onClick={copyId}>
                        <Copy/> Kopieren
                    </Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Mitglieder{members ? ` (${members.length})` : ""}</CardTitle>
                </CardHeader>
                <CardContent>
                    {members && members.length > 0 ? (
                        <ul className="flex flex-col divide-y text-sm">
                            {members.map((m) => (
                                <li key={m.person_id} className="flex items-center gap-2 py-2">
                                    <span className="truncate">{m.first_name} {m.last_name}</span>
                                    {m.person_id === myId && <Badge variant="secondary">du</Badge>}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground">Keine Mitglieder gefunden.</p>
                    )}
                </CardContent>
            </Card>
            <DangerZoneCard householdName={household.name}/>
        </>
    );
}