import {useMe} from "@/features/profile/use-me.ts";
import {ChangePasswordCard} from "@/features/security/change-password-card";
import {LinkedAccountsCard} from "@/features/security/linked-accounts-card";
import {TwoFactorCard} from "@/features/security/two-factor-card.tsx";
import {useLocation} from "react-router";
import {useEffect} from "react";
import {AiConsentCard} from "@/features/jeremyai/ai-consent-card.tsx";
import {PremiumCard} from "@/features/payment/premium-card";
import {useProviderAccounts} from "@/features/security/use-security.ts";
import {useAuthenticators} from "@/features/security/use-mfa.ts";
import {useSubscription} from "@/features/payment/use-subscription.ts";
import {DataExportCard, DeleteAccountCard} from "@/features/privacy";

export function SettingsPage() {
    const {data: me, isLoading} = useMe();
    const {hash} = useLocation();

    const accounts = useProviderAccounts();
    const authenticators = useAuthenticators();
    const subscription = useSubscription();
    const ready = !!me && !accounts.isLoading && !authenticators.isLoading && !subscription.isLoading;

    useEffect(()=> {
        if (!hash || !ready) return;
        const frame = requestAnimationFrame(()=>{
            document.getElementById(hash.slice(1))?.scrollIntoView({behavior: "smooth", block: "start"});
        });
        return () => cancelAnimationFrame(frame);
    }, [hash, ready]);

    if (isLoading || !me) return <div className="p-6">Lädt...</div>;

    return (
        <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
            <h2 className="text-lg font-semibold">Sicherheit</h2>
            <LinkedAccountsCard hasPassword={me.has_password} />
            <ChangePasswordCard hasPassword={me.has_password} />
            <TwoFactorCard />

            <h2 className="text-lg font-semibold">JeremyAI</h2>
            <AiConsentCard me={me}/>

            <h2 className="text-lg font-semibold">Abo</h2>
            <PremiumCard/>

            <h2 className="text-lg font-semibold">Datenschutz</h2>
            <DataExportCard/>

            <DeleteAccountCard
                hasPassword={me.has_password}
                hasActiveSubscription={
                    !!subscription.data?.is_premium && !subscription.data.cancel_at_period_end
                }
            />
        </div>
    );
}