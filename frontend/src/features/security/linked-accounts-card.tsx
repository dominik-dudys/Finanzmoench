import {Card, CardContent, CardHeader, CardTitle} from "@/ui-components/ui/card";
import {Button} from "@/ui-components/ui/button";
import {isAllauthResponse} from "@/features/auth/api";
import {connectProviderUrl} from "./api";
import {useDisconnectProvider, useProviderAccounts} from "./use-security";

const PROVIDERS = [
    {id: "google", label: "Google"},
    {id: "github", label: "GitHub"},
];

export function LinkedAccountsCard({hasPassword}: {hasPassword: boolean}) {
    const {data: accounts = [], isLoading} = useProviderAccounts();
    const disconnect = useDisconnectProvider();

    // Letzter Login-Weg darf nicht getrennt werden
    const isLastLogin = !hasPassword && accounts.length === 1;

    const errorMessage =
        disconnect.error && isAllauthResponse(disconnect.error)
            ? disconnect.error.errors?.[0]?.message
            : disconnect.error ? "Trennen fehlgeschlagen." : null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Verknüpfte Konten</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                {isLoading ? (
                    <p className="text-sm text-muted-foreground">Lädt...</p>
                ) : (
                    PROVIDERS.map((p) => {
                        const account = accounts.find((a) => a.provider.id === p.id);
                        return (
                            <div key={p.id} className="flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="font-medium">{p.label}</p>
                                    <p className="truncate text-sm text-muted-foreground">
                                        {account ? account.display : "Nicht verbunden"}
                                    </p>
                                </div>
                                {account ? (
                                    <Button
                                        variant="outline"
                                        disabled={isLastLogin || disconnect.isPending}
                                        onClick={() =>
                                            disconnect.mutate({provider: p.id, account: account.uid})
                                        }
                                    >
                                        Trennen
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            window.location.href = connectProviderUrl(p.id);
                                        }}
                                    >
                                        Verbinden
                                    </Button>
                                )}
                            </div>
                        );
                    })
                )}
                {isLastLogin && (
                    <p className="text-sm text-muted-foreground">
                        Dein einziger Login-Weg kann nicht getrennt werden. Verbinde zuerst ein weiteres Konto.
                    </p>
                )}
                {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
            </CardContent>
        </Card>
    );
}