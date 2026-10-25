import type {Interval} from "./api";
import type {Household} from "@/features/household/api.ts";
import {queryClient} from "@/shared/api/query-client.ts";

export const INTERVAL_LABELS: Record<Interval, string> = {
    daily: "Tag",
    weekly: "Woche",
    monthly: "Monat",
    yearly: "Jahr",
};

const MONTHLY_FACTOR: Record<Interval, number> = {
    daily: 365 / 12,
    weekly: 52 / 12,
    monthly: 1,
    yearly: 1 / 12,
};

export function toMonthly(amount: string, interval: Interval): number {
    return Number(amount) * MONTHLY_FACTOR[interval];
}

export function formatMoney(value: number | string, currency?: string): string {
    const cur = currency
        ?? queryClient.getQueryData<Household | null>(["household", "mine"])?.currency
        ?? "EUR";
    return new Intl.NumberFormat("de-DE", {style: "currency", currency: cur}).format(Number(value));
}

export function formatDate(iso: string): string {
    // "2026-01-15" -> "15.01.2026" (ohne Zeitzonen-Verschiebung)
    const [y, m, d] = iso.split("-");
    return `${d}.${m}.${y}`;
}