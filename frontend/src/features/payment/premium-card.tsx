import {useEffect, useRef, useState} from "react";
import {useSearchParams} from "react-router";
import {toast} from "sonner";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/ui-components/ui/card";
import {Button} from "@/ui-components/ui/button";
import {Badge} from "@/ui-components/ui/badge";
import type {SubscriptionStatus} from "./api";
import {useOpenPortal, useStartCheckout, useSubscription} from "./use-subscription";

const ERRORS: Record<string, string> = {
    already_premium: "Du hast bereits Premium.",
    no_subscription: "Es gibt noch kein Abo zum Verwalten.",
    payment_provider_error: "Stripe ist gerade nicht erreichbar. Bitte versuch es später erneut.",
};

function errorText(err: unknown): string {
    const code = (err as {code?: string} | null)?.code;
    return (code && ERRORS[code]) || "Etwas ist schiefgelaufen. Bitte versuch es erneut.";
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("de-DE");
}

function periodText(sub: SubscriptionStatus): string {
    if (!sub.current_period_end) return "Premium ist aktiv.";
    const date = formatDate(sub.current_period_end);
    return sub.cancel_at_period_end
        ? `Gekündigt – Premium läuft noch bis ${date}.`
        : `Verlängert sich automatisch am ${date}.`;
}

export function PremiumCard() {
    const [searchParams, setSearchParams] = useSearchParams();
    const checkout = searchParams.get("checkout");

    // Nach erfolgreicher Zahlung warten, bis der Webhook das Abo aktiviert hat
    const [awaiting] = useState(checkout === "success");
    const [timedOut, setTimedOut] = useState(false);

    const {data: sub, isLoading, isError} = useSubscription(awaiting && !timedOut);
    const startCheckout = useStartCheckout();
    const openPortal = useOpenPortal();

    // Rückkehr von Stripe: Hinweis zeigen, Parameter aus der URL entfernen (nur einmal)
    const handled = useRef(false);
    useEffect(() => {
        if (!checkout || handled.current) return;
        handled.current = true;
        if (checkout === "success") toast.info("Zahlung erfolgreich – Premium wird aktiviert …");
        if (checkout === "cancel") toast("Bezahlung abgebrochen.");
        setSearchParams((params) => {
            params.delete("checkout");
            return params;
        }, {replace: true});
    }, [checkout, setSearchParams]);

    // Nach 30 s nicht mehr abfragen
    useEffect(() => {
        if (!awaiting) return;
        const timer = setTimeout(() => setTimedOut(true), 30_000);
        return () => clearTimeout(timer);
    }, [awaiting]);

    // Erfolgsmeldung, sobald Premium aktiv ist
    const announced = useRef(false);
    useEffect(() => {
        if (awaiting && sub?.is_premium && !announced.current) {
            announced.current = true;
            toast.success("Premium ist jetzt aktiv.");
        }
    }, [awaiting, sub?.is_premium]);

    const actionError = startCheckout.error ?? openPortal.error;

    return (
        <Card id="premium" className="scroll-mt-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    Premium
                    {sub?.is_premium && <Badge>Aktiv</Badge>}
                </CardTitle>
                <CardDescription>
                    Mit Premium kannst du Jeremy bis zu 10 Fragen pro Tag stellen statt 2.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                {isLoading ? (
                    <p className="text-sm text-muted-foreground">Lädt...</p>
                ) : isError || !sub ? (
                    <p className="text-sm text-destructive">Der Abo-Status konnte nicht geladen werden.</p>
                ) : sub.is_premium ? (
                    <>
                        <p className="text-sm">{periodText(sub)}</p>
                        <Button
                            variant="outline"
                            className="self-start"
                            disabled={openPortal.isPending}
                            onClick={() => openPortal.mutate()}
                        >
                            {openPortal.isPending ? "Wird geöffnet..." : "Abo verwalten"}
                        </Button>
                    </>
                ) : (
                    <>
                        {awaiting && !timedOut && (
                            <p className="text-sm text-muted-foreground">Zahlung wird bestätigt …</p>
                        )}
                        {awaiting && timedOut && (
                            <p className="text-sm text-muted-foreground">
                                Die Aktivierung dauert länger als erwartet. Lade die Seite in ein paar Minuten neu.
                            </p>
                        )}
                        <Button
                            className="self-start"
                            disabled={startCheckout.isPending || (awaiting && !timedOut)}
                            onClick={() => startCheckout.mutate()}
                        >
                            {startCheckout.isPending ? "Weiterleitung zu Stripe..." : "Premium holen"}
                        </Button>
                    </>
                )}

                {actionError && <p className="text-sm text-destructive">{errorText(actionError)}</p>}
            </CardContent>
        </Card>
    );
}