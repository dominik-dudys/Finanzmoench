import {useMemo, useState} from "react";
import {Link} from "react-router";
import {Plus} from "lucide-react";
import {Button} from "@/ui-components/ui/button";
import {useHouseholdMembers, useMyHousehold} from "@/features/household/use-household.ts";
import {useCategories} from "@/features/categories/use-categories";
import {useMe} from "@/features/profile/use-me.ts";
import {formatMoney} from "@/features/costs/format";
import type {Income} from "@/features/incomes/api";
import {useIncomes} from "@/features/incomes/use-incomes";
import {IncomeList} from "@/features/incomes/income-list";
import {IncomeFormDialog} from "@/features/incomes/income-form-dialog";
import {ArchiveIncomeDialog} from "@/features/incomes/archive-income-dialog";

type Tab = "all" | "mine";

type DialogState = {open: boolean; item?: Income};

const TABS: {key: Tab; label: string}[] = [
    {key: "all", label: "Haushalt"},
    {key: "mine", label: "Meine"},
];

export function IncomePage() {
    const {data: household, isLoading: householdLoading} = useMyHousehold();
    const {data: items = [], isLoading, isError} = useIncomes();
    const {data: categories = []} = useCategories();
    const {data: members = []} = useHouseholdMembers(!!household);
    const {data: me} = useMe();
    const [tab, setTab] = useState<Tab>("all");
    const [form, setForm] = useState<DialogState>({open: false});
    const [toArchive, setToArchive] = useState<DialogState>({open: false});

    const myId = me?.person_id;
    const mine = useMemo(() => items.filter((i) => i.person === myId), [items, myId]);
    const visible = tab === "mine" ? mine : items;

    const monthlyTotal = useMemo(
        () => visible.reduce((sum, i) => sum + Number(i.amount), 0),
        [visible],
    );

    const archiveCategoryName = categories.find(
        (c) => c.position_id === toArchive.item?.position_category,
    )?.name;

    if (householdLoading) {
        return <div className="p-6">Lädt...</div>;
    }

    if (!household) {
        return (
            <div className="mx-auto max-w-2xl p-6">
                <h1 className="mb-2 text-lg font-semibold">Einkommen</h1>
                <p className="text-sm text-muted-foreground">
                    Einnahmen gehören zu einem Haushalt.{" "}
                    <Link to="/household" className="underline">Haushalt erstellen oder beitreten</Link>
                </p>
            </div>
        );
    }

    return (
        <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
            <header className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-lg font-semibold">Einkommen</h1>
                    <p className="text-sm text-muted-foreground">
                        {isLoading ? "Lädt..." : `${formatMoney(monthlyTotal)} pro Monat`}
                    </p>
                </div>
                <Button onClick={() => setForm({open: true})}>
                    <Plus/> Neues Einkommen
                </Button>
            </header>

            {/* ---------- Tabs ---------- */}
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="tablist">
                {TABS.map((t) => {
                    const count = t.key === "mine" ? mine.length : items.length;
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
                <p className="text-sm text-destructive">Einnahmen konnten nicht geladen werden.</p>
            ) : (
                <IncomeList
                    items={visible}
                    categories={categories}
                    members={members}
                    myId={myId}
                    isLoading={isLoading}
                    emptyTitle={tab === "mine" ? "Du hast noch kein Einkommen hinterlegt" : "Noch keine Einnahmen"}
                    emptyText="Hinterlege dein monatliches Nettoeinkommen, z. B. Gehalt oder Nebenjob."
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