export type ArchiveRange = "1m" | "3m" | "1y";

export const ARCHIVE_RANGES: {key: ArchiveRange; label: string; months: number; stepDays: number}[] = [
    {key: "1m", label: "Letzter Monat", months: 1, stepDays: 2},
    {key: "3m", label: "Letzte 3 Monate", months: 3, stepDays: 7},
    {key: "1y", label: "Letztes Jahr", months: 12, stepDays: 14},
];

// Lokales Datum als YYYY-MM-DD (ohne UTC-Verschiebung)
function toISODate(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Stichtage im Zeitraum, absteigend ab gestern.
// Ab gestern, weil heute archivierte Einträge bei ?date=heute schon fehlen.
export function sampleDates(range: ArchiveRange): string[] {
    const cfg = ARCHIVE_RANGES.find((r) => r.key === range);
    if (!cfg) return [];

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setMonth(start.getMonth() - cfg.months);

    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - 1);

    const dates: string[] = [];
    while (d >= start) {
        dates.push(toISODate(d));
        d.setDate(d.getDate() - cfg.stepDays);
    }
    return dates;
}