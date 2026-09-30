import {useTranslation} from "react-i18next";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/ui-components/ui/card";
import {Button} from "@/ui-components/ui/button";
import {SUPPORTED_LANGUAGES} from "@/shared/i18n";

export function LanguageCard() {
    const {t, i18n} = useTranslation();
    const current = i18n.resolvedLanguage;

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t("settings.language.title")}</CardTitle>
                <CardDescription>{t("settings.language.description")}</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
                {SUPPORTED_LANGUAGES.map((l) => (
                    <Button
                        key={l.code}
                        variant={current === l.code ? "default" : "outline"}
                        aria-pressed={current === l.code}
                        onClick={() => i18n.changeLanguage(l.code)}
                    >
                        {l.label}
                    </Button>
                ))}
            </CardContent>
        </Card>
    );
}