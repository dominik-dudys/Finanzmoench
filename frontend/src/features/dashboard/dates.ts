import type {CostItem, Interval} from "@/features/costs/api";

export interface MonthRef {
    month: number; // 1–12
    year: number;
}

export interface UpcomingPayment {
    id: string;
    name: string;
    amount: string;
    interval: Interval;
    date: Date;
}

const DAY = 24 * 60 * 60 * 1000;

function startOfToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

// "2026-01-15" → lokales Datum (ohne UTC-Verschiebung)
function parseISO(iso: string): Date {
    const parts = iso.split("-").map(Number);
    return new Date(parts[0] ?? 1970, (parts[1] ?? 1) - 1, parts[2] ?? 1);
}

// Tag im Monat begrenzen (31. → 30./28.)
function clampDate(year: number, month0: number, day: number): Date {
    const daysInMonth = new Date(year, month0 + 1, 0).getDate();
    return new Date(year, month0, Math.min(day, daysInMonth));
}

// Letzte n Monate inkl. aktuellem, aufsteigend
export function lastMonths(count: number): MonthRef[] {
    const now = new Date();
    const months: MonthRef[] = [];
    for (let i = count - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({month: d.getMonth() + 1, year: d.getFullYear()});
    }
    return months;
}

export function monthLabel(m: MonthRef, style: "short" | "long" = "short"): string {
    return new Date(m.year, m.month - 1, 1).toLocaleString("de-DE", {month: style});
}

// Nächstes Fälligkeitsdatum ab heute (inkl. heute), null wenn Vertrag vorher endet
export function nextPaymentDate(start: string, interval: Interval, end: string | null): Date | null {
    const today = startOfToday();
    const s = parseISO(start);
    let next: Date;

    if (s >= today) {
        next = s;
    } else {
        switch (interval) {
            case "daily":
                next = today;
                break;
            case "weekly": {
                const days = Math.round((today.getTime() - s.getTime()) / DAY);
                const weeks = Math.ceil(days / 7);
                next = new Date(s.getFullYear(), s.getMonth(), s.getDate() + weeks * 7);
                break;
            }
            case "monthly":
                next = clampDate(today.getFullYear(), today.getMonth(), s.getDate());
                if (next < today) next = clampDate(today.getFullYear(), today.getMonth() + 1, s.getDate());
                break;
            case "yearly":
                next = clampDate(today.getFullYear(), s.getMonth(), s.getDate());
                if (next < today) next = clampDate(today.getFullYear() + 1, s.getMonth(), s.getDate());
                break;
            default:
                next = today;
        }
    }

    if (end && next > parseISO(end)) return null;
    return next;
}

export function upcomingPayments(items: CostItem[], limit = 5): UpcomingPayment[] {
    const result: UpcomingPayment[] = [];
    for (const item of items) {
        if (!item.start_date) continue;
        const date = nextPaymentDate(item.start_date, item.interval, item.end_date);
        if (!date) continue;
        result.push({id: item.cost_item_id, name: item.name, amount: item.amount, interval: item.interval, date});
    }
    return result.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, limit);
}

export function relativeDay(date: Date): string {
    const days = Math.round((date.getTime() - startOfToday().getTime()) / DAY);
    if (days === 0) return "heute";
    if (days === 1) return "morgen";
    if (days < 7) return `in ${days} Tagen`;
    return date.toLocaleDateString("de-DE", {day: "2-digit", month: "2-digit", year: "numeric"});
}