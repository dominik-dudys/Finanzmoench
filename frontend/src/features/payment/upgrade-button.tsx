import {useState} from "react";
import {Sparkles} from "lucide-react";
import {Button} from "@/ui-components/ui/button";
import {useSubscription} from "./use-subscription";
import {UpgradeDialog} from "./upgrade-dialog";

interface Props {
    label?: string;
    variant?: "default" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg";
    className?: string;
    hideLabelOnMobile?: boolean;
}

export function UpgradeButton({
                                  label = "Premium holen",
                                  variant = "default",
                                  size = "default",
                                  className,
                                  hideLabelOnMobile = false,
                              }: Props) {
    const {data: sub} = useSubscription();
    const [open, setOpen] = useState(false);

    // Erst anzeigen, wenn klar ist, dass jemand Free ist (kein Aufblitzen bei Premium-Nutzern)
    if (!sub || sub.is_premium) return null;

    return (
        <>
            <Button variant={variant} size={size} className={className} aria-label={label} onClick={() => setOpen(true)}>
                {variant !== "link" && <Sparkles/>}
                <span className={hideLabelOnMobile ? "hidden sm:inline" : undefined}>{label}</span>
            </Button>
            <UpgradeDialog open={open} onOpenChange={setOpen}/>
        </>
    );
}