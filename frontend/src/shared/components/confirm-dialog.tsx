import type {ReactNode} from "react";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/ui-components/ui/dialog";
import {Button} from "@/ui-components/ui/button";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: ReactNode;
    confirmLabel: string;
    pendingLabel?: string;
    destructive?: boolean;
    pending?: boolean;
    error?: string | null;
    onConfirm: () => void;
}

export function ConfirmDialog({open, onOpenChange, title, description, confirmLabel, pendingLabel = "Bitte warten...", destructive = false, pending = false, error, onConfirm,}: Props) {
    return (
        // Während die Aktion läuft, lässt sich der Dialog nicht schließen
        <Dialog open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <DialogFooter>
                    <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
                        Abbrechen
                    </Button>
                    <Button
                        type="button"
                        variant={destructive ? "destructive" : "default"}
                        disabled={pending}
                        onClick={onConfirm}
                    >
                        {pending ? pendingLabel : confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}