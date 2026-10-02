import {z} from "zod";
import {useEffect} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Card, CardContent, CardHeader, CardTitle} from "@/ui-components/ui/card";
import {Field, FieldError, FieldGroup, FieldLabel} from "@/ui-components/ui/field";
import {Input} from "@/ui-components/ui/input";
import {Button} from "@/ui-components/ui/button";
import {useMe, useUpdateMe} from "@/features/profile/use-me.ts";
import {useMyHousehold} from "@/features/household/use-household.ts";

const profileSchema = z.object({
    first_name: z.string().min(1, "Bitte gib deinen Vornamen ein"),
    last_name: z.string().min(1, "Bitte gib deinen Nachnamen ein"),
});

type ProfileValues = z.infer<typeof profileSchema>;

const loginMethodLabels: Record<string, string> = {
    password: "Passwort",
    google: "Google",
    github: "GitHub",
};

export function ProfilePage() {
    const {data: me, isLoading} = useMe();
    const updateMe = useUpdateMe();
    const {data: household, isLoading: householdLoading} = useMyHousehold();

    const {
        register,
        handleSubmit,
        reset,
        formState: {errors, isDirty},
    } = useForm<ProfileValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {first_name: "", last_name: ""},
    });

    useEffect(() => {
        if (me) {
            reset({first_name: me.first_name, last_name: me.last_name});
        }
    }, [me, reset]);

    const onSubmit = handleSubmit((values) => updateMe.mutate(values));

    if (isLoading || !me) {
        return <div className="p-6">Lädt...</div>;
    }

    return (
        <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
            <Card>
                <CardHeader>
                    <CardTitle>Persönliche Daten</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} noValidate>
                        <FieldGroup>
                            <Field className="grid grid-cols-2 gap-4">
                                <Field>
                                    <FieldLabel htmlFor="first_name">Vorname</FieldLabel>
                                    <Input id="first_name" aria-invalid={!!errors.first_name} {...register("first_name")} />
                                    <FieldError errors={[errors.first_name]} />
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="last_name">Nachname</FieldLabel>
                                    <Input id="last_name" aria-invalid={!!errors.last_name} {...register("last_name")} />
                                    <FieldError errors={[errors.last_name]} />
                                </Field>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="email">E-Mail</FieldLabel>
                                <Input id="email" value={me.email} disabled />
                            </Field>
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Mitglied seit {new Date(me.created_at).toLocaleDateString("de-DE")}</span>
                                <span>
                                    Anmeldeart: {me.login_method.map((m) => loginMethodLabels[m] ?? m).join(", ")}
                                </span>
                            </div>
                            <Field>
                                <Button type="submit" disabled={!isDirty || updateMe.isPending}>
                                    {updateMe.isPending ? "Wird gespeichert..." : "Speichern"}
                                </Button>
                            </Field>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Haushalt</CardTitle>
                </CardHeader>
                <CardContent>
                    {householdLoading ? (
                        <p className="text-sm text-muted-foreground">Lädt...</p>
                    ) : household ? (
                        <div className="flex flex-col gap-2">
                            <p className="font-medium">{household.name}</p>
                            <p className="text-sm text-muted-foreground">{household.address}</p>
                            <p className="text-sm text-muted-foreground">
                                {household.member_count} {household.member_count === 1 ? "Mitglied" : "Mitglieder"}
                            </p>
                            <a href="/household" className="text-sm underline">
                                Haushalt bearbeiten
                            </a>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <p className="text-sm text-muted-foreground">Du bist noch in keinem Haushalt.</p>
                            <a href="/household" className="text-sm underline">
                                Haushalt erstellen oder beitreten
                            </a>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}