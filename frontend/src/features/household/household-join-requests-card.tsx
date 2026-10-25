import {toast} from "sonner";
import {Check, X} from "lucide-react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/ui-components/ui/card";
import {Button} from "@/ui-components/ui/button";
import {useHouseholdJoinRequests, useRespondJoinRequest} from "./use-household";

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("de-DE");


function errorText(err: unknown): string {
    return (err as {error?: string} | null)?.error ?? "Das hat nicht geklappt. Bitte versuch es erneut.";
}

export function HouseholdJoinRequestsCard() {
    const {data: requests} = useHouseholdJoinRequests();
    const respond = useRespondJoinRequest();

    // Keine offenen Anfragen -> Karte ausblenden
    if (!requests || requests.length === 0) return null;

    const handle = (requestId: string, approve: boolean) => {
        respond.mutate(
            {requestId, approve},
            {
                onSuccess: (data) => toast.success(data.message),
                onError: (err) => toast.error(errorText(err)),
            },
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Beitrittsanfragen ({requests.length})</CardTitle>
                <CardDescription>Diese Personen möchten eurem Haushalt beitreten.</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="flex flex-col divide-y text-sm">
                    {requests.map((r) => {
                        // Nur die Zeile sperren, die gerade bearbeitet wird
                        const busy = respond.isPending && respond.variables?.requestId === r.request_id;
                        return (
                            <li key={r.request_id} className="flex flex-wrap items-center gap-3 py-3">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium">{r.first_name} {r.last_name}</p>
                                    <p className="truncate text-muted-foreground">
                                        {r.email} · {formatDate(r.created_at)}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" disabled={busy} onClick={() => handle(r.request_id, true)}>
                                        <Check/> Annehmen
                                    </Button>
                                    <Button size="sm" variant="outline" disabled={busy}
                                            onClick={() => handle(r.request_id, false)}>
                                        <X/> Ablehnen
                                    </Button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </CardContent>
        </Card>
    );
}