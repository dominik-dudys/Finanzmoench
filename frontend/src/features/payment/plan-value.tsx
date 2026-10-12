import {Check} from "lucide-react";

export function PlanValue({value}: {value: string}) {
    return value === "✓" ? <Check className="size-4"/> : <>{value}</>;
}