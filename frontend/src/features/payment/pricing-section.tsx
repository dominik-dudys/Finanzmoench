import {Link} from "react-router";
import {Check} from "lucide-react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/ui-components/ui/card";
import {Badge} from "@/ui-components/ui/badge";
import {buttonVariants} from "@/ui-components/ui/button";
import {cn} from "@/lib/utils";
import {PLAN_FEATURES, PRICES} from "./plans";
import {useSubscription} from "./use-subscription";
import {UpgradeButton} from "./upgrade-button";
import {setUpgradeIntent} from "./upgrade-intent";

type Plan = "free" | "premium";

function featureList(plan: Plan): string[] {
    return PLAN_FEATURES.flatMap((f) => {
        const value = f[plan];
        if (value === "–") return [];
        return [value === "✓" ? f.label : `${value} ${f.label}`];
    });
}

export function PricingSection({authenticated}: {authenticated: boolean}) {
    const {data: sub} = useSubscription(false, authenticated);
    const isPremium = sub?.is_premium ?? false;

    return (
        <section id="preise" className="scroll-mt-24 py-16">
            <div className="mx-auto max-w-3xl px-6">
                <div className="mx-auto mb-10 max-w-md text-center">
                    <h2 className="text-2xl font-bold">Preise</h2>
                    <p className="mt-2 text-muted-foreground">Starte kostenlos – upgrade, wenn du mehr willst.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* ---------- Free ---------- */}
                    <Card className="flex flex-col">
                        <CardHeader>
                            <CardTitle>Free</CardTitle>
                            <CardDescription className="text-2xl font-bold text-foreground">{PRICES.free}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-1 flex-col gap-6">
                            <ul className="flex flex-1 flex-col gap-2 text-sm">
                                {featureList("free").map((text) => (
                                    <li key={text} className="flex items-start gap-2">
                                        <Check className="mt-0.5 size-4 shrink-0 text-muted-foreground"/>
                                        {text}
                                    </li>
                                ))}
                            </ul>
                            {authenticated ? (
                                <Link to="/dashboard" className={buttonVariants({variant: "outline"})}>
                                    Zum Dashboard
                                </Link>
                            ) : (
                                <Link to="/register" className={buttonVariants({variant: "outline"})}>
                                    Kostenlos starten
                                </Link>
                            )}
                        </CardContent>
                    </Card>

                    {/* ---------- Premium ---------- */}
                    <Card className="flex flex-col border-primary ring-1 ring-primary">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between gap-2">
                                Premium
                                <Badge>Empfohlen</Badge>
                            </CardTitle>
                            <CardDescription className="text-2xl font-bold text-foreground">{PRICES.premium}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-1 flex-col gap-6">
                            <ul className="flex flex-1 flex-col gap-2 text-sm">
                                {featureList("premium").map((text) => (
                                    <li key={text} className="flex items-start gap-2">
                                        <Check className="mt-0.5 size-4 shrink-0 text-primary"/>
                                        {text}
                                    </li>
                                ))}
                            </ul>

                            {!authenticated && (
                                <div className="flex flex-col gap-2">
                                    <Link to="/register" className={buttonVariants()} onClick={setUpgradeIntent}>
                                        Registrieren & upgraden
                                    </Link>
                                    <p className="text-center text-xs text-muted-foreground">
                                        Nach der Registrierung geht's direkt weiter zum Upgrade. Jederzeit kündbar.
                                    </p>
                                </div>
                            )}
                            {authenticated && isPremium && (
                                <p className={cn("rounded-md bg-muted py-2 text-center text-sm font-medium")}>
                                    ✨ Dein aktueller Plan
                                </p>
                            )}
                            {authenticated && !isPremium && <UpgradeButton className="w-full"/>}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
}