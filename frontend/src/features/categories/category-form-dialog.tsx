import {useEffect} from "react";
import {Controller, useForm} from "react-hook-form";
import {z} from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import {Check, Plus} from "lucide-react";
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/ui-components/ui/dialog";
import {Field, FieldError, FieldGroup, FieldLabel} from "@/ui-components/ui/field";
import {Input} from "@/ui-components/ui/input";
import {Button} from "@/ui-components/ui/button";
import type {Category, CategoryErrors, CategoryType} from "./api";
import {useCreateCategory, useUpdateCategory} from "./use-categories";

const PRESET_COLORS = [
    "#EF4444", "#F97316", "#EAB308", "#22C55E",
    "#14B8A6", "#3B82F6", "#8B5CF6", "#EC4899",
];
const DEFAULT_COLOR = "#3B82F6";

const TYPE_LABELS: Record<CategoryType, string> = {
    cost: "Ausgabe",
    income: "Einkommen",
};

const schema = z.object({
    name: z.string().trim().min(1, "Bitte gib einen Namen ein").max(100, "Maximal 100 Zeichen"),
    color_code: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Ungültige Farbe").nullable(),
    type: z.enum(["cost", "income"]),
});
type Values = z.infer<typeof schema>;

interface Props {
    open: boolean;
    onClose: () => void;
    category?: Category;          // gesetzt = Bearbeiten, leer = Anlegen
    defaultType: CategoryType;    // vorausgewählter Typ beim Anlegen (aktueller Tab)
}

export function CategoryFormDialog({open, onClose, category, defaultType}: Props) {
    const create = useCreateCategory();
    const update = useUpdateCategory();
    const pending = create.isPending || update.isPending;
    const isEdit = !!category;

    const {register, control, handleSubmit, reset, setError, formState: {errors}} = useForm<Values>({
        resolver: zodResolver(schema),
        defaultValues: {name: "", color_code: DEFAULT_COLOR, type: defaultType},
    });

    // Beim Öffnen Formular mit den passenden Werten füllen
    useEffect(() => {
        if (open) {
            reset({
                name: category?.name ?? "",
                color_code: category ? category.color_code : DEFAULT_COLOR,
                type: category?.type ?? defaultType,
            });
        }
    }, [open, category, defaultType, reset]);

    const onError = (err: unknown) => {
        const e = (err ?? {}) as CategoryErrors;
        if (e.color_code?.[0]) setError("color_code", {message: e.color_code[0]});
        if (e.name?.[0]) setError("name", {message: e.name[0]});

        if (e.error) {
            // Doppelter Name kommt als Text vom Service → beim Namen anzeigen
            if (e.error.includes("existiert bereits")) {
                setError("name", {message: "Eine Kategorie mit diesem Namen gibt es bereits."});
            } else {
                setError("root", {message: e.error});
            }
        } else if (!e.color_code && !e.name) {
            setError("root", {message: "Speichern fehlgeschlagen. Bitte versuch es nochmal."});
        }
    };

    const onSubmit = handleSubmit((values) => {
        const options = {onSuccess: onClose, onError};
        if (category) {
            // Typ wird beim Bearbeiten bewusst nicht mitgeschickt
            update.mutate(
                {id: category.position_id, payload: {name: values.name, color_code: values.color_code}},
                options,
            );
        } else {
            create.mutate(values, options);
        }
    });

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
                    <DialogHeader>
                        <DialogTitle>{isEdit ? "Kategorie bearbeiten" : "Neue Kategorie"}</DialogTitle>
                    </DialogHeader>

                    <FieldGroup>
                        {/* ---------- Typ ---------- */}
                        <Field>
                            <FieldLabel>Typ</FieldLabel>
                            {isEdit ? (
                                <p className="text-sm text-muted-foreground">{TYPE_LABELS[category.type]}</p>
                            ) : (
                                <Controller
                                    name="type"
                                    control={control}
                                    render={({field}) => (
                                        <div className="grid grid-cols-2 gap-2">
                                            {(Object.keys(TYPE_LABELS) as CategoryType[]).map((t) => (
                                                <Button
                                                    key={t}
                                                    type="button"
                                                    variant={field.value === t ? "default" : "outline"}
                                                    aria-pressed={field.value === t}
                                                    onClick={() => field.onChange(t)}
                                                >
                                                    {TYPE_LABELS[t]}
                                                </Button>
                                            ))}
                                        </div>
                                    )}
                                />
                            )}
                        </Field>

                        {/* ---------- Name ---------- */}
                        <Field>
                            <FieldLabel htmlFor="category-name">Name</FieldLabel>
                            <Input
                                id="category-name"
                                autoFocus
                                placeholder="z. B. Wohnen"
                                aria-invalid={!!errors.name}
                                {...register("name")}
                            />
                            <FieldError errors={[errors.name]}/>
                        </Field>

                        {/* ---------- Farbe ---------- */}
                        <Field>
                            <FieldLabel>Farbe</FieldLabel>
                            <Controller
                                name="color_code"
                                control={control}
                                render={({field}) => {
                                    const isCustom = !!field.value && !PRESET_COLORS.includes(field.value);
                                    return (
                                        <div className="flex flex-wrap items-center gap-2">
                                            {PRESET_COLORS.map((c) => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    onClick={() => field.onChange(c)}
                                                    aria-label={`Farbe ${c}`}
                                                    aria-pressed={field.value === c}
                                                    className="flex size-8 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                                    style={{backgroundColor: c}}
                                                >
                                                    {field.value === c && <Check className="size-4 text-white"/>}
                                                </button>
                                            ))}

                                            {/* Eigene Farbe über den System-Farbwähler */}
                                            <label
                                                title="Eigene Farbe"
                                                className="relative flex size-8 cursor-pointer items-center justify-center rounded-full border"
                                                style={isCustom ? {backgroundColor: field.value!} : undefined}
                                            >
                                                {isCustom ? <Check className="size-4 text-white"/> : <Plus className="size-4"/>}
                                                <input
                                                    type="color"
                                                    aria-label="Eigene Farbe wählen"
                                                    className="absolute inset-0 cursor-pointer opacity-0"
                                                    value={field.value ?? DEFAULT_COLOR}
                                                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                                />
                                            </label>

                                            <button
                                                type="button"
                                                onClick={() => field.onChange(null)}
                                                className="ml-1 text-sm text-muted-foreground underline"
                                            >
                                                Keine Farbe
                                            </button>
                                        </div>
                                    );
                                }}
                            />
                            <FieldError errors={[errors.color_code]}/>
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