import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/ui-components/ui/card";
import {formatMoney} from "@/features/costs/format";
import type {PersonStats} from "./api";

interface Props {
    persons: PersonStats[];
}

export function PersonBreakdown({persons}: Props) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Pro Person</CardTitle>
                <CardDescription>Einkommen, Anteil an den Fixkosten und was übrig bleibt</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="flex flex-col divide-y">
                    {persons.map((p) => {
                        const rest = Number(p.disposable_income);
                        return (
                            <li key={p.person_id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                                <p className="font-medium">{p.first_name}</p>
                                <dl className="grid grid-cols-3 gap-4 text-sm sm:w-96">
                                    <div>
                                        <dt className="text-muted-foreground">Einkommen</dt>
                                        <dd>{formatMoney(p.total_income)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground">Anteil</dt>
                                        <dd>{formatMoney(p.cost_share_amount)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground">Verfügbar</dt>
                                        <dd className={rest < 0 ? "font-medium text-destructive" : "font-medium"}>
                                            {formatMoney(rest)}
                                        </dd>
                                    </div>
                                </dl>
                            </li>
                        );
                    })}
                </ul>
            </CardContent>
        </Card>
    );
}