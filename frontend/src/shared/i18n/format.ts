import i18n, {SUPPORTED_LANGUAGES} from "./index";

function currentLocale(): string {
    const lng = i18n.resolvedLanguage ?? "de";
    return SUPPORTED_LANGUAGES.find((l) => l.code === lng)?.locale ?? "de-DE";
}

export function formatDate(value: string | Date, options?: Intl.DateTimeFormatOptions) {
    return new Date(value).toLocaleDateString(currentLocale(), options);
}

export function formatCurrency(amount: number, currency = "EUR") {
    return new Intl.NumberFormat(currentLocale(), {style: "currency", currency}).format(amount);
}