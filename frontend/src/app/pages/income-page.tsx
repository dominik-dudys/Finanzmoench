import {useMemo, useState} from "react";
import {Link} from "react-router";
import {Plus} from "lucide-react";
import {Button} from "@/ui-components/ui/button";
import {useHouseholdMembers, useMyHousehold} from "@/features/household/use-household.ts";
import {useCategories} from "@/features/categories/use-categories";
import {useMe} from "@/features/profile/use-me.ts";
import {formatMoney} from "@/features/costs/format";
import {ArchiveRangePicker} from "@/shared/components/archive-range-picker";
import {sampleDates, type ArchiveRange} from "@/shared/lib/archive-range";
import type {Income} from "@/features/incomes/api";
import {useEndedIncomes, useIncomes} from "@/features/incomes/use-incomes";
import {IncomeList} from "@/features/incomes/income-list";
import {IncomeFormDialog} from "@/features/incomes/income-form-dialog";
import {ArchiveIncomeDialog} from "@/features/incomes/archive-income-dialog";

type Tab = "all" | "mine";

type DialogState = {open: boolean; item?: Income};

const TABS: {key: Tab; label: string}[] = [
    {key: "all", label: "Haushalt"},
    {key: "mine", label: "Meine"},
];

const RANGE_TEXT: Record<ArchiveRange, string> = {
    "1m": "im letzten Monat",
    "3m": "in den letzten 3 Monaten",
    "1y": "im letzten Jahr",
};

export function IncomePage() {
    const {data: household, isLoading: householdLoading} = useMyHousehold();
    const {data: items = [], isLoading, isError} = useIncomes();
    const {data: categories = []} = useCategories();
    const {data: members = []} = useHouseholdMembers(!!household);
    const {data: me} = useMe();
    const [tab, setTab] = useState<Tab>("all");
    const [range, setRange] = useState<ArchiveRange | null>(null);
    const [form, setForm] = useState<DialogState>({open: false});
    const [toArchive, setToArchive] = useState<DialogState>({open: false});

    const isArchive = range !== null;
    const dates = useMemo(() => (range ? sampleDates(range) : []), [range]);
    const activeIds = useMemo(() => new Set(items.map((i) => i.income_id)), [items]);
    const ended = useEndedIncomes(dates, activeIds);

    // Quelle: aktuelle Einträge oder Archiv
    const source = isArchive ? ended.items : items;
    // Archiv braucht auch die aktive Liste, sonst würde alles als beendet gelten
    const listLoading = isArchive ? (ended.isLoading || isLoading) : isLoading;
    const listError = isArchive ? (ended.isError || isError) : isError;

    const myId = me?.person_id;
    const mine = source.filter((i) => i.person === myId);
    const visible = tab === "mine" ? mine : source;

    const monthlyTotal = visible.reduce((sum, i) => sum + Number(i.amount), 0);

    const archiveCategoryName = categories.find(
        (c) => c.position_id === toArchive.item?.position_category,
    )?.name;

    if (householdLoading) {
        return <div className="p-6">Lädt...</div>;
    }

    if (!household) {
        return (
            <div className="mx-auto max-w-2xl p-6">
                <h1 className="mb-2 text-lg font-semibold">Einnahmen</h1>
                <p className="text-sm text-muted-foreground">
                    Einnahmen gehören zu einem Haushalt.{" "}
                    <Link to="/household" className="underline">Haushalt erstellen oder beitreten</Link>
                </p>
            </div>
        );
    }

    const summary = listLoading
        ? "Lädt..."
        : isArchive
            ? `${visible.length} ${visible.length === 1 ? "Eintrag" : "Einträge"} ${RANGE_TEXT[range]} beendet`
            : `${formatMoney(monthlyTotal)} pro Monat`;

    return (
        <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
            <header className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="text-lg font-semibold">Einnahmen</h1>
                    <p className="text-sm text-muted-foreground">{summary}</p>
                </div>
                {!isArchive && (
                    <Button onClick={() => setForm({open: true})}>
                        <Plus/> Neues Einkommen
                    </Button>
                )}
            </header>

            {/* ---------- Tabs ---------- */}
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="tablist">
                {TABS.map((t) => {
                    const count = t.key === "mine" ? mine.length : source.length;
                    const active = tab === t.key;
                    return (
                        <button
                            key={t.key}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => setTab(t.key)}
                            className={
                                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors " +
                                (active ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")
                            }
                        >
                            {t.label}{!listLoading && ` (${count})`}
                        </button>
                    );
                })}
            </div>

            {/* ---------- Archiv ---------- */}
            <ArchiveRangePicker value={range} onChange={setRange}/>

            {listError ? (
                <p className="text-sm text-destructive">Einnahmen konnten nicht geladen werden.</p>
            ) : (
                <IncomeList
                    items={visible}
                    categories={categories}
                    members={members}
                    myId={myId}
                    isLoading={listLoading}
                    readOnly={isArchive}
                    lastSeen={isArchive ? ended.lastSeen : undefined}
                    emptyTitle={
                        isArchive
                            ? "Keine beendeten Einnahmen"
                            : tab === "mine" ? "Du hast noch kein Einkommen hinterlegt" : "Noch keine Einnahmen"
                    }
                    emptyText={
                        isArchive
                            ? "Wähle einen längeren Zeitraum oder geh zurück zur aktuellen Ansicht."
                            : "Hinterlege dein monatliches Nettoeinkommen, z. B. Gehalt oder Nebenjob."
                    }
                    onEdit={(item) => setForm({open: true, item})}
                    onArchive={(item) => setToArchive({open: true, item})}
                />
            )}

            <IncomeFormDialog
                open={form.open}
                item={form.item}
                categories={categories}
                onClose={() => setForm((s) => ({...s, open: false}))}
            />
            <ArchiveIncomeDialog
                open={toArchive.open}
                item={toArchive.item}
                categoryName={archiveCategoryName}
                onClose={() => setToArchive((s) => ({...s, open: false}))}
            />
        </div>
    );
}