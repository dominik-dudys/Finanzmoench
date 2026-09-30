import {Card, CardContent, CardHeader, CardTitle} from "@/ui-components/ui/card.tsx";
import {Separator} from "@/ui-components/ui/separator.tsx";

export function ImpressumPage(){

    return(

        <div className="flex justify-center px-4 py-12">
            <Card className="w-full max-w-3xl min-h-[60vh]">
                <CardHeader>
                    <CardTitle className="text-3xl">Impressum</CardTitle>
                </CardHeader>

                <CardContent className="space-y-6 text-sm leading-relaxed">
                    <section className="space-y-1">
                        <h2 className="text-base font-semibold">Angaben gemäß § 5 DDG</h2>
                        <p>Julian Eichhorn</p>
                        <p>Expo Plaza 11</p>
                        <p>30539 Hannover</p>
                    </section>

                    <section className="space-y-1">
                        <h2 className="text-base font-semibold">Kontakt</h2>
                        <p>E-Mail: do-not-reply@finanzmönch.de</p>
                    </section>

                    <Separator/>

                    <section className="space-y-1">
                        <h2 className="text-base font-semibold">Hinweis</h2>
                        <p className="text-muted-foreground">
                            Finanzmönch ist ein nicht-kommerzielles Studienprojekt im Rahmen
                            des Studiums an der Leibniz-FH Hannover. Jegliche Daten werden nach Abgabe gelöscht.
                            Fotos, Videos und Text sind Satire und sollen nicht ernst genommen werden. Jegliche
                            Inhalte dienen ausschließlich der Abgabe.
                        </p>
                    </section>
                </CardContent>
            </Card>
        </div>
    )
}