import {useEffect} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {toast} from "sonner";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/ui-components/ui/card";
import {Field, FieldError, FieldGroup, FieldLabel} from "@/ui-components/ui/field";
import {Input} from "@/ui-components/ui/input";
import {Button} from "@/ui-components/ui/button";
import {householdSchema, selectClass, type HouseholdValues} from "./schema";
import {useUpdateHousehold} from "./use-household";
import type {Household} from "./api";

function toValues(household: Household): HouseholdValues {
    return {
        name: household.name,
        address: household.address,
        postal_code: household.postal_code,
        city: household.city,
        currency: household.currency as HouseholdValues["currency"],
    };
}

export function HouseholdDetailsCard({household}: {household: Household}) {
    const updateHousehold = useUpdateHousehold();

    const {register, handleSubmit, reset, formState: {errors, isDirty}} = useForm<HouseholdValues>({
        resolver: zodResolver(householdSchema),
        defaultValues: toValues(household),
    });

    // Neue Daten vom Server (z. B. nach Speichern oder Änderung durch ein anderes Mitglied) übernehmen
    useEffect(() => {
        reset(toValues(household));
    }, [household, reset]);

    const onSubmit = handleSubmit((values) =>
        updateHousehold.mutate(values, {
            onSuccess: () => toast.success("Haushalt gespeichert"),
        }),
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Haushalt</CardTitle>
                <CardDescription>Diese Angaben gelten für alle Mitglieder.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} noValidate>
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="household-name">Name</FieldLabel>
                            <Input id="household-name" aria-invalid={!!errors.name} {...register("name")}/>
                            <FieldError errors={[errors.name]}/>
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="household-address">Adresse</FieldLabel>
                            <Input id="household-address" aria-invalid={!!errors.address} {...register("address")}/>
                            <FieldError errors={[errors.address]}/>
                        </Field>
                        <div className="grid grid-cols-[7rem_1fr] gap-4">
                            <Field>
                                <FieldLabel htmlFor="household-postal">PLZ</FieldLabel>
                                <Input
                                    id="household-postal"
                                    inputMode="numeric"
                                    aria-invalid={!!errors.postal_code}
                                    {...register("postal_code")}
                                />
                                <FieldError errors={[errors.postal_code]}/>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="household-city">Stadt</FieldLabel>
                                <Input id="household-city" aria-invalid={!!errors.city} {...register("city")}/>
                                <FieldError errors={[errors.city]}/>
                            </Field>
                        </div>
                        <Field>
                            <FieldLabel htmlFor="household-currency">Währung</FieldLabel>
                            <select id="household-currency" className={selectClass} {...register("currency")}>
                                <option value="EUR">EUR</option>
                                <option value="USD">USD</option>
                            </select>
                            <FieldError errors={[errors.currency]}/>
                        </Field>

                        {updateHousehold.isError && (
                            <p className="text-sm text-destructive">Speichern fehlgeschlagen. Bitte versuch es erneut.</p>
                        )}

                        <div className="flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={!isDirty || updateHousehold.isPending}
                                onClick={() => reset(toValues(household))}
                            >
                                Zurücksetzen
                            </Button>
                            <Button type="submit" disabled={!isDirty || updateHousehold.isPending}>
                                {updateHousehold.isPending ? "Wird gespeichert..." : "Speichern"}
                            </Button>
                        </div>
                    </FieldGroup>
                </form>
            </CardContent>
        </Card>
    );
}