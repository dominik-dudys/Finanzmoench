import {useEffect} from "react";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/ui-components/ui/dialog";
import {Button} from "@/ui-components/ui/button";
import {formatMoney} from "@/features/costs/format";
import type {Income, IncomeErrors} from "./api";
import {useArchiveIncome} from "./use-incomes";

interface Props {
    open: boolean;
    item?: Income;
    categoryName?: string;
    onClose: () => void;
}

export function ArchiveIncomeDialog({open, item, categoryName, onClose}: Props) {
    const {mutate, isPending, error, reset} = useArchiveIncome();

    // alten Fehler beim erneuten Öffnen zurücksetzen
    useEffect(() => {
        if (open) reset();
    }, [open, reset]);

    const confirm = () => {
        if (item) mutate(item.income_id, {onSuccess: onClose});
    };

    const errorText = error
        ? ((error as unknown as IncomeErrors).error ?? "Archivieren fehlgeschlagen. Bitte versuch es nochmal.")
        : null;

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Einkommen archivieren?</DialogTitle>
                    <DialogDescription>
                        „{categoryName ?? "Einkommen"}“ über {item ? formatMoney(item.amount) : ""} endet heute
                        und zählt nicht mehr zu deinen laufenden Einnahmen. Der bisherige Verlauf bleibt erhalten.
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