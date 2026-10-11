import {Sparkles} from "lucide-react";
import {Button} from "@/ui-components/ui/button";
import {useStartCheckout, useSubscription} from "./use-subscription";

interface Props {
    label?: string;
    className?: string;
}

export function UpgradeButton({label = "Premium holen", className}: Props) {
    const {data: sub} = useSubscription();
    const checkout = useStartCheckout();

    if (sub?.is_premium) return null;

    return (
        <Button className={className} disabled={checkout.isPending} onClick={() => checkout.mutate()}>
            <Sparkles/> {checkout.isPending ? "Weiterleitung zu Stripe..." : label}
        </Button>
    );
}