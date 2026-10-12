import {useEffect, useState} from "react";
import {toast} from "sonner";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/ui-components/ui/dialog";
import {Button} from "@/ui-components/ui/button";
import {Switch} from "@/ui-components/ui/switch";
import {Label} from "@/ui-components/ui/label";
import {useUpdateMe} from "@/features/profile/use-me.ts";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AiConsentDialog({open, onOpenChange}: Props) {
    const updateMe = useUpdateMe();
    const {reset} = updateMe;
    const [satire, setSatire] = useState(false);

    // alten Fehler beim erneuten Öffnen zurücksetzen
    useEffect(() => {
        if (open) reset();
    }, [open, reset]);

    const confirm = () =>
        updateMe.mutate(
            {ai_consent: true, jeremy_mode: satire ? "satire" : "serious"},
            {
                onSuccess: () => {
                    onOpenChange(false);
                    toast.success("Jeremy ist aktiviert – stell deine erste Frage!");
                },
            },
        );

    return (
        <Dialog open={open} onOpenChange={(o) => !updateMe.isPending && onOpenChange(o)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>JeremyAI aktivieren</DialogTitle>
                    <DialogDescription>
                        Deine Fragen an Jeremy werden zur Beantwortung an Google (Gemini) übermittelt,
                        die Antwort zur Sprachausgabe an Fish Audio. Mehr dazu in der{" "}
                        <a href="/datenschutz" className="underline">Datenschutzerklärung</a>.
                        Du kannst die Einwilligung jederzeit in den Einstellungen widerrufen.
                    </DialogDescription>
                </DialogHeader>

                {/* ---------- Modus ---------- */}
                <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
                    <div className="flex flex-col gap-1">
                        <Label htmlFor="consent-satire" className={satire ? "text-destructive" : undefined}>
                            Satire-Modus
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            Übertriebene, nicht ernst gemeinte Antworten. Jederzeit umschaltbar.
                        </p>
                    </div>
                    <Switch
                        id="consent-satire"
                        checked={satire}
                        onCheckedChange={setSatire}
                        className="data-checked:bg-destructive"
                    />
                </div>

                {updateMe.isError && (
                    <p className="text-sm text-destructive">Aktivieren fehlgeschlagen. Bitte versuch es erneut.</p>
                )}

                <DialogFooter>
                    <Button type="button" variant="outline" disabled={updateMe.isPending} onClick={() => onOpenChange(false)}>
                        Abbrechen
                    </Button>
                    <Button type="button" disabled={updateMe.isPending} onClick={confirm}>
                        {updateMe.isPending ? "Wird aktiviert..." : "Einwilligen & starten"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}