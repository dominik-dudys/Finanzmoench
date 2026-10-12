import {useEffect} from "react";
import {Sparkles} from "lucide-react";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/ui-components/ui/dialog";
import {Button} from "@/ui-components/ui/button";
import {useStartCheckout} from "./use-subscription";
import {paymentErrorText} from "./errors";
import {PLAN_FEATURES, PRICES} from "./plans";
import {PlanValue} from "./plan-value";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UpgradeDialog({open, onOpenChange}: Props) {
    const checkout = useStartCheckout();
    const {reset} = checkout;

    // alten Fehler beim erneuten Öffnen zurücksetzen
    useEffect(() => {
        if (open) reset();
    }, [open, reset]);

    return (
        <Dialog open={open} onOpenChange={(o) => onOpenChange(o)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="size-5"/> Finanzmönch Premium
                    </DialogTitle>
                    <DialogDescription>Mehr Fragen an Jeremy – jederzeit kündbar.</DialogDescription>
                </DialogHeader>

                <div className="overflow-hidden rounded-lg border text-sm">
                    <div className="grid grid-cols-[1fr_6rem_6rem] items-end bg-muted px-3 py-2">
                        <span/>
                        <span className="flex flex-col items-center">
                            <span className="font-medium">Free</span>
                            <span className="text-xs text-muted-foreground">{PRICES.free}</span>
                        </span>
                        <span className="flex flex-col items-center">
                            <span className="font-medium">Premium</span>
                            <span className="text-xs text-muted-foreground">{PRICES.premium}</span>
                        </span>
                    </div>
                    {PLAN_FEATURES.map((f) => (
                        <div key={f.label} className="grid grid-cols-[1fr_6rem_6rem] items-center border-t px-3 py-2">
                            <span>{f.label}</span>
                            <span className="flex justify-center text-muted-foreground">
                                <PlanValue value={f.free}/>
                            </span>
                            <span className="flex justify-center font-medium">
                                <PlanValue value={f.premium}/>
                            </span>
                        </div>
                    ))}
                </div>

                <p className="text-xs text-muted-foreground">
                    Die Bezahlung läuft sicher über Stripe.
                </p>

                {checkout.isError && (
                    <p className="text-sm text-destructive">{paymentErrorText(checkout.error)}</p>
                )}

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Später
                    </Button>
                    <Button type="button" disabled={checkout.isPending} onClick={() => checkout.mutate()}>
                        {checkout.isPending ? "Weiterleitung zu Stripe..." : "Weiter zu Stripe"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}