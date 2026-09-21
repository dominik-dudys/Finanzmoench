import {isAllauthResponse, resendVerificationCode, verifyEmail} from "@/features/auth/api.ts";
import {useAuth} from "@/features/auth";
import {Navigate, useNavigate} from "react-router";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {useState} from "react";
import {Card, CardContent} from "@/ui-components/ui/card.tsx";
import {Field, FieldDescription, FieldError, FieldGroup} from "@/ui-components/ui/field";
import {InputOTP, InputOTPGroup, InputOTPSlot} from "@/ui-components/ui/input-otp";
import {REGEXP_ONLY_DIGITS} from "input-otp";
import { Button } from "@/ui-components/ui/button";

function errorMessage(err: unknown, fallback: string){
    if (isAllauthResponse(err) && err.status === 429){
        return "Zu viele Versuche, Bitte warte einen Moment";
    }
    return fallback;
}

export function VerifyEmailPage(){
    const {state} = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [code, setCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);


const verify = useMutation({
    mutationFn: verifyEmail,
    onSuccess: async () => {
        await queryClient.invalidateQueries({queryKey: ["auth", "session"]});
        navigate("/dashboard", {replace: true});
    },
    onError: (err) => {
        setInfo(null);
        setCode("");
        setError(errorMessage(err, "Der Code ist ungültig oder abgelaufen"));
    },
});

const resend = useMutation({
    mutationFn: resendVerificationCode,
    onSuccess: () => {
        setError(null);
        setInfo("Wir haben dir einen neuen Code geschickt")
    },
    onError: (err) => {
        setInfo(null);
        setError(errorMessage(err, "Der Code konnte nicht erneut gesendet werden"));
    },
});

if (state.status === "loading"){
    return <p className="p-6">Lädt...</p>;
}
if (state.status === "authenticated"){
    return <Navigate to="/dashboard" replace/>;
}
if (state.status === "anonymous"){
    return <Navigate to="/register" replace/>
}

return (

    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
            <Card>
                <CardContent className="p-6 md:p-8">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            verify.mutate(code);
                        }}
                    >
                        <FieldGroup>
                            <div className="flex flex-col items-center gap-2 text-center">
                                <h1 className="text-2xl font-bold">Bestätige deine E-Mail</h1>
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
                                    onComplete={(value) => verify.mutate(value)}
                                    disabled={verify.isPending}
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
                                <Button type="submit" disabled={code.length !== 6 || verify.isPending}>
                                    {verify.isPending ? "Wird geprüft..." : "Bestätigen"}
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
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
        </div>
    </div>
)

}