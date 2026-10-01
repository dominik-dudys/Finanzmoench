import {useState} from "react";
import {Link} from "react-router";
import {Plus} from "lucide-react";
import {Button} from "@/ui-components/ui/button";
import {useMyHousehold} from "@/features/household/use-household.ts";
import {useCategories} from "@/features/categories/use-categories";
import {CategoryList} from "@/features/categories/category-list";
import {CategoryFormDialog} from "@/features/categories/category-form-dialog";
import {DeleteCategoryDialog} from "@/features/categories/delete-category-dialog";     // NEU
import type {Category} from "@/features/categories/api";                               // NEU


type DialogState = {open: boolean; category?: Category};

export function KategoriePage() {
    const {data: household, isLoading: householdLoading} = useMyHousehold();
    const {data: categories = [], isLoading, isError} = useCategories();
    const [form, setForm] = useState<DialogState>({open: false});                       // NEU (ersetzt createOpen)
    const [toDelete, setToDelete] = useState<DialogState>({open: false});               // NEU

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
                    <p className="text-sm text-muted-foreground">Ordne deine Verträge nach Bereichen.</p>
                </div>
                <Button onClick={() => setForm({open: true})}>                                {/* NEU */}
                    <Plus/> Neue Kategorie
                </Button>
            </header>

            {isError ? (
                <p className="text-sm text-destructive">Kategorien konnten nicht geladen werden.</p>
            ) : (
                <CategoryList
                    categories={categories}
                    isLoading={isLoading}
                    onEdit={(c) => setForm({open: true, category: c})}                         // NEU
                    onDelete={(c) => setToDelete({open: true, category: c})}                   // NEU
                />
            )}

            <CategoryFormDialog                                                                 // NEU (category ergänzt)
                open={form.open}
                category={form.category}
                onClose={() => setForm((s) => ({...s, open: false}))}
            />
            <DeleteCategoryDialog                                                               // NEU
                open={toDelete.open}
                category={toDelete.category}
                onClose={() => setToDelete((s) => ({...s, open: false}))}
            />
        </div>
    );
}