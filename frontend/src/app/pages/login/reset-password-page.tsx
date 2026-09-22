import {useState} from "react";
import {Link, Navigate, useLocation, useNavigate} from "react-router";
import {useForm, Controller} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {useMutation} from "@tanstack/react-query";
import {REGEXP_ONLY_DIGITS} from "input-otp";
import {isAllauthResponse, resetPassword} from "@/features/auth/api.ts";
import {useAuth} from "@/features/auth";
import {Button} from "@/ui-components/ui/button.tsx";
import {Card, CardContent} from "@/ui-components/ui/card.tsx";
import {Field, FieldError, FieldGroup, FieldLabel} from "@/ui-components/ui/field.tsx";
import {InputOTP, InputOTPGroup, InputOTPSlot} from "@/ui-components/ui/input-otp.tsx";
import {PasswordInput} from "@/ui-components/password-input.tsx";

const resetSchema = z
    .object({
        code: z.string().length(6, "Bitte gib den 6-stelligen Code ein"),
        password: z.string().min(8, "Mindestens 8 Zeichen"),
        confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, {
        message: "Die Passwörter stimmen nicht überein",
        path: ["confirmPassword"],
    });

type ResetValues = z.infer<typeof resetSchema>;

export function ResetPasswordPage() {
    const {state} = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const email = (location.state as {email?: string} | null)?.email;
    const [rootError, setRootError] = useState<string | null>(null);

    const {
        register,
        control,
        handleSubmit,
        setError,
        setValue,
        formState: {errors},
    } = useForm<ResetValues>({
        resolver: zodResolver(resetSchema),
        defaultValues: {code: "", password: "", confirmPassword: ""},
    });

    const reset = useMutation({
        mutationFn: (v: ResetValues) => resetPassword(v.code, v.password),
        onSuccess: () => {
            navigate("/login", {replace: true, state: {passwordReset: true}});
        },
        onError: (err) => {
            setRootError(null);
            if (isAllauthResponse(err)) {
                if (err.status === 429) {
                    setRootError("Zu viele Versuche. Bitte warte einen Moment.");
                    return;
                }
                if (err.status === 400 && err.errors?.length) {
                    let handled = false;
                    for (const e of err.errors) {
                        if (e.param === "password") {
                            setError("password", {message: e.message});
                            handled = true;
                        } else if (e.param === "key" || e.param === "code") {
                            setValue("code", "");
                            setError("code", {message: "Der Code ist ungültig oder abgelaufen"});
                            handled = true;
                        }
                    }
                    if (handled) return;
                }
                if (err.status === 409) {
                    navigate("/forgot-password", {replace: true});
                    return;
                }
            }
            setRootError("Das Passwort konnte nicht zurückgesetzt werden. Versuche es später erneut.");
        },
    });

    if (state.status === "loading") return <p className="p-6">Lädt...</p>;
    if (state.status === "authenticated") return <Navigate to="/dashboard" replace/>;
    if (state.status !== "pending_password_reset") {
        return <Navigate to="/forgot-password" replace/>;
    }

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-md">
                <Card>
                    <CardContent className="p-6 md:p-8">
                        <form onSubmit={handleSubmit((v) => reset.mutate(v))}>
                            <FieldGroup>
                                <div className="flex flex-col items-center gap-2 text-center">
                                    <h1 className="text-2xl font-bold">Neues Passwort festlegen</h1>
                                    <p className="text-sm text-balance text-muted-foreground">
                                        {email
                                            ? <>Wir haben einen Code an <strong>{email}</strong> geschickt.</>
                                            : "Wir haben dir einen Code per E-Mail geschickt."}
                                        {" "}Falsche Adresse?{" "}
                                        <Link to="/forgot-password" state={{email}}
                                              className="underline underline-offset-4">
                                            Ändern
                                        </Link>
                                    </p>
                                </div>

                                <Field>
                                    <Controller
                                        name="code"
                                        control={control}
                                        render={({field}) => (
                                            <InputOTP
                                                containerClassName="justify-center"
                                                maxLength={6}
                                                pattern={REGEXP_ONLY_DIGITS}
                                                value={field.value}
                                                onChange={field.onChange}
                                                disabled={reset.isPending}
                                                autoFocus
                                            >
                                                <InputOTPGroup>
                                                    {[0, 1, 2, 3, 4, 5].map((i) => (
                                                        <InputOTPSlot
                                                            key={i}
                                                            index={i}
                                                            aria-invalid={!!errors.code}
                                                            className="size-11 text-lg"
                                                        />
                                                    ))}
                                                </InputOTPGroup>
                                            </InputOTP>
                                        )}
                                    />
                                    {errors.code && (
                                        <FieldError className="text-center">{errors.code.message}</FieldError>
                                    )}
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="password">Neues Passwort</FieldLabel>
                                    <PasswordInput id="password" autoComplete="new-password" {...register("password")}/>
                                    {errors.password && <FieldError>{errors.password.message}</FieldError>}
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="confirm-password">Passwort wiederholen</FieldLabel>
                                    <PasswordInput id="confirm-password" autoComplete="new-password" {...register("confirmPassword")}/>
                                    {errors.confirmPassword && (
                                        <FieldError>{errors.confirmPassword.message}</FieldError>
                                    )}
                                </Field>

                                {rootError && <FieldError className="text-center">{rootError}</FieldError>}

                                <Field>
                                    <Button type="submit" disabled={reset.isPending}>
                                        {reset.isPending ? "Wird gespeichert..." : "Passwort ändern"}
                                    </Button>
                                    <Link to="/forgot-password" state={{email}}
                                          className="text-center text-sm underline-offset-4 hover:underline">
                                        Neuen Code anfordern
                                    </Link>
                                </Field>
                            </FieldGroup>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}