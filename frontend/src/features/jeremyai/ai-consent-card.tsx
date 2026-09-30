import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/ui-components/ui/card";
import {Switch} from "@/ui-components/ui/switch";
import {Label} from "@/ui-components/ui/label";
import {useUpdateMe} from "@/features/profile/use-me.ts";
import type {Person} from "@/features/profile/api.ts";

export function AiConsentCard({me}: {me: Person}) {
    const updateMe = useUpdateMe();
    const consented = me.ai_consent_at !== null;

    return (
        <Card id="jeremy" className="scroll-mt-6">
            <CardHeader>
                <CardTitle>JeremyAI</CardTitle>
                <CardDescription>
                    Deine Fragen an Jeremy werden zur Beantwortung an Google (Gemini) übermittelt,
                    die Antwort zur Sprachausgabe an Fish Audio. Mehr dazu in der{" "}
                    <a href="/datenschutz" className="underline">Datenschutzerklärung</a>.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                    <Label htmlFor="ai-consent">Ich willige in die Datenverarbeitung durch JeremyAI ein</Label>
                    <Switch
                        id="ai-consent"
                        checked={consented}
                        disabled={updateMe.isPending}
                        onCheckedChange={(checked) => updateMe.mutate({ai_consent: checked})}
                    />
                </div>
                {consented && (
                    <p className="text-sm text-muted-foreground">
                        Eingewilligt am {new Date(me.ai_consent_at!).toLocaleDateString("de-DE")}.
                        Du kannst die Einwilligung jederzeit widerrufen.
                    </p>
                )}
                {updateMe.isError && (
                    <p className="text-sm text-destructive">Speichern fehlgeschlagen.</p>
                )}
            </CardContent>
        </Card>
    );
}