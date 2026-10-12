import {useState} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/ui-components/ui/card";
import {Button} from "@/ui-components/ui/button";
import {ConfirmDialog} from "@/shared/components/confirm-dialog";
import {useDeleteHousehold, useLeaveHousehold} from "./use-household";

type Action = "leave" | "delete" | null;

// Fehlermeldung aus dem Backend holen ({error: "..."}), sonst Standardtext
function errorText(err: unknown): string {
    const message = (err as {error?: string} | null)?.error;
    return message ?? "Das hat nicht geklappt. Bitte versuch es erneut.";
}

export function DangerZoneCard({householdName}: {householdName: string}) {
    const leaveHousehold = useLeaveHousehold();
    const deleteHousehold = useDeleteHousehold();
    const [action, setAction] = useState<Action>(null);

    const open = (next: Action) => {
        leaveHousehold.reset();
        deleteHousehold.reset();
        setAction(next);
    };
    const close = () => setAction(null);

    return (
        <Card className="border-destructive/40">
            <CardHeader>
                <CardTitle>Gefahrenzone</CardTitle>
                <CardDescription>Diese Aktionen lassen sich nicht rückgängig machen.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => open("leave")}>
                    Haushalt verlassen
                </Button>
                <Button variant="destructive" onClick={() => open("delete")}>
                    Haushalt auflösen
                </Button>
            </CardContent>

            {/* ---------- Verlassen ---------- */}
            <ConfirmDialog
                open={action === "leave"}
                onOpenChange={(o) => !o && close()}
                title="Haushalt verlassen?"
                description={
                    <>
                        Du verlässt <strong>„{householdName}“</strong>. Deine Kosten und Einnahmen dort siehst du
                        danach nicht mehr. Zurück kommst du nur, wenn dich jemand erneut einlädt.
                    </>
                }
                confirmLabel="Ja, verlassen"
                pendingLabel="Wird verlassen..."
                destructive
                pending={leaveHousehold.isPending}
                error={leaveHousehold.isError ? errorText(leaveHousehold.error) : null}
                onConfirm={() => leaveHousehold.mutate(undefined, {onSuccess: close})}
            />

            {/* ---------- Auflösen ---------- */}
            <ConfirmDialog
                open={action === "delete"}
                onOpenChange={(o) => !o && close()}
                title="Haushalt wirklich auflösen?"
                description={
                    <>
                        <strong>„{householdName}“</strong> wird für <strong>alle Mitglieder</strong> unwiderruflich
                        gelöscht, inklusive aller Kosten, Einnahmen und Kategorien.
                    </>
                }
                confirmLabel="Ja, endgültig auflösen"
                pendingLabel="Wird aufgelöst..."
                destructive
                pending={deleteHousehold.isPending}
                error={deleteHousehold.isError ? errorText(deleteHousehold.error) : null}
                onConfirm={() => deleteHousehold.mutate(undefined, {onSuccess: close})}
            />
        </Card>
    );
}