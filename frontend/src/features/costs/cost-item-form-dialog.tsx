import {useEffect} from "react";
import {Link} from "react-router";
import {useFieldArray, useForm} from "react-hook-form";
import {z} from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/ui-components/ui/dialog";
import {Field, FieldError, FieldGroup, FieldLabel} from "@/ui-components/ui/field";
import {Input} from "@/ui-components/ui/input";
import {Button} from "@/ui-components/ui/button";
import {selectClass} from "@/features/household/schema";
import {useHouseholdMembers} from "@/features/household/use-household.ts";
import type {HouseholdMember} from "@/features/household/api";
import type {Category} from "@/features/categories/api";
import type {CostItem, CostItemPayload} from "./api";
import {useCreateCostItem, useUpdateCostItem} from "./use-cost-items";

const INTERVAL_OPTIONS = [
    {value: "daily", label: "Täglich"},
    {value: "weekly", label: "Wöchentlich"},
    {value: "monthly", label: "Monatlich"},
    {value: "yearly", label: "Jährlich"},
] as const;

const schema = z.object({
    name: z.string().trim().min(1, "Bitte gib einen Namen ein").max(100, "Maximal 100 Zeichen"),
    amount: z.string().trim().regex(/^\d+([.,]\d{1,2})?$/, "Bitte gib einen Betrag ein, z. B. 12,99"),
    interval: z.enum(["daily", "weekly", "monthly", "yearly"]),
    position_category: z.string().min(1, "Bitte wähle eine Kategorie aus"),
    description: z.string(),
    start_date: z.string(),
    end_date: z.string(),
    shares: z.array(z.object({
        person: z.string(),
        percentage: z.string().trim().regex(/^\d+([.,]\d{1,2})?$/, "Ungültig"),
    })),
}).refine(
    (v) => !v.start_date || !v.end_date || v.end_date >= v.start_date,
    {path: ["end_date"], message: "Das Enddatum darf nicht vor dem Startdatum liegen."},
);
type Values = z.infer<typeof schema>;

const toNumber = (value: string) => Number(value.replace(",", "."));

// 100 % gleichmäßig verteilen; der Rundungsrest geht an die erste Person
function equalShares(members: HouseholdMember[]): Values["shares"] {
    if (members.length === 0) return [];
    const base = Math.floor(10000 / members.length) / 100;
    const rest = 100 - base * members.length;
    return members.map((m, i) => ({
        person: m.person_id,
        percentage: (i === 0 ? base + rest : base).toFixed(2),
    }));
}

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
    item?: CostItem;
    categories: Category[];
}

