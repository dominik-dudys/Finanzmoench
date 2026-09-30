import {isAllauthResponse} from "@/features/auth/api.ts";
import {toAuthState} from "@/features/auth/auth-state.ts";
import {useAuth} from "@/features/auth";
import {authenticate2fa} from "@/features/security/mfa-api";
import {Navigate, useNavigate} from "react-router";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {useState} from "react";
import {Card, CardContent} from "@/ui-components/ui/card.tsx";
import {Field, FieldDescription, FieldError, FieldGroup} from "@/ui-components/ui/field.tsx";
import {InputOTP, InputOTPGroup, InputOTPSlot} from "@/ui-components/ui/input-otp.tsx";
import {REGEXP_ONLY_DIGITS} from "input-otp";
import {Input} from "@/ui-components/ui/input.tsx";
import {Button} from "@/ui-components/ui/button.tsx";

export function LoginTwoFactorPage() {
    const {state} = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [code, setCode] = useState("");
    const [useRecovery, setUseRecovery] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const confirm = useMutation({
        mutationFn: authenticate2fa,
        onSuccess: async (res) => {
            await queryClient.invalidateQueries({queryKey: ["auth", "session"]});
            if (toAuthState(res, false).status === "authenticated") {
                navigate("/dashboard", {replace: true});
            } else {
                setError("Anmeldung nicht möglich. Bitte versuche es später erneut.");
            }
        },
        onError: (err) => {
            setCode("");
            setError(
                isAllauthResponse(err) && err.status === 429
                    ? "Zu viele Versuche. Bitte warte einen Moment."
                    : "Der Code ist ungültig."
            );
        },
    });

    if (state.status === "loading") {
        return <p className="p-6">Lädt...</p>;
    }
    if (state.status === "authenticated") {
        return <Navigate to="/dashboard" replace/>;
    }
    if (state.status !== "pending_2fa") {
        return <Navigate to="/login" replace/>;
    }

    const toggleMode = () => {
        setUseRecovery((v) => !v);
        setCode("");
        setError(null);
    };

    const canSubmit = useRecovery ? code.trim().length > 0 : code.length === 6;

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-md">
                <Card>
                    <CardContent className="p-6 md:p-8">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                confirm.mutate(code.trim());
                            }}
                        >
                            <FieldGroup>
                                <div className="flex flex-col items-center gap-2 text-center">
                                    <h1 className="text-2xl font-bold">Zwei-Faktor-Authentifizierung</h1>
                                    <p className="text-sm text-balance text-muted-foreground">
                                        {useRecovery
                                            ? "Gib einen deiner Wiederherstellungscodes ein."
                                            : "Gib den 6-stelligen Code aus deiner Authenticator-App ein."}
                                    </p>
                                </div>
                                <Field>
                                    {useRecovery ? (
                                        <Input
                                            value={code}
                                            onChange={(e) => {
                                                setCode(e.target.value);
                                                setError(null);
                                            }}
                                            autoComplete="one-time-code"
                                            className="text-center font-mono"
                                            autoFocus
                                        />
                                    ) : (
                                        <InputOTP
                                            containerClassName="justify-center"
                                            maxLength={6}
                                            pattern={REGEXP_ONLY_DIGITS}
                                            value={code}
                                            onChange={(value) => {
                                                setCode(value);
                                                setError(null);
                                            }}
                                            onComplete={(value) => confirm.mutate(value)}
                                            disabled={confirm.isPending}
                                            autoFocus
                                        >
                                            <InputOTPGroup>
                                                {[0, 1, 2, 3, 4, 5].map((i) => (
                                                    <InputOTPSlot
                                                        key={i}
                                                        index={i}
                                                        aria-invalid={!!error}
                                                        className="size-11 text-lg"
                                                    />
                                                ))}
                                            </InputOTPGroup>
                                        </InputOTP>
                                    )}
                                    {error && <FieldError className="text-center">{error}</FieldError>}
                                </Field>
                                <Field>
                                    <Button type="submit" disabled={!canSubmit || confirm.isPending}>
                                        {confirm.isPending ? "Wird geprüft..." : "Anmelden"}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={toggleMode}>
                                        {useRecovery ? "Authenticator-Code verwenden" : "Wiederherstellungscode verwenden"}
                                    </Button>
                                </Field>
                                <FieldDescription className="text-center">
                                    <a href="/login">Zurück zur Anmeldung</a>
                                </FieldDescription>
                            </FieldGroup>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}