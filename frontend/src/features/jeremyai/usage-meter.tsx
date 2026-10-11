import {Link} from "react-router";
import type {AiUsage} from "./api";

export function UsageMeter({usage}: {usage: AiUsage}) {
    const percent = usage.limit > 0 ? Math.min((usage.used / usage.limit) * 100, 100) : 0;

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                    Noch <span className="font-medium text-foreground">{usage.remaining}</span> von {usage.limit} Fragen heute
                </span>
                {usage.plan === "free" && (
                    <Link to="/einstellungen#premium" className="shrink-0 underline">
                        Mehr mit Premium
                    </Link>
                )}
            </div>
            <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-label="Verbrauchte Fragen heute"
                aria-valuemin={0}
                aria-valuemax={usage.limit}
                aria-valuenow={usage.used}
            >
                <div className="h-full rounded-full bg-primary transition-all" style={{width: `${percent}%`}}/>
            </div>
        </div>
    );
}