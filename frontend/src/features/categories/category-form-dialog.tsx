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
import type {Category, CategoryFieldErrors} from "./api";
import {useCreateCategory, useUpdateCategory} from "./use-categories";

const PRESET_COLORS = [
    "#EF4444", "#F97316", "#EAB308", "#22C55E",
    "#14B8A6", "#3B82F6", "#8B5CF6", "#EC4899",
];
const DEFAULT_COLOR = "#3B82F6";

const schema = z.object({
    name: z.string().trim().min(1, "Bitte gib einen Namen ein").max(100, "Maximal 100 Zeichen"),
    color_code: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Ungültige Farbe").nullable(),
});
type Values = z.infer<typeof schema>;

interface Props {
    open: boolean;
    onClose: () => void;
    category?: Category;   // gesetzt = Bearbeiten, leer = Anlegen
}

export function CategoryFormDialog({open, onClose, category}: Props) {
    const create = useCreateCategory();
    const update = useUpdateCategory();
    const pending = create.isPending || update.isPending;

    const {register, control, handleSubmit, reset, setError, formState: {errors}} = useForm<Values>({
        resolver: zodResolver(schema),
        defaultValues: {name: "", color_code: DEFAULT_COLOR},
    });

    // Beim Öffnen Formular mit den passenden Werten füllen
    useEffect(() => {
        if (open) {
            reset({
                name: category?.name ?? "",
                color_code: category ? category.color_code : DEFAULT_COLOR,
            });
        }
    }, [open, category, reset]);

    const onError = (err: unknown) => {
        const fieldErrors = (err ?? {}) as CategoryFieldErrors;
        if (fieldErrors.name?.[0]) setError("name", {message: fieldErrors.name[0]});
        if (fieldErrors.color_code?.[0]) setError("color_code", {message: fieldErrors.color_code[0]});
        if (!fieldErrors.name && !fieldErrors.color_code) {
            setError("root", {message: "Speichern fehlgeschlagen. Bitte versuch es nochmal."});
        }
    };

    const onSubmit = handleSubmit((values) => {
        const options = {onSuccess: onClose, onError};
        if (category) {
            update.mutate({id: category.position_id, payload: values}, options);
        } else {
            create.mutate(values, options);
        }
    });

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
                    <DialogHeader>
                        <DialogTitle>{category ? "Kategorie bearbeiten" : "Neue Kategorie"}</DialogTitle>
                    </DialogHeader>

                    <FieldGroup>
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