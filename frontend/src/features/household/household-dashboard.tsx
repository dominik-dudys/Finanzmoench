import {Card, CardContent, CardHeader, CardTitle} from "@/ui-components/ui/card";
import {Button} from "@/ui-components/ui/button";
import type {Household, HouseholdMember} from "@/features/household/api.ts";

export function HouseholdDashboard({
                                       household,
                                       members,
                                       onEdit,
                                   }: {
    household: Household;
    members: HouseholdMember[] | undefined;
    onEdit: () => void;
}) {
    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>{household.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                    <p className="text-sm text-muted-foreground">
                        {household.address}, {household.postal_code} {household.city}
                    </p>
                    <p className="text-sm text-muted-foreground">Währung: {household.currency}</p>
                    <p className="text-xs text-muted-foreground">
                        Haushalts-ID zum Einladen: <span className="font-mono">{household.household_id}</span>
                    </p>
                    <Button className="mt-2 w-fit" onClick={onEdit}>Bearbeiten</Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Mitglieder</CardTitle>
                </CardHeader>
                <CardContent>
                    {members && members.length > 0 ? (
                        <ul className="flex flex-col gap-1 text-sm">
                            {members.map((m) => (
                                <li key={m.person_id}>
                                    {m.first_name} {m.last_name}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground">Keine Mitglieder gefunden.</p>
                    )}
                </CardContent>
            </Card>
        </>
    );
}