import {useEffect} from "react";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/ui-components/ui/dialog";
import {Button} from "@/ui-components/ui/button";
import type {Category} from "./api";
import {useDeleteCategory} from "./use-categories";

interface Props {
    open: boolean;
    category?: Category;
    onClose: () => void;
}

export function DeleteCategoryDialog({open, category, onClose}: Props) {
    const {mutate, isPending, isError, reset} = useDeleteCategory();
    const count = category?.contract_count ?? 0;

    // alten Fehler beim erneuten Öffnen zurücksetzen
    useEffect(() => {
        if (open) reset();
    }, [open, reset]);

    const confirm = () => {
        if (category) mutate(category.position_id, {onSuccess: onClose});
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Kategorie löschen?</DialogTitle>
                    <DialogDescription>
                        „{category?.name}“ wird dauerhaft gelöscht.
                        {count > 0 && (
                            <>
                                {" "}{count === 1 ? "1 Vertrag verliert" : `${count} Verträge verlieren`} damit
                                ihre Kategorie. Die Verträge selbst bleiben erhalten.
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {isError && <p className="text-sm text-destructive">Löschen fehlgeschlagen. Bitte versuch es nochmal.</p>}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Abbrechen</Button>
                    <Button variant="destructive" onClick={confirm} disabled={isPending}>
                        {isPending ? "Wird gelöscht..." : "Löschen"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}