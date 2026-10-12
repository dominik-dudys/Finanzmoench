import {Sparkles} from "lucide-react";
import {Badge} from "@/ui-components/ui/badge";

export function PlanBadge({premium}: {premium: boolean}) {
    return premium ? (
        <Badge>
            <Sparkles/> Premium
        </Badge>
    ) : (
        <Badge variant="outline">Free</Badge>
    );
}