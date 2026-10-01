import {useEffect, useMemo, useState} from "react";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/ui-components/ui/dialog";
import {Button} from "@/ui-components/ui/button";
import {Label} from "@/ui-components/ui/label";
import type {Category, CategoryErrors} from "./api";
import {useDeleteCategory} from "./use-categories";

interface Props {
    open: boolean;
    category?: Category;
    allCategories: Category[];   // für die Auswahl der Ersatzkategorie
    onClose: () => void;
}

export function DeleteCategoryDialog({open, category, allCategories, onClose}: Props) {
    const {mutate, isPending, error, reset} = useDeleteCategory();
    const [chosenId, setChosenId] = useState<string | null>(null);

    // Mögliche Ersatzkategorien: gleicher Typ, nicht die zu löschende; Standard-Kategorien zuerst
    const candidates = useMemo(
        () => allCategories
            .filter((c) => category && c.type === category.type && c.position_id !== category.position_id)
            .sort((a, b) => Number(b.is_standard) - Number(a.is_standard) || a.name.localeCompare(b.name)),
        [allCategories, category],
    );

    // Gültige Auswahl oder automatisch die erste Kandidatin
    const fallbackId =
        chosenId && candidates.some((c) => c.position_id === chosenId)
            ? chosenId
            : candidates[0]?.position_id;

    // alten Fehler beim erneuten Öffnen zurücksetzen
    useEffect(() => {
        if (open) reset();
    }, [open, reset]);

    const close = () => {
        setChosenId(null);
        onClose();
    };

    const confirm = () => {
        if (category) mutate({id: category.position_id, fallbackId}, {onSuccess: close});
    };

    const errorText = error
        ? ((error as unknown as CategoryErrors).error ?? "Löschen fehlgeschlagen. Bitte versuch es nochmal."): null;

    const entries = category?.type === "income" ? "Einkommen" : "Verträge";

    return (
        <Dialog open={open} onOpenChange={(o) => !o && close()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Kategorie löschen?</DialogTitle>
                    <DialogDescription>
                        „{category?.name}“ wird dauerhaft gelöscht.
                    </DialogDescription>
                </DialogHeader>

                {candidates.length > 0 ? (
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="fallback-category">
                            {entries} dieser Kategorie verschieben nach
                        </Label>
                        <select
                            id="fallback-category"
                            value={fallbackId}
                            onChange={(e) => setChosenId(e.target.value)}
                            className="h-9 rounded-md border bg-background px-3 text-sm"
                        >
                            {candidates.map((c) => (
                                <option key={c.position_id} value={c.position_id}>
                                    {c.name}{c.is_standard ? " (Standard)" : ""}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-muted-foreground">
                            Wird nur verwendet, wenn der Kategorie noch {entries} zugeordnet sind.
                        </p>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Es gibt keine andere Kategorie dieses Typs. Sind noch {entries} zugeordnet,
                        lege zuerst eine weitere Kategorie an.
                    </p>
                )}

                {errorText && <p className="text-sm text-destructive">{errorText}</p>}

                <DialogFooter>
                    <Button variant="outline" onClick={close}>Abbrechen</Button>
                    <Button variant="destructive" onClick={confirm} disabled={isPending}>
                        {isPending ? "Wird gelöscht..." : "Löschen"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}