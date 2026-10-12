import {useEffect, useState} from "react";
import {useSubscription} from "./use-subscription";
import {UpgradeDialog} from "./upgrade-dialog";
import {clearUpgradeIntent, hasUpgradeIntent} from "./upgrade-intent";

// Öffnet nach Registrierung/Login einmalig den Upgrade-Dialog,
// wenn vorher "Registrieren & upgraden" geklickt wurde
export function PendingUpgradeDialog() {
    const [intent] = useState(hasUpgradeIntent); // einmal beim Laden prüfen
    const [dismissed, setDismissed] = useState(false);
    const {data: sub} = useSubscription(false, intent);

    useEffect(() => {
        if (intent && sub) clearUpgradeIntent();
    }, [intent, sub]);

    const open = intent && !!sub && !sub.is_premium && !dismissed;

    return <UpgradeDialog open={open} onOpenChange={(o) => !o && setDismissed(true)}/>;
}