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
                        <p>Die Anwendung läuft auf einem Server bei OVH, Frankreich (Server in Polen, Warschau). Beim Aufruf werden
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
                        <p>Die von dir erfassten Einkommen, Verträge, Kosten und Kategorien speichern wir, um dir
                            deine Fixkosten und Kennzahlen anzuzeigen (Art. 6 Abs. 1 lit. b DSGVO). Kosten und
                            Kategorien sind für alle Mitglieder deines Haushalts sichtbar.</p>
                    </Section>

                    <Section title="7. JeremyAI">
                        <p>JeremyAI nutzt du nur mit deiner Einwilligung (Art. 6 Abs. 1 lit. a DSGVO), die du
                            jederzeit in den Einstellungen widerrufen kannst. Deine Fragen werden zur Beantwortung
                            an Google (Gemini) übermittelt, die Antwort zur Sprachausgabe an Fish Audio. Dabei können
                            Daten in die USA übertragen werden. Bitte gib dort keine persönlichen Daten ein.</p>
                        <p>Deine Chatverläufe speichern wir, damit Jeremy den Gesprächskontext kennt. Sie bleiben
                            gespeichert, bis du den Chat oder dein Konto löschst. Zusätzlich zählen wir deine täglichen
                            Anfragen, um das Nutzungslimit umzusetzen.</p>
                    </Section>

                    <Section title="8. Zahlungsabwicklung">
                        <p>Für Premium nutzen wir den Zahlungsdienstleister Stripe. Deine Zahlungsdaten gibst du
                            direkt bei Stripe ein, wir erhalten sie nicht. Wir speichern nur deine Stripe-Kunden- und
                            Abo-Kennung sowie den Abo-Status (Art. 6 Abs. 1 lit. b DSGVO). Dabei können Daten in die
                            USA übertragen werden. Es gelten zusätzlich die Datenschutzbestimmungen von Stripe.</p>
                    </Section>

                    <Section title="9. Speicherdauer">
                        <p>Wir speichern deine Daten, solange dein Konto besteht. Nach der Löschung des
                            Kontos werden sie entfernt.</p>
                    </Section>

                    <Section title="10. Deine Rechte">
                        <p>Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der
                            Verarbeitung, Datenübertragbarkeit und Widerspruch sowie auf Beschwerde bei einer
                            Datenschutz-Aufsichtsbehörde.</p>
                        <p>Deine Daten herunterladen und dein Konto löschen kannst du selbst unter{" "}
                            <a href="/einstellungen#datenexport" className="underline">Einstellungen → Datenschutz</a>.</p>
                    </Section>
                </CardContent>
            </Card>
        </div>
    )
}