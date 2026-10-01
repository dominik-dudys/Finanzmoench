import {useMe} from "@/features/profile/use-me.ts";
import {ChangePasswordCard} from "@/features/security/change-password-card";
import {LinkedAccountsCard} from "@/features/security/linked-accounts-card";
import {TwoFactorCard} from "@/features/security/two-factor-card.tsx";
import {useLocation} from "react-router";
import {useEffect} from "react";
import {AiConsentCard} from "@/features/jeremyai/ai-consent-card.tsx";

export function SettingsPage() {
    const {data: me, isLoading} = useMe();
    const {hash} = useLocation();

    useEffect(()=> {
        if (!hash || !me) return;
        document.getElementById(hash.slice(1))?.scrollIntoView({behavior: "smooth"});
    }, [hash, me]);

    if (isLoading || !me) return <div className="p-6">Lädt...</div>;

    return (
        <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
            <h2 className="text-lg font-semibold">Sicherheit</h2>
            <LinkedAccountsCard hasPassword={me.has_password} />
            <ChangePasswordCard hasPassword={me.has_password} />
            <TwoFactorCard />

            <h2 className="text-lg font-semibold">JeremyAI</h2>
            <AiConsentCard me={me}/>
        </div>
    );
}