import type {ReactNode} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/ui-components/ui/card.tsx";
import {Link} from "react-router";

function Section({title, children}: {title: string; children: ReactNode}) {
    return (
        <section className="space-y-2">
            <h2 className="text-base font-semibold">{title}</h2>
            {children}
        </section>
    );
}


export function DatenschutzPage(){
    return(
        <div className="flex justify-center px-4 py-12">
            <Card className="w-full max-w-3xl">
                <CardHeader>
                    <CardTitle className="text-3xl">Datenschutzerklärung</CardTitle>
                </CardHeader>

                <CardContent className="space-y-6 text-sm leading-relaxed">
                    <Section title="1. Verantwortlicher">
                        <p>Verantwortlich für die Datenverarbeitung ist die im{" "}
                            <Link to="/impressum" className="underline">Impressum</Link> genannte Person.
                            Finanzmönch ist ein nicht-kommerzielles Studienprojekt.</p>
                    </Section>

                    <Section title="2. Hosting und Server-Logs">
                        <p>Die Anwendung läuft auf einem Server bei [OHV, Frankreich (Server in Polen)]. Beim Aufruf werden
                            technisch notwendige Daten (IP-Adresse, Zeitpunkt, angefragte Seite) verarbeitet,
                            um den Betrieb und die Sicherheit zu gewährleisten (Art. 6 Abs. 1 lit. f DSGVO).</p>
                    </Section>

                    <Section title="3. Registrierung und Nutzerkonto">
                        <p>Für ein Konto speichern wir E-Mail-Adresse, Vor- und Nachname sowie dein Passwort
                            (nur verschlüsselt als Hash). Die Verarbeitung ist zur Bereitstellung des Kontos
                            erforderlich (Art. 6 Abs. 1 lit. b DSGVO). Für Bestätigungs- und Login-Codes
                            versenden wir E-Mails über IONOS.</p>
                    </Section>

                    <Section title="4. Anmeldung mit Google oder GitHub">
                        <p>Wenn du dich mit Google oder GitHub anmeldest, erhalten wir von dort deinen Namen,
                            deine E-Mail-Adresse und eine Nutzerkennung. Dabei können Daten in die USA
                            übertragen werden. Es gelten zusätzlich die Datenschutzbestimmungen des jeweiligen
                            Anbieters.</p>
                    </Section>

                    <Section title="5. Cookies">
                        <p>Wir verwenden ausschließlich technisch notwendige Cookies: ein Sitzungs-Cookie
                            für die Anmeldung (Gültigkeit 8 Stunden) und ein Sicherheits-Cookie zum Schutz vor
                            gefälschten Anfragen (CSRF). Tracking- oder Werbe-Cookies setzen wir nicht ein.</p>
                    </Section>

                    <Section title="6. Finanzdaten">
                        <p>Die von dir erfassten Verträge, Kosten und Kategorien speichern wir, um dir deine
                            Fixkosten anzuzeigen. Diese Daten sind für alle Mitglieder deines Haushalts
                            sichtbar.</p>
                    </Section>

                    <Section title="7. JeremyAI">
                        <p>Fragen an JeremyAI werden zur Beantwortung an Google (Gemini) übermittelt, die
                            Antwort zur Sprachausgabe an Fish Audio. Bitte gib dort keine persönlichen Daten
                            ein.</p>
                    </Section>

                    <Section title="8. Speicherdauer">
                        <p>Wir speichern deine Daten, solange dein Konto besteht. Nach der Löschung des
                            Kontos werden sie entfernt.</p>
                    </Section>

                    <Section title="9. Deine Rechte">
                        <p>Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der
                            Verarbeitung, Datenübertragbarkeit und Widerspruch. Außerdem kannst du dich bei
                            einer Datenschutz-Aufsichtsbehörde beschweren, z. B. bei der Landesbeauftragten
                            für den Datenschutz Niedersachsen.</p>
                    </Section>
                </CardContent>
            </Card>
        </div>
    )
}