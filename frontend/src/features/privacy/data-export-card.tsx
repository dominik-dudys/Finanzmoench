import {Download} from "lucide-react";
import {Button} from "@/ui-components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/ui-components/ui/card";
import {useDataExport} from "./use-privacy";

export function DataExportCard() {
    const exportData = useDataExport();

    return (
        <Card id="datenexport" className="scroll-mt-24">
            <CardHeader>
                <CardTitle>Meine Daten herunterladen</CardTitle>
                <CardDescription>
                    Lade alle Daten herunter, die wir über dich gespeichert haben: Profil, Haushalt,
                    Einkommen, Kosten, Abo sowie JeremyAI-Nutzung und Chatverläufe (Art. 15 und 20 DSGVO).
                    CSV zum Öffnen in Excel, JSON für die Übertragung an andere Dienste.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        disabled={exportData.isPending}
                        onClick={() => exportData.mutate("csv")}
                    >
                        <Download />
                        CSV (Excel)
                    </Button>
                    <Button
                        variant="outline"
                        disabled={exportData.isPending}
                        onClick={() => exportData.mutate("json")}
                    >
                        <Download />
                        JSON
                    </Button>
                </div>
                {exportData.isError && (
                    <p className="text-sm text-destructive">
                        Export fehlgeschlagen. Bitte versuche es später erneut.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}