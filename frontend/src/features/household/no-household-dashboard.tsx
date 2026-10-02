import {Card, CardContent, CardHeader, CardTitle} from "@/ui-components/ui/card";
import {Button} from "@/ui-components/ui/button";

export function NoHouseholdDashboard({onCreate, onJoin}: {onCreate: () => void; onJoin: () => void}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Kein Haushalt</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">
                    Du bist noch in keinem Haushalt. Erstelle einen neuen oder tritt einem bestehenden bei.
                </p>
                <div className="flex gap-3">
                    <Button onClick={onCreate}>Haushalt erstellen</Button>
                    <Button variant="outline" onClick={onJoin}>Haushalt beitreten</Button>
                </div>
            </CardContent>
        </Card>
    );
}