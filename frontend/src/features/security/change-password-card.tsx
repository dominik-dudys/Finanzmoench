import {z} from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Card, CardContent, CardHeader, CardTitle} from "@/ui-components/ui/card";
import {Field, FieldError, FieldGroup, FieldLabel} from "@/ui-components/ui/field";
import {Input} from "@/ui-components/ui/input";
import {Button} from "@/ui-components/ui/button";
import {isAllauthResponse} from "@/features/auth/api";
import {useChangePassword} from "./use-security";

const schema = z.object({
    current_password: z.string().min(1, "Bitte gib dein aktuelles Passwort ein"),
    new_password: z.string().min(8, "Mindestens 8 Zeichen"),
    confirm_password: z.string(),
}).refine((v) => v.new_password === v.confirm_password, {
    message: "Passwörter stimmen nicht überein",
    path: ["confirm_password"],
});

type Values = z.infer<typeof schema>;

export function ChangePasswordCard({hasPassword}: {hasPassword: boolean}) {
    const changePassword = useChangePassword();
    const {register, handleSubmit, reset, setError, formState: {errors}} =
        useForm<Values>({
            resolver: zodResolver(schema),
            defaultValues: {current_password: "", new_password: "", confirm_password: ""},
        });

    const onSubmit = handleSubmit((v) => {
        changePassword.reset();
        changePassword.mutate(
            {current_password: v.current_password, new_password: v.new_password},
            {
                onSuccess: () => reset(),
                onError: (err) => {
                    if (!isAllauthResponse(err)) return;
                    for (const e of err.errors ?? []) {
                        const field = e.param === "current_password" || e.param === "new_password"
                            ? e.param : "root";
                        setError(field, {message: e.message});
                    }
                },
            },
        );
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Passwort ändern</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} noValidate>
                    <fieldset disabled={!hasPassword} className="disabled:opacity-50">
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="current_password">Aktuelles Passwort</FieldLabel>
                                <Input id="current_password" type="password" autoComplete="current-password"
                                       aria-invalid={!!errors.current_password} {...register("current_password")} />
                                <FieldError errors={[errors.current_password]} />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="new_password">Neues Passwort</FieldLabel>
                                <Input id="new_password" type="password" autoComplete="new-password"
                                       aria-invalid={!!errors.new_password} {...register("new_password")} />
                                <FieldError errors={[errors.new_password]} />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="confirm_password">Neues Passwort wiederholen</FieldLabel>
                                <Input id="confirm_password" type="password" autoComplete="new-password"
                                       aria-invalid={!!errors.confirm_password} {...register("confirm_password")} />
                                <FieldError errors={[errors.confirm_password]} />
                            </Field>
                            <FieldError errors={[errors.root]} />
                            {changePassword.isSuccess && (
                                <p className="text-sm text-green-600">Passwort wurde geändert.</p>
                            )}
                            <Field>
                                <Button type="submit" disabled={changePassword.isPending}>
                                    {changePassword.isPending ? "Wird gespeichert..." : "Speichern"}
                                </Button>
                            </Field>
                        </FieldGroup>
                    </fieldset>
                    {!hasPassword && (
                        <p className="mt-3 text-sm text-muted-foreground">
                            Nicht verfügbar, da du dich über Google oder GitHub anmeldest.
                        </p>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}