import {useState} from "react";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/ui-components/ui/dialog";
import {Input} from "@/ui-components/ui/input";
import {Button} from "@/ui-components/ui/button";
import {useReauthenticate} from "./use-mfa";

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ReauthDialog({open, onClose, onSuccess}: Props) {
    const [password, setPassword] = useState("");
    const reauth = useReauthenticate();

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        reauth.mutate(password, {
            onSuccess: () => {
                setPassword("");
                onSuccess();
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                <form onSubmit={submit} className="flex flex-col gap-4">
                    <DialogHeader>
                        <DialogTitle>Passwort bestätigen</DialogTitle>
                        <DialogDescription>
                            Aus Sicherheitsgründen musst du dein Passwort erneut eingeben.
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoFocus
                    />
                    {reauth.isError && (
                        <p className="text-sm text-destructive">Passwort ist falsch.</p>
                    )}
                    <DialogFooter>
                        <Button type="submit" disabled={!password || reauth.isPending}>
                            Bestätigen
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}