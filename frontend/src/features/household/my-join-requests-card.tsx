import {useEffect, useRef} from "react";
import {useQueryClient} from "@tanstack/react-query";
import {toast} from "sonner";
import {Clock, XCircle} from "lucide-react";
import {Card, CardContent, CardHeader, CardTitle} from "@/ui-components/ui/card";
import {useMyJoinRequests} from "./use-household";

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("de-DE");

export function MyJoinRequestsCard() {
    const {data: requests} = useMyJoinRequests();
    const queryClient = useQueryClient();
    const pendingIds = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!requests) return;
        const approved = requests.find(
            (r) => r.status === "approved" && pendingIds.current.has(r.request_id),
        );
        pendingIds.current = new Set(
            requests.filter((r) => r.status === "pending").map((r) => r.request_id),
        );
        if (approved) {
            toast.success(`Du bist jetzt Mitglied von „${approved.household_name}“.`);
            void queryClient.invalidateQueries({queryKey: ["household"]});
        }
    }, [requests, queryClient]);

    if (!requests) return null;

    const pending = requests.filter((r) => r.status === "pending");
    const latest = requests[0];
    const rejected = latest?.status === "rejected" ? latest : null;

    if (pending.length === 0 && !rejected) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Beitrittsanfragen</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                {pending.map((r) => (
                    <div key={r.request_id} className="flex items-start gap-2 text-sm">
                        <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground"/>
                        <p>
                            Deine Anfrage an <strong>„{r.household_name}“</strong> vom {formatDate(r.created_at)}{" "}
                            wartet auf Freigabe durch ein Mitglied.
                        </p>
                    </div>
                ))}
                {rejected && (
                    <div className="flex items-start gap-2 text-sm">
                        <XCircle className="mt-0.5 size-4 shrink-0 text-destructive"/>
                        <p>
                            Deine Anfrage an <strong>„{rejected.household_name}“</strong> wurde abgelehnt.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}