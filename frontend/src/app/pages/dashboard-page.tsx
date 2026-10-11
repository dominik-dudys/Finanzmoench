import {useMemo} from "react";
import {Link} from "react-router";
import {buttonVariants} from "@/ui-components/ui/button.tsx";
import {Skeleton} from "@/ui-components/ui/skeleton";
import {DashboardChartGesamtkosten} from "@/app/charts/dashboard-chart-gesamtkosten.tsx";
import {DashboardChartKategorie} from "@/app/charts/dashboard-chart-kategorie.tsx";
import {useMyHousehold} from "@/features/household/use-household.ts";
import {useCostItems} from "@/features/costs/use-cost-items";
import {formatMoney} from "@/features/costs/format";
import {useDashboardSeries} from "@/features/dashboard/use-dashboard";
import {lastMonths, monthLabel, relativeDay, upcomingPayments} from "@/features/dashboard/dates";
import {UpcomingPayments} from "@/features/dashboard/upcoming-payments";
import {PersonBreakdown} from "@/features/dashboard/person-breakdown";

const MONTHS = 6;

const percent = new Intl.NumberFormat("de-DE", {maximumFractionDigits: 1, signDisplay: "exceptZero"});

function Kpi({label, value, sub, tone}: {label: string; value: string; sub?: string; tone?: "negative"}) {
    return (
        <div className="flex flex-col gap-1 rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={"text-xl font-semibold " + (tone === "negative" ? "text-destructive" : "")}>{value}</p>
            {sub && <p className="truncate text-sm text-muted-foreground">{sub}</p>}
        </div>
    );
}

export function DashboardPage() {
    const months = useMemo(() => lastMonths(MONTHS), []);
    const {data: household, isLoading: householdLoading} = useMyHousehold();
    const series = useDashboardSeries(months, !!household);
    const {data: costItems = []} = useCostItems();

    const current = series.data.at(-1);
    const previous = series.data.at(-2);
    const currentMonth = months.at(-1);

    const upcoming = useMemo(() => upcomingPayments(costItems), [costItems]);

    const chartData = months.map((m, i) => ({
        label: monthLabel(m),
        costs: Number(series.data[i]?.overview.total_costs ?? 0),
        income: Number(series.data[i]?.overview.total_income ?? 0),
    }));

    // ---------- Zustände ----------
    if (householdLoading) {
        return <div className="p-6">Lädt...</div>;
    }

    if (!household) {
        return (
            <div className="mx-auto max-w-2xl p-6">
                <h1 className="mb-2 text-lg font-semibold">Übersicht</h1>
                <p className="text-sm text-muted-foreground">
                    Das Dashboard zeigt die Finanzen deines Haushalts.{" "}
                    <Link to="/household" className="underline">Haushalt erstellen oder beitreten</Link>
                </p>
            </div>
        );
    }

    if (series.isError) {
        return (
            <div className="mx-auto max-w-6xl p-6">
                <h1 className="mb-2 text-lg font-semibold">Übersicht</h1>
                <p className="text-sm text-destructive">Das Dashboard konnte nicht geladen werden.</p>
            </div>
        );
    }

    if (series.isLoading || !current) {
        return (
            <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
                <Skeleton className="h-8 w-40"/>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-lg"/>)}
                </div>
                <Skeleton className="h-72 rounded-lg"/>
            </div>
        );
    }

    // ---------- Kennzahlen ----------
    const costs = Number(current.overview.total_costs);
    const income = Number(current.overview.total_income);
    const surplus = Number(current.overview.total_surplus);
    const ratio = Number(current.overview.expense_ratio_percentage);
    const prevCosts = previous ? Number(previous.overview.total_costs) : 0;
    const change = prevCosts > 0 ? ((costs - prevCosts) / prevCosts) * 100 : null;
    const next = upcoming[0];

    const isEmpty = costs === 0 && income === 0;

    return (
        <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
            {/* Kopfzeile */}
            <header className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-lg font-semibold">Übersicht</h1>
                    <p className="text-sm text-muted-foreground">
                        {currentMonth && `${monthLabel(currentMonth, "long")} ${currentMonth.year}`}
                    </p>
                </div>
                <Link to="/cost" className={buttonVariants({variant: "outline"})}>
                    Kosten verwalten
                </Link>
            </header>

            {isEmpty && (
                <div className="rounded-lg border border-dashed p-6 text-center">
                    <p className="font-medium">Noch keine Daten</p>
                    <p className="text-sm text-muted-foreground">
                        Lege deine <Link to="/cost" className="underline">Kosten</Link> und{" "}
                        <Link to="/income" className="underline">Einnahmen</Link> an, dann füllt sich die Übersicht.
                    </p>
                </div>
            )}

            {/* KPI-Reihe */}
            <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Kpi
                    label="Fixkosten pro Monat"
                    value={formatMoney(costs)}
                    sub={change === null ? undefined : `${percent.format(change)} % zum Vormonat`}
                />
                <Kpi
                    label="Hochrechnung Jahr"
                    value={formatMoney(costs * 12)}
                />
                <Kpi
                    label="Überschuss pro Monat"
                    value={formatMoney(surplus)}
                    sub={income > 0 ? `Ausgabenquote ${percent.format(ratio).replace("+", "")} %` : "Noch keine Einnahmen"}
                    tone={surplus < 0 ? "negative" : undefined}
                />
                <Kpi
                    label="Nächste Zahlung"
                    value={next ? formatMoney(next.amount) : "–"}
                    sub={next ? `${next.name} · ${relativeDay(next.date)}` : "Kein Startdatum hinterlegt"}
                />
            </section>

            {/* Verlauf */}
            <DashboardChartGesamtkosten data={chartData}/>

            {/* Untere Hälfte */}
            <section className="grid gap-6 lg:grid-cols-2">
                <DashboardChartKategorie categories={current.cost_categories} total={costs}/>
                <UpcomingPayments items={upcoming}/>
            </section>

            {current.persons.length > 1 && <PersonBreakdown persons={current.persons}/>}
        </div>
    );
}