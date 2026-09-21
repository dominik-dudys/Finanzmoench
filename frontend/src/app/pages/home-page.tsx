import {Button} from "@/ui-components/ui/button.tsx";
import {Card, CardContent} from "@/ui-components/ui/card.tsx";
import {Link} from "react-router";

const steps = [
    {
      number: 1,
      title: "Konto erstellen",
      text: "Registriere dich bei Finanzmönch"
    },
    {
      number: 2,
      title: "Fixkosten hinzufügen",
      text: "Trage Miete, Abos und Versicherungen ein"
    },
    {
      number: 3,
      title: "Überblick behalten",
      text: "Sieh auf einen Blick, was du ausgibst"
    },
]

export function HomePage() {
    return (
<>
        <section className="mx-auto max-w-2xl px-6 py-20 text-center">
         <h1 className="text-4xl font-extrabold tracking-tight text-balance md:text-5xl">
            Deine Fixkosten endlich im griff.
         </h1>
            <p className="mt-5 mb-4 text-lg text-muted-foreground">
                Finanzmönch behält deine wiederkehrenden Ausgaben im Blick, damit du es nicht musst.
            </p>
            <div className="mb-10">
                <Button variant="outline" className="h-10">
                    <Link to="/register">Kostenlos registrieren</Link>
                </Button>
            </div>

            <div className="grid grid-cols-2 gap-6 items-center">

                <img
                    src="/Avatar.png"
                    alt="Finanzmönch Maskottchen"
                    className="w-full max-w-xs md:max-w-sm mx-auto"
                />
            <Card className="flex">
                <CardContent>
                    <div className="flex items-center justify-between border-b py-3">
                        <span className="font-semibold">Miete</span>
                        <span className="text-muted-foreground">690,00€</span>
                    </div>
                    <div className="flex items-center justify-between border-b py-3">
                        <span className="font-semibold">Strom</span>
                        <span className="text-muted-foreground">54,90€</span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                        <span className="font-semibold">Miete</span>
                        <span className="text-muted-foreground">690,00€</span>
                    </div>
                </CardContent>
            </Card>


            </div>
        </section>


        <section id="features" className="mx-auto max-w-2xl px-6 py-20 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-balance md:text-5xl mb-4">
                Alles, was du brauchst.
            </h1>
            <p className="mt-5 mb-4 text-lg text-muted-foreground">
                Kein Feature-Overhead. Wirklich nur das, was hilft.
            </p>

            <div className="grid grid-cols-3 gap-4">
                <Card className="flex flex-col items-center gap-3 p-6 text-center">
                    <header className="text-lg font-semibold">Alle Fixkosten im Überblick</header>
                    <main className="ext-sm text-muted-foreground">Finanzmönch hilft dir den Überblick zu behalten</main>
                </Card>

                <Card className="flex flex-col items-center gap-3 p-6 text-center">
                    <header className="text-lg font-semibold">Erinnerungen</header>
                    <main className="ext-sm text-muted-foreground">Nie wieder eine Zahlung übersehen</main>
                </Card>

                <Card className="flex flex-col items-center gap-3 p-6 text-center">
                    <header className="text-lg font-semibold">Gemeinsame Haushalte</header>
                    <main className="text-sm text-muted-foreground">Teile Fixkosten fair mit deiner WG oder Familie.</main>
                </Card>
            </div>
        </section>

        <section id="funktioniert" className="bg-muted py-16">
            <div className="mx-auto max-w-5xl px-6">
                <div className="mx-auto mb-10 max-w-md text-center">
                    <h2 className="text-2xl font-bold">In drei Schritten startklar</h2>
                    <p className="mt-2 text-muted-foreground">Kein kompliziertes Setup nötig.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {steps.map((step) => (
                        <Card key={step.number}>
                            <CardContent>
                                <div className="mb-3 flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                                    {step.number}
                                </div>
                                <h3 className="font-semibold">{step.title}</h3>
                                <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>

        <section className="py-16">
            <div className="mx-auto max-w-5xl px-6">
                <div className="rounded-2xl bg-primary px-8 py-12 text-center text-primary-foreground">
                    <h2 className="text-2xl font-bold">
                        Bereit, deine Finanzen zu ordnen?
                    </h2>
                    <p className="mt-2 text-primary-foreground/80">
                        Kostenlos, in unter 2 Minuten eingerichtet.
                    </p>
                    <Button size="lg" className="mt-6 bg-background text-foreground hover:bg-background/90">
                    <a href="/register"> Jetzt kostenlos starten</a>
                    </Button>
                </div>
            </div>


        </section>
        </>
    )
}