export function CostItemFormDialog({open, onClose, item, categories}: Props) {
    const create = useCreateCostItem();
    const update = useUpdateCostItem();
    const pending = create.isPending || update.isPending;
    const isEdit = !!item;

    const {data: members = []} = useHouseholdMembers(open);
    const costCategories = categories.filter((c) => c.type === "cost");

    const {register, control, handleSubmit, reset, setError, setValue, formState: {errors}} = useForm<Values>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: "", amount: "", interval: "monthly", position_category: "",
            description: "", start_date: "", end_date: "", shares: [],
        },
    });
    const {fields} = useFieldArray({control, name: "shares"});

    // Beim Öffnen Formular mit den passenden Werten füllen
    useEffect(() => {
        if (!open) return;
        reset({
            name: item?.name ?? "",
            amount: item?.amount ?? "",
            interval: item?.interval ?? "monthly",
            position_category: item?.position_category ?? "",
            description: item?.description ?? "",
            start_date: item?.start_date ?? "",
            end_date: item?.end_date ?? "",
            shares: item
                ? members.map((m) => ({
                    person: m.person_id,
                    percentage: item.shares.find((s) => s.person === m.person_id)?.percentage ?? "0.00",
                }))
                : equalShares(members),
        });
    }, [open, item, members, reset]);

    const onError = (err: unknown) => {
        setError("root", {
            message: firstBackendMessage(err) ?? "Speichern fehlgeschlagen. Bitte versuch es nochmal.",
        });
    };

    const onSubmit = handleSubmit((values) => {
        const total = values.shares.reduce((sum, s) => sum + toNumber(s.percentage), 0);
        if (Math.round(total * 100) !== 10000) {
            setError("root", {message: `Die Aufteilung muss 100 % ergeben. Aktuell: ${total.toFixed(2)} %`});
            return;
        }

        const payload: CostItemPayload = {
            name: values.name,
            amount: toNumber(values.amount).toFixed(2),
            interval: values.interval,
            position_category: values.position_category,
            description: values.description.trim() || null,
            start_date: values.start_date || null,
            end_date: values.end_date || null,
            shares: values.shares
                .filter((s) => toNumber(s.percentage) > 0)
                .map((s) => ({person: s.person, percentage: toNumber(s.percentage).toFixed(2)})),
        };

        const options = {onSuccess: onClose, onError};
        if (item) {
            update.mutate({id: item.cost_item_id, payload}, options);
        } else {
            create.mutate(payload, options);
        }
    });

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
                    <DialogHeader>
                        <DialogTitle>{isEdit ? "Kostenposten bearbeiten" : "Neuer Kostenposten"}</DialogTitle>
                    </DialogHeader>

                    <FieldGroup>
                        {/* ---------- Name ---------- */}
                        <Field>
                            <FieldLabel htmlFor="cost-name">Name</FieldLabel>
                            <Input
                                id="cost-name"
                                autoFocus
                                placeholder="z. B. Miete"
                                aria-invalid={!!errors.name}
                                {...register("name")}
                            />
                            <FieldError errors={[errors.name]}/>
                        </Field>

                        {/* ---------- Betrag + Intervall ---------- */}
                        <div className="grid grid-cols-2 gap-3">
                            <Field>
                                <FieldLabel htmlFor="cost-amount">Betrag</FieldLabel>
                                <Input
                                    id="cost-amount"
                                    inputMode="decimal"
                                    placeholder="0,00"
                                    aria-invalid={!!errors.amount}
                                    {...register("amount")}
                                />
                                <FieldError errors={[errors.amount]}/>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="cost-interval">Intervall</FieldLabel>
                                <select id="cost-interval" className={selectClass} {...register("interval")}>
                                    {INTERVAL_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </Field>
                        </div>

                        {/* ---------- Kategorie ---------- */}
                        <Field>
                            <FieldLabel htmlFor="cost-category">Kategorie</FieldLabel>
                            <select
                                id="cost-category"
                                className={selectClass}
                                aria-invalid={!!errors.position_category}
                                {...register("position_category")}
                            >
                                <option value="">Bitte wählen</option>
                                {costCategories.map((c) => (
                                    <option key={c.position_id} value={c.position_id}>{c.name}</option>
                                ))}
                            </select>
                            {costCategories.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    Es gibt noch keine Ausgaben-Kategorie.{" "}
                                    <Link to="/kategorien" className="underline">Kategorie anlegen</Link>
                                </p>
                            )}
                            <FieldError errors={[errors.position_category]}/>
                        </Field>

                        {/* ---------- Laufzeit ---------- */}
                        <div className="grid grid-cols-2 gap-3">
                            <Field>
                                <FieldLabel htmlFor="cost-start">Startdatum (optional)</FieldLabel>
                                <Input id="cost-start" type="date" {...register("start_date")}/>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="cost-end">Enddatum (optional)</FieldLabel>
                                <Input
                                    id="cost-end"
                                    type="date"
                                    aria-invalid={!!errors.end_date}
                                    {...register("end_date")}
                                />
                                <FieldError errors={[errors.end_date]}/>
                            </Field>
                        </div>

                        {/* ---------- Beschreibung ---------- */}
                        <Field>
                            <FieldLabel htmlFor="cost-description">Beschreibung (optional)</FieldLabel>
                            <Input id="cost-description" {...register("description")}/>
                        </Field>

                        {/* ---------- Aufteilung ---------- */}
                        <Field>
                            <div className="flex items-center justify-between">
                                <FieldLabel>Aufteilung in %</FieldLabel>
                                <button
                                    type="button"
                                    className="text-sm text-muted-foreground underline"
                                    onClick={() => setValue("shares", equalShares(members))}
                                >
                                    Gleichmäßig
                                </button>
                            </div>
                            <ul className="flex flex-col gap-2">
                                {fields.map((f, i) => {
                                    const member = members.find((m) => m.person_id === f.person);
                                    return (
                                        <li key={f.id} className="flex items-center gap-3">
                                            <span className="min-w-0 flex-1 truncate text-sm">
                                                {member ? `${member.first_name} ${member.last_name}` : "Unbekannt"}
                                            </span>
                                            <Input
                                                className="w-24 text-right"
                                                inputMode="decimal"
                                                aria-label={`Anteil ${member?.first_name ?? ""}`}
                                                aria-invalid={!!errors.shares?.[i]?.percentage}
                                                {...register(`shares.${i}.percentage`)}
                                            />
                                        </li>
                                    );
                                })}
                            </ul>
                        </Field>

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