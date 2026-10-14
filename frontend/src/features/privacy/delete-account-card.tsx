import {useState} from "react";
import {toast} from "sonner";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/ui-components/ui/card";
import {Button} from "@/ui-components/ui/button";
import {Input} from "@/ui-components/ui/input";
import {Label} from "@/ui-components/ui/label";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/ui-components/ui/dialog";
import {useDeleteAccount} from "./use-privacy";

interface Props {
    hasPassword: boolean;
    hasActiveSubscription: boolean;
}

function errorText(err: unknown): string {
    const e = err as {error?: string; password?: string[]} | null;
    return e?.error ?? e?.password?.[0] ?? "Das hat nicht geklappt. Bitte versuch es erneut.";
}

export function DeleteAccountCard({hasPassword, hasActiveSubscription}: Props) {
    const deleteAccount = useDeleteAccount();
    const [open, setOpen] = useState(false);
    const [password, setPassword] = useState("");

    const canDelete = hasPassword && !hasActiveSubscription;

    const openDialog = () => {
        deleteAccount.reset();
        setPassword("");
        setOpen(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        deleteAccount.mutate(
            {password},
            {onSuccess: () => toast.success("Dein Konto wurde gelöscht.")},
        );
    };

    return (
        <Card id="konto-loeschen" className="scroll-mt-24 border-destructive/40">
            <CardHeader>
                <CardTitle>Konto löschen</CardTitle>
                <CardDescription>
                    Löscht dein Konto und alle zugehörigen Daten unwiderruflich (Art. 17 DSGVO).
                    Lade dir vorher am besten deine Daten herunter.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                <Button variant="destructive" className="self-start" disabled={!canDelete} onClick={openDialog}>
                    Konto löschen
                </Button>

                {!hasPassword && (
                    <p className="text-sm text-muted-foreground">
                        Für Konten mit Google- oder GitHub-Anmeldung ist die Löschung hier noch nicht
                        möglich. Bitte wende dich an uns (siehe Impressum).
                    </p>
                )}
                {hasPassword && hasActiveSubscription && (
                    <p className="text-sm text-muted-foreground">
                        Du hast ein aktives Premium-Abo. Kündige es zuerst unter{" "}
                        <a href="/#premium" className="underline">Abo</a>, damit keine weiteren Zahlungen
                        anfallen.
                    </p>
                )}
            </CardContent>

            <Dialog open={open} onOpenChange={(o) => !deleteAccount.isPending && setOpen(o)}>
                <DialogContent>
                    <form onSubmit={submit} className="flex flex-col gap-4">
                        <DialogHeader>
                            <DialogTitle>Konto wirklich löschen?</DialogTitle>
                            <DialogDescription>
                                Dein Profil, deine Einkommen und deine JeremyAI-Chats werden endgültig
                                gelöscht. Bist du allein in deinem Haushalt, wird er mit allen Kosten
                                gelöscht. Sonst übernehmen deine Mitbewohner eure gemeinsamen Kosten.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="delete-password">Passwort zur Bestätigung</Label>
                            <Input
                                id="delete-password"
                                type="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoFocus
                            />
                        </div>

                        {deleteAccount.isError && (
                            <p className="text-sm text-destructive">{errorText(deleteAccount.error)}</p>
                        )}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={deleteAccount.isPending}
                                onClick={() => setOpen(false)}
                            >
                                Abbrechen
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={!password || deleteAccount.isPending}
                            >
                                {deleteAccount.isPending ? "Wird gelöscht..." : "Endgültig löschen"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </Card>
    );
}