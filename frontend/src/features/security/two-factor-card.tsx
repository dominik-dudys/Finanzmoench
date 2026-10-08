import {useState} from "react";
import QRCode from "react-qr-code";
import {REGEXP_ONLY_DIGITS} from "input-otp";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/ui-components/ui/card";
import {Button} from "@/ui-components/ui/button";
import {InputOTP, InputOTPGroup, InputOTPSlot} from "@/ui-components/ui/input-otp";
import {needsReauth} from "./mfa-api";
import {ReauthDialog} from "./reauth-dialog";
import {
    useActivateTotp, useAuthenticators, useDeactivateTotp,
    useLoadRecoveryCodes, useRegenerateRecoveryCodes, useStartTotpSetup,
} from "./use-mfa";
import {useFlag} from "@/features/feature-flags/use-flags.ts";

type Step = "idle" | "setup" | "codes";

export function TwoFactorCard() {
    const {data: authenticators = [], isLoading} = useAuthenticators();
    const totp = authenticators.find((a) => a.type === "totp");
    const recovery = authenticators.find((a) => a.type === "recovery_codes");
    const canSetup = useFlag("two_factor");


    const [step, setStep] = useState<Step>("idle");
    const [code, setCode] = useState("");
    const [codes, setCodes] = useState<string[]>([]);
    const [retry, setRetry] = useState<(() => void) | null>(null);

    const setup = useStartTotpSetup();
    const activate = useActivateTotp();
    const deactivate = useDeactivateTotp();
    const loadCodes = useLoadRecoveryCodes();
    const regenerate = useRegenerateRecoveryCodes();

    /** Führt eine Aktion aus; verlangt allauth eine Passwort-Bestätigung,
     *  öffnet sich der Dialog und die Aktion wird danach wiederholt. */
    function withReauth(run: () => Promise<unknown>) {
        run().catch((err) => {
            if (needsReauth(err)) setRetry(() => () => withReauth(run));
        });
    }

    const startSetup = () =>
        setup.mutate(undefined, {onSuccess: () => setStep("setup")});

    const confirmCode = (value: string) =>
        withReauth(async () => {
            await activate.mutateAsync(value);
            const rc = await loadCodes.mutateAsync(); // werden bei Aktivierung automatisch erzeugt
            setCodes(rc.unused_codes);
            setCode("");
            setStep("codes");
        });

    const newCodes = () =>
        withReauth(async () => {
            const rc = await regenerate.mutateAsync();
            setCodes(rc.unused_codes);
            setStep("codes");
        });

    const disable = () => withReauth(() => deactivate.mutateAsync());

    const copyCodes = () => navigator.clipboard.writeText(codes.join("\n"));

    if (!canSetup && !totp && step === "idle") return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Zwei-Faktor-Authentifizierung</CardTitle>
                <CardDescription>
                    Zusätzlich zum Passwort wird beim Login ein Code aus deiner Authenticator-App abgefragt.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                {isLoading ? (
                    <p className="text-sm text-muted-foreground">Lädt...</p>

                ) : step === "codes" ? (
                    /* ---------- Recovery-Codes anzeigen (nur einmal!) ---------- */
                    <>
                        <p className="text-sm">
                            Speichere diese Wiederherstellungscodes an einem sicheren Ort. Jeder Code
                            funktioniert einmal, falls du keinen Zugriff auf deine App hast.
                            <strong> Sie werden nur jetzt angezeigt.</strong>
                        </p>
                        <div className="grid grid-cols-2 gap-2 rounded-md bg-muted p-3 font-mono text-sm">
                            {codes.map((c) => <span key={c}>{c}</span>)}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" onClick={copyCodes}>Kopieren</Button>
                            <Button onClick={() => setStep("idle")}>Ich habe sie gespeichert</Button>
                        </div>
                    </>

                ) : totp ? (
                    /* ---------- 2FA aktiv ---------- */
                    <>
                        <p className="text-sm">
                            Aktiv seit {new Date(totp.created_at * 1000).toLocaleDateString("de-DE")}
                        </p>
                        {recovery?.type === "recovery_codes" && (
                            <p className="text-sm text-muted-foreground">
                                {recovery.unused_code_count} von {recovery.total_code_count} Wiederherstellungscodes übrig
                            </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" onClick={newCodes} disabled={regenerate.isPending}>
                                Neue Codes erzeugen
                            </Button>
                            <Button variant="destructive" onClick={disable} disabled={deactivate.isPending}>
                                Deaktivieren
                            </Button>
                        </div>
                    </>

                ) : step === "setup" && setup.data ? (
                    /* ---------- Einrichtung: QR + Code bestätigen ---------- */
                    <>
                        <p className="text-sm">1. Scanne den QR-Code mit deiner Authenticator-App.</p>
                        <div className="self-center rounded-md bg-white p-3">
                            <QRCode value={setup.data.totp_url} size={160} />
                        </div>
                        <p className="break-all text-center font-mono text-xs text-muted-foreground">
                            Oder manuell eingeben: {setup.data.secret}
                        </p>
                        <p className="text-sm">2. Gib den 6-stelligen Code aus der App ein.</p>
                        <InputOTP
                            containerClassName="justify-center"
                            maxLength={6}
                            pattern={REGEXP_ONLY_DIGITS}
                            value={code}
                            onChange={setCode}
                            onComplete={confirmCode}
                            disabled={activate.isPending}
                        >
                            <InputOTPGroup>
                                {[0, 1, 2, 3, 4, 5].map((i) => (
                                    <InputOTPSlot key={i} index={i} aria-invalid={activate.isError} className="size-11 text-lg" />
                                ))}
                            </InputOTPGroup>
                        </InputOTP>
                        {activate.isError && !needsReauth(activate.error) && (
                            <p className="text-center text-sm text-destructive">Code ist falsch. Bitte erneut versuchen.</p>
                        )}
                        <Button variant="ghost" onClick={() => { setStep("idle"); setCode(""); }}>
                            Abbrechen
                        </Button>
                    </>

                ) : (
                    /* ---------- nicht aktiv ---------- */
                    <Button className="self-start" onClick={startSetup} disabled={setup.isPending}>
                        2FA aktivieren
                    </Button>
                )}
            </CardContent>

            <ReauthDialog
                open={retry !== null}
                onClose={() => setRetry(null)}
                onSuccess={() => {
                    const r = retry;
                    setRetry(null);
                    r?.();
                }}
            />
        </Card>
    );
}