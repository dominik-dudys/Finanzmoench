import {Button} from "@/ui-components/ui/button.tsx";
import {DashboardChartGesamtkosten} from "@/app/charts/dashboard-chart-gesamtkosten.tsx";
import {DashboardChartKategorie} from "@/app/charts/dashboard-chart-kategorie.tsx";
import {Separator} from "@/ui-components/ui/separator.tsx";

export function DashboardPage (){

    const currentMonth: string = new Date().toLocaleString('de-DE', {month: 'long'})




    return(


        <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">

            {/* Kopfzeile */}
            <header className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-lg font-semibold">Übersicht</h1>
                    <p className="text-sm text-muted-foreground"> {currentMonth} - Platzhaler Verträge </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <a>
                            Vertrag anlegen
                        </a>
                    </Button>
                </div>
            </header>

            {/* KPI-Reihe */}
            <section className="grid grid-cols-4 divide-x">
                <div>
                    <div className="text-sm text-muted-foreground px-6 first:pl-0">Fixkosten pro Monat</div>
                    <div className="">800€</div>
                    <div className="text-sm text-muted-foreground">+3%</div>
                </div>

                <div>
                    <div className="text-sm text-muted-foreground px-6">Hochrechnung Jahr</div>
                    <div className="px-6">10.000€</div>
                </div>

                <div>
                    <div className="text-sm text-muted-foreground px-6">Sparpotenzial</div>
                    <div className="px-6">10€</div>
                </div>

                <div>
                    <div className="text-sm text-muted-foreground px-6">Nächste Zahlung</div>
                    <div className="px-6">5€</div>
                    <div className="text-sm text-muted-foreground px-6">in 2 Tagen</div>
                </div>
            </section>

            {/* Kostenverlauf */}
            <section className="rounded-lg">
                    <DashboardChartGesamtkosten/>
            </section>

            {/* Untere Hälfte */}
            <section className="grid grid-cols-2 gap-12">

                {/* Nach Kategorie */}
                <div>
                    <DashboardChartKategorie/>
                </div>


                {/* Nächste Zahlungen */}
                <div>
                    <div className="mb-8 flex items-baseline justify-between">
                        <h2>Nächste Zahlungen</h2>
                        <Button variant="outline">Alle Anzeigen</Button>
                    </div>
                    <div className="flex w-full  flex-col gap-3 text-sm">
                        <dl className="flex items-center justify-between">
                            <dt>Item 1</dt>
                            <dd className="text-muted-foreground">Value 1</dd>
                        </dl>
                        <Separator />
                        <dl className="flex items-center justify-between">
                            <dt>Item 2</dt>
                            <dd className="text-muted-foreground">Value 2</dd>
                        </dl>
                        <Separator />
                        <dl className="flex items-center justify-between">
                            <dt>Item 3</dt>
                            <dd className="text-muted-foreground">Value 3</dd>
                        </dl>
                    </div>
                </div>

            </section>


        </div>

    )
}