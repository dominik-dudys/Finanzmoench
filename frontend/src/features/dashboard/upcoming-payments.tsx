import {Link} from "react-router";
import {buttonVariants} from "@/ui-components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/ui-components/ui/card";
import {formatMoney} from "@/features/costs/format";
import {relativeDay, type UpcomingPayment} from "./dates";

interface Props {
    items: UpcomingPayment[];
}

export function UpcomingPayments({items}: Props) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle>Nächste Zahlungen</CardTitle>
                <Link to="/cost" className={buttonVariants({variant: "outline", size: "sm"})}>
                    Alle anzeigen
                </Link>
            </CardHeader>
            <CardContent>
                {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Keine anstehenden Zahlungen. Hinterlege bei deinen Kosten ein Startdatum,
                        damit Fälligkeiten berechnet werden können.
                    </p>
                ) : (
                    <ul className="flex flex-col divide-y">
                        {items.map((p) => (
                            <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                                <div className="min-w-0">
                                    <p className="truncate font-medium">{p.name}</p>
                                    <p className="text-muted-foreground">{relativeDay(p.date)}</p>
                                </div>
                                <p className="shrink-0 font-medium">{formatMoney(p.amount)}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}