import {useMe} from "@/features/profile/use-me.ts";
import {ChangePasswordCard} from "@/features/security/change-password-card";
import {LinkedAccountsCard} from "@/features/security/linked-accounts-card";

export function SettingsPage() {
    const {data: me, isLoading} = useMe();
    if (isLoading || !me) return <div className="p-6">Lädt...</div>;

    return (
        <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
            <h2 className="text-lg font-semibold">Sicherheit</h2>
            <LinkedAccountsCard hasPassword={me.has_password} />
            <ChangePasswordCard hasPassword={me.has_password} />
        </div>
    );
}