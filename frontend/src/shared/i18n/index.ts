import i18n from "i18next";
import {initReactI18next} from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import de from "./locales/de/common.json";
import en from "./locales/en/common.json";

export const SUPPORTED_LANGUAGES = [
    {code: "de", label: "Deutsch", locale: "de-DE"},
    {code: "en", label: "English", locale: "en-GB"},
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

export const resources = {
    de: {common: de},
    en: {common: en},
} as const;

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        defaultNS: "common",
        fallbackLng: "de",
        supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
        nonExplicitSupportedLngs: true, // "de-AT" → "de"
        load: "languageOnly",
        interpolation: {escapeValue: false}, // React escaped selbst
        detection: {
            order: ["localStorage", "navigator"],
            caches: ["localStorage"],
            lookupLocalStorage: "finanzmoench-lang",
        },
    });

// <html lang="..."> aktuell halten (Screenreader, Browser-Übersetzung)
i18n.on("languageChanged", (lng) => {
    document.documentElement.lang = lng;
});

export default i18n;