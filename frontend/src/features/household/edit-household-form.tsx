import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Card, CardContent, CardHeader, CardTitle} from "@/ui-components/ui/card";
import {Field, FieldError, FieldGroup, FieldLabel} from "@/ui-components/ui/field";
import {Input} from "@/ui-components/ui/input";
import {Button} from "@/ui-components/ui/button";
import {householdSchema, selectClass, type HouseholdValues} from "@/features/household/schema.ts";
import {useDeleteHousehold, useLeaveHousehold, useUpdateHousehold} from "@/features/household/use-household.ts";
import type {Household} from "@/features/household/api.ts";

export function EditHouseholdForm({household, onBack}: {household: Household; onBack: () => void}) {
    const updateHousehold = useUpdateHousehold();
    const leaveHousehold = useLeaveHousehold();
    const deleteHousehold = useDeleteHousehold();

    const {
        register,
        handleSubmit,
        formState: {errors, isDirty},
    } = useForm<HouseholdValues>({
        resolver: zodResolver(householdSchema),
        defaultValues: {
            name: household.name,
            address: household.address,
            postal_code: household.postal_code,
            city: household.city,
            currency: household.currency as "EUR" | "USD",
        },
    });

    const onSubmit = handleSubmit((values) => updateHousehold.mutate(values));

    const handleLeave = () => {
        if (window.confirm("Haushalt wirklich verlassen?")) {
            leaveHousehold.mutate(undefined, {onSuccess: onBack});
        }
    };

    const handleDelete = () => {
        if (window.confirm("Haushalt wirklich unwiderruflich auflösen? Das betrifft alle Mitglieder.")) {
            deleteHousehold.mutate(undefined, {onSuccess: onBack});
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Haushalt bearbeiten</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} noValidate>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="name">Name</FieldLabel>
                                <Input id="name" aria-invalid={!!errors.name} {...register("name")} />
                                <FieldError errors={[errors.name]} />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="address">Adresse</FieldLabel>
                                <Input id="address" aria-invalid={!!errors.address} {...register("address")} />
                                <FieldError errors={[errors.address]} />
                            </Field>
                            <Field className="grid grid-cols-2 gap-4">
                                <Field>
                                    <FieldLabel htmlFor="postal_code">PLZ</FieldLabel>
                                    <Input id="postal_code" aria-invalid={!!errors.postal_code} {...register("postal_code")} />
                                    <FieldError errors={[errors.postal_code]} />
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="city">Stadt</FieldLabel>
                                    <Input id="city" aria-invalid={!!errors.city} {...register("city")} />
                                    <FieldError errors={[errors.city]} />
                                </Field>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="currency">Währung</FieldLabel>
                                <select id="currency" className={selectClass} {...register("currency")}>
                                    <option value="EUR">EUR</option>
                                    <option value="USD">USD</option>
                                </select>
                                <FieldError errors={[errors.currency]} />
                            </Field>
                            <Field>
                                <div className="flex gap-3">
                                    <Button type="submit" disabled={!isDirty || updateHousehold.isPending}>
                                        {updateHousehold.isPending ? "Wird gespeichert..." : "Speichern"}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={onBack}>
                                        Zurück
                                    </Button>
                                </div>
                            </Field>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Gefahrenzone</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-3">
                    <Button variant="outline" onClick={handleLeave} disabled={leaveHousehold.isPending}>
                        Verlassen
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={deleteHousehold.isPending}>
                        Auflösen
                    </Button>
                </CardContent>
            </Card>
        </>
    );
}