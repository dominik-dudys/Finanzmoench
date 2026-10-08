import {useEffect} from "react";
import {Link} from "react-router";
import {useForm} from "react-hook-form";
import {z} from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/ui-components/ui/dialog";
import {Field, FieldError, FieldGroup, FieldLabel} from "@/ui-components/ui/field";
import {Input} from "@/ui-components/ui/input";
import {Button} from "@/ui-components/ui/button";
import {selectClass} from "@/features/household/schema";
import type {Category} from "@/features/categories/api";
import type {Income, IncomePayload} from "./api";
import {useCreateIncome, useUpdateIncome} from "./use-incomes";

const schema = z.object({
    amount: z.string().trim().regex(/^\d+([.,]\d{1,2})?$/, "Bitte gib einen Betrag ein, z. B. 2500,00"),
    position_category: z.string().min(1, "Bitte wähle eine Kategorie aus"),
});
type Values = z.infer<typeof schema>;

const toNumber = (value: string) => Number(value.replace(",", "."));

// Erste Fehlermeldung aus der Backend-Antwort holen (Feldfehler oder {error})
function firstBackendMessage(err: unknown): string | null {
    if (!err || typeof err !== "object") return null;
    for (const value of Object.values(err as Record<string, unknown>)) {
        if (typeof value === "string") return value;
        if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    }
    return null;
}

interface Props {
    open: boolean;
    onClose: () => void;
    item?: Income;
    categories: Category[];
}

export function IncomeFormDialog({open, onClose, item, categories}: Props) {
    const create = useCreateIncome();
    const update = useUpdateIncome();
    const pending = create.isPending || update.isPending;
    const isEdit = !!item;

    const incomeCategories = categories.filter((c) => c.type === "income");

    const {register, handleSubmit, reset, setError, formState: {errors}} = useForm<Values>({
        resolver: zodResolver(schema),
        defaultValues: {amount: "", position_category: ""},
    });

    // Beim Öffnen Formular mit den passenden Werten füllen
    useEffect(() => {
        if (!open) return;
        reset({
            amount: item?.amount ?? "",
            position_category: item?.position_category ?? "",
        });
    }, [open, item, reset]);

    const onError = (err: unknown) => {
        setError("root", {
            message: firstBackendMessage(err) ?? "Speichern fehlgeschlagen. Bitte versuch es nochmal.",
        });
    };

    const onSubmit = handleSubmit((values) => {
        const payload: IncomePayload = {
            amount: toNumber(values.amount).toFixed(2),
            position_category: values.position_category,
        };

        const options = {onSuccess: onClose, onError};
        if (item) {
            update.mutate({id: item.income_id, payload}, options);
        } else {
            create.mutate(payload, options);
        }
    });

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
                    <DialogHeader>
                        <DialogTitle>{isEdit ? "Einkommen bearbeiten" : "Neues Einkommen"}</DialogTitle>
                    </DialogHeader>

                    <FieldGroup>
                        {/* ---------- Betrag ---------- */}
                        <Field>
                            <FieldLabel htmlFor="income-amount">Betrag pro Monat (netto)</FieldLabel>
                            <Input
                                id="income-amount"
                                autoFocus
                                inputMode="decimal"
                                placeholder="0,00"
                                aria-invalid={!!errors.amount}
                                {...register("amount")}
                            />
                            <FieldError errors={[errors.amount]}/>
                        </Field>

                        {/* ---------- Kategorie ---------- */}
                        <Field>
                            <FieldLabel htmlFor="income-category">Kategorie</FieldLabel>
                            <select
                                id="income-category"
                                className={selectClass}
                                aria-invalid={!!errors.position_category}
                                {...register("position_category")}
                            >
                                <option value="">Bitte wählen</option>
                                {incomeCategories.map((c) => (
                                    <option key={c.position_id} value={c.position_id}>{c.name}</option>
                                ))}
                            </select>
                            {incomeCategories.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    Es gibt noch keine Einkommens-Kategorie.{" "}
                                    <Link to="/kategorien" className="underline">Kategorie anlegen</Link>
                                </p>
                            )}
                            <FieldError errors={[errors.position_category]}/>
                        </Field>

                        {isEdit && (
                            <p className="text-sm text-muted-foreground">
                                Änderungen gelten ab heute. Der bisherige Betrag bleibt im Verlauf erhalten.
                            </p>
                        )}

                        <FieldError errors={[errors.root]}/>
                    </FieldGroup>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Abbrechen</Button>
                        <Button type="submit" disabled={pending}>
                            {pending ? "Wird gespeichert..." : "Speichern"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}