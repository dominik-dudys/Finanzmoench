import {useEffect} from "react";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/ui-components/ui/dialog";
import {Button} from "@/ui-components/ui/button";
import type {CostItem, CostItemErrors} from "./api";
import {useArchiveCostItem} from "./use-cost-items";

interface Props {
    open: boolean;
    item?: CostItem;
    onClose: () => void;
}

export function ArchiveCostItemDialog({open, item, onClose}: Props) {
    const {mutate, isPending, error, reset} = useArchiveCostItem();

    // alten Fehler beim erneuten Öffnen zurücksetzen
    useEffect(() => {
        if (open) reset();
    }, [open, reset]);

    const confirm = () => {
        if (item) mutate(item.cost_item_id, {onSuccess: onClose});
    };

    const errorText = error
        ? ((error as unknown as CostItemErrors).error ?? "Archivieren fehlgeschlagen. Bitte versuch es nochmal.")
        : null;

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Kostenposten archivieren?</DialogTitle>
                    <DialogDescription>
                        „{item?.name}“ wird beendet und taucht nicht mehr in deinen laufenden Kosten auf.
                        Der bisherige Verlauf bleibt erhalten.
                    </DialogDescription>
                </DialogHeader>

                {errorText && <p className="text-sm text-destructive">{errorText}</p>}

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>Abbrechen</Button>
                    <Button type="button" variant="destructive" disabled={isPending} onClick={confirm}>
                        {isPending ? "Wird archiviert..." : "Archivieren"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}