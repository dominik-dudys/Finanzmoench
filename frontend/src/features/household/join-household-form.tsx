import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Card, CardContent, CardHeader, CardTitle} from "@/ui-components/ui/card";
import {Field, FieldError, FieldGroup, FieldLabel} from "@/ui-components/ui/field";
import {Input} from "@/ui-components/ui/input";
import {Button} from "@/ui-components/ui/button";
import {joinSchema, type JoinValues} from "@/features/household/schema.ts";
import {useJoinHousehold} from "@/features/household/use-household.ts";

export function JoinHouseholdForm({onDone, onBack}: {onDone: () => void; onBack: () => void}) {
    const joinHousehold = useJoinHousehold();
    const {
        register,
        handleSubmit,
        setError,
        formState: {errors},
    } = useForm<JoinValues>({
        resolver: zodResolver(joinSchema),
    });

    const onSubmit = handleSubmit((values) => {
        joinHousehold.mutate(values.household_id, {
            onSuccess: onDone,
            onError: (err) => {
                const message = (err as {error?: string})?.error ?? "Beitritt fehlgeschlagen.";
                setError("root", {message});
            },
        });
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Haushalt beitreten</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} noValidate>
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="household_id">Haushalts-ID</FieldLabel>
                            <Input id="household_id" aria-invalid={!!errors.household_id} {...register("household_id")} />
                            <FieldError errors={[errors.household_id]} />
                        </Field>
                        <Field>
                            {errors.root && <FieldError>{errors.root.message}</FieldError>}
                            <div className="flex gap-3">
                                <Button type="submit" disabled={joinHousehold.isPending}>
                                    {joinHousehold.isPending ? "Tritt bei..." : "Beitreten"}
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