import {useMemo, useState} from "react";
import {Link} from "react-router";
import {Plus} from "lucide-react";
import {Button} from "@/ui-components/ui/button";
import {useMyHousehold} from "@/features/household/use-household.ts";
import {useCategories} from "@/features/categories/use-categories";
import {useCostItems} from "@/features/costs/use-cost-items";
import {CostItemList} from "@/features/costs/cost-item-list";
import {formatMoney, toMonthly} from "@/features/costs/format";
import type {CostItem} from "@/features/costs/api";
import {CostItemFormDialog} from "@/features/costs/cost-item-form-dialog.tsx";
import {ArchiveCostItemDialog} from "@/features/costs/archive-cost-item-dialog.tsx";

type Tab = "all" | "contracts";

type DialogState = {open: boolean; item?: CostItem};

const TABS: {key: Tab; label: string}[] = [
    {key: "all", label: "Alle Kosten"},
    {key: "contracts", label: "Verträge"},
];

// Vertrag = Kostenposten mit Laufzeit
function isContract(item: CostItem): boolean {
    return item.start_date !== null;
}

export function CostPage() {
    const {data: household, isLoading: householdLoading} = useMyHousehold();
    const {data: items = [], isLoading, isError} = useCostItems();
    const {data: categories = []} = useCategories();
    const [tab, setTab] = useState<Tab>("all");
    const [form, setForm] = useState<DialogState>({open: false});
    const [toArchive, setToArchive] = useState<DialogState>({open: false});

    const visible = useMemo(
        () => (tab === "contracts" ? items.filter(isContract) : items),
        [items, tab],
    );

    const monthlyTotal = useMemo(
        () => visible.reduce((sum, i) => sum + toMonthly(i.amount, i.interval), 0),
        [visible],
    );

    if (householdLoading) {
        return <div className="p-6">Lädt...</div>;
    }

    if (!household) {
        return (
            <div className="mx-auto max-w-2xl p-6">
                <h1 className="mb-2 text-lg font-semibold">Kosten</h1>
                <p className="text-sm text-muted-foreground">
                    Kosten gehören zu einem Haushalt.{" "}
                    <Link to="/household" className="underline">Haushalt erstellen oder beitreten</Link>
                </p>
            </div>
        );
    }

    return (
        <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
            <header className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-lg font-semibold">Kosten</h1>
                    <p className="text-sm text-muted-foreground">
                        {isLoading ? "Lädt..." : `≈ ${formatMoney(monthlyTotal)} pro Monat`}
                    </p>
                </div>
                <Button onClick={() => setForm({open: true})}>
                    <Plus/> Neuer Kostenposten
                </Button>
            </header>

            {/* ---------- Tabs ---------- */}
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="tablist">
                {TABS.map((t) => {
                    const count = t.key === "contracts" ? items.filter(isContract).length : items.length;
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
                            {t.label}{!isLoading && ` (${count})`}
                        </button>
                    );
                })}
            </div>

            {isError ? (
                <p className="text-sm text-destructive">Kosten konnten nicht geladen werden.</p>
            ) : (
                <CostItemList
                    items={visible}
                    categories={categories}
                    isLoading={isLoading}
                    showContractInfo={tab === "contracts"}
                    emptyTitle={tab === "contracts" ? "Noch keine Verträge" : "Noch keine Kosten"}
                    emptyText={
                        tab === "contracts"
                            ? "Verträge sind Kostenposten mit Laufzeit, zum Beispiel Handy oder Strom."
                            : "Lege Kostenposten wie Miete oder Abos an, um deine Fixkosten zu sehen."
                    }
                    onEdit={(item) => setForm({open: true, item})}
                    onArchive={(item) => setToArchive({open: true, item})}
                />
            )}
            <CostItemFormDialog
                open={form.open}
                item={form.item}
                categories={categories}
                onClose={() => setForm((s) => ({...s, open: false}))}
            />
            <ArchiveCostItemDialog
                open={toArchive.open}
                item={toArchive.item}
                onClose={() => setToArchive((s) => ({...s, open: false}))}
            />
        </div>
    );
}