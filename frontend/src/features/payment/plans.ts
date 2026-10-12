export const PRICES = {
    free: "Kostenlos",
    premium: "4,99 € / Monat",
} as const;

export const PLAN_FEATURES: {label: string; free: string; premium: string}[] = [
    {label: "Fragen an JeremyAI pro Tag", free: "2", premium: "10"},
    {label: "Kosten, Einnahmen & Dashboard", free: "✓", premium: "✓"},
    {label: "Haushalt mit mehreren Personen", free: "✓", premium: "✓"},
];