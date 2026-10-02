import {useMemo, useState} from "react";
import {Link} from "react-router";
import {Plus} from "lucide-react";
import {Button} from "@/ui-components/ui/button";
import {useMyHousehold} from "@/features/household/use-household.ts";
import {useCategories} from "@/features/categories/use-categories";
import {CategoryList} from "@/features/categories/category-list";
import {CategoryFormDialog} from "@/features/categories/category-form-dialog";
import {DeleteCategoryDialog} from "@/features/categories/delete-category-dialog";
import type {Category, CategoryType} from "@/features/categories/api";

type DialogState = {open: boolean; category?: Category};

const TABS: {type: CategoryType; label: string}[] = [
    {type: "cost", label: "Ausgaben"},
    {type: "income", label: "Einkommen"},
];

export function KategoriePage() {
    const {data: household, isLoading: householdLoading} = useMyHousehold();
    const {data: categories = [], isLoading, isError} = useCategories();
    const [tab, setTab] = useState<CategoryType>("cost");
    const [form, setForm] = useState<DialogState>({open: false});
    const [toDelete, setToDelete] = useState<DialogState>({open: false});

    const visible = useMemo(
        () => categories.filter((c) => c.type === tab),
        [categories, tab],
    );

    if (householdLoading) {
        return <div className="p-6">Lädt...</div>;
    }

    if (!household) {
        return (
            <div className="mx-auto max-w-2xl p-6">
                <h1 className="mb-2 text-lg font-semibold">Kategorien</h1>
                <p className="text-sm text-muted-foreground">
                    Kategorien gehören zu einem Haushalt.{" "}
                    <Link to="/household" className="underline">Haushalt erstellen oder beitreten</Link>
                </p>
            </div>
        );
    }

    return (
        <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
            <header className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-lg font-semibold">Kategorien</h1>
                    <p className="text-sm text-muted-foreground">Ordne deine Verträge und Einnahmen.</p>
                </div>
                <Button onClick={() => setForm({open: true})}>
                    <Plus/> Neue Kategorie
                </Button>
            </header>

            {/* ---------- Tabs ---------- */}
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="tablist">
                {TABS.map((t) => {
                    const count = categories.filter((c) => c.type === t.type).length;
                    const active = tab === t.type;
                    return (
                        <button
                            key={t.type}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => setTab(t.type)}
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
                <p className="text-sm text-destructive">Kategorien konnten nicht geladen werden.</p>
            ) : (
                <CategoryList
                    categories={visible}
                    type={tab}
                    isLoading={isLoading}
                    onEdit={(c) => setForm({open: true, category: c})}
                    onDelete={(c) => setToDelete({open: true, category: c})}
                />
            )}

            <CategoryFormDialog
                open={form.open}
                category={form.category}
                defaultType={tab}
                onClose={() => setForm((s) => ({...s, open: false}))}
            />
            <DeleteCategoryDialog
                open={toDelete.open}
                category={toDelete.category}
                allCategories={categories}
                onClose={() => setToDelete((s) => ({...s, open: false}))}
            />
        </div>
    );
}