import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Card, CardContent, CardHeader, CardTitle} from "@/ui-components/ui/card";
import {Field, FieldError, FieldGroup, FieldLabel} from "@/ui-components/ui/field";
import {Input} from "@/ui-components/ui/input";
import {Button} from "@/ui-components/ui/button";
import {householdSchema, selectClass, type HouseholdValues} from "@/features/household/schema.ts";
import {useCreateHousehold} from "@/features/household/use-household.ts";

export function CreateHouseholdForm({onDone, onBack}: {onDone: () => void; onBack: () => void}) {
    const createHousehold = useCreateHousehold();
    const {
        register,
        handleSubmit,
        setError,
        formState: {errors},
    } = useForm<HouseholdValues>({
        resolver: zodResolver(householdSchema),
        defaultValues: {currency: "EUR"},
    });

    const onSubmit = handleSubmit((values) => {
        createHousehold.mutate(values, {
            onSuccess: onDone,
            onError: () => setError("root", {message: "Haushalt konnte nicht erstellt werden."}),
        });
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Haushalt erstellen</CardTitle>
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
                            <Input id="address" placeholder="Hauptstraße 42" aria-invalid={!!errors.address} {...register("address")} />
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
                            {errors.root && <FieldError>{errors.root.message}</FieldError>}
                            <div className="flex gap-3">
                                <Button type="submit" disabled={createHousehold.isPending}>
                                    {createHousehold.isPending ? "Wird erstellt..." : "Erstellen"}
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
    );
}