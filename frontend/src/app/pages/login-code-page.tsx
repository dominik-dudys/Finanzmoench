import {confirmLoginCode, isAllauthResponse, resendLoginCode} from "@/features/auth/api.ts";
import {toAuthState} from "@/features/auth/auth-state.ts";
import {useAuth} from "@/features/auth";
import {Navigate, useNavigate} from "react-router";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {useState} from "react";
import {Card, CardContent} from "@/ui-components/ui/card.tsx";
import {Field, FieldDescription, FieldError, FieldGroup} from "@/ui-components/ui/field";
import {InputOTP, InputOTPGroup, InputOTPSlot} from "@/ui-components/ui/input-otp";
import {REGEXP_ONLY_DIGITS} from "input-otp";
import {Button} from "@/ui-components/ui/button";

function errorMessage(err: unknown, fallback: string) {
    if (isAllauthResponse(err) && err.status === 429) {
        return "Zu viele Versuche. Bitte warte einen Moment.";
    }
    return fallback;
}

export function LoginCodePage() {
    const {state} = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [code, setCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);

    const confirm = useMutation({
        mutationFn: confirmLoginCode,
        onSuccess: async (res) => {
            await queryClient.invalidateQueries({queryKey: ["auth", "session"]});
            if (toAuthState(res, false).status === "authenticated") {
                navigate("/dashboard", {replace: true});
            } else {
                setError("Anmeldung nicht möglich. Bitte versuche es später erneut.");
            }
        },
        onError: (err) => {
            setInfo(null);
            setCode("");
            setError(errorMessage(err, "Der Code ist ungültig oder abgelaufen."));
        },
    });

    const resend = useMutation({
        mutationFn: resendLoginCode,
        onSuccess: () => {
            setError(null);
            setInfo("Wir haben dir einen neuen Code geschickt.");
        },
        onError: (err) => {
            setInfo(null);
            setError(errorMessage(err, "Der Code konnte nicht erneut gesendet werden."));
        },
    });

    if (state.status === "loading") {
        return <p className="p-6">Lädt...</p>;
    }
    if (state.status === "authenticated") {
        return <Navigate to="/dashboard" replace/>;
    }
    if (state.status === "pending_verify_email") {
        return <Navigate to="/register/verify" replace/>;
    }
    if (state.status !== "pending_login_code") {
        return <Navigate to="/login" replace/>;
    }

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-md">
                <Card>
                    <CardContent className="p-6 md:p-8">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                confirm.mutate(code);
                            }}
                        >
                            <FieldGroup>
                                <div className="flex flex-col items-center gap-2 text-center">
                                    <h1 className="text-2xl font-bold">Anmeldung bestätigen</h1>
                                    <p className="text-sm text-balance text-muted-foreground">
                                        Wir haben dir einen 6-stelligen Code per E-Mail geschickt.
                                    </p>
                                </div>
                                <Field>
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
                                    {error && <FieldError className="text-center">{error}</FieldError>}
                                    {info && <FieldDescription className="text-center">{info}</FieldDescription>}
                                </Field>
                                <Field>
                                    <Button type="submit" disabled={code.length !== 6 || confirm.isPending}>
                                        {confirm.isPending ? "Wird geprüft..." : "Anmelden"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={resend.isPending}
                                        onClick={() => resend.mutate()}
                                    >
                                        Code erneut senden
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