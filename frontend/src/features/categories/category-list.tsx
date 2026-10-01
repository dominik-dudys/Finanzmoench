import {MoreHorizontal, Pencil, Trash2} from "lucide-react";
import {Skeleton} from "@/ui-components/ui/skeleton";
import {Badge} from "@/ui-components/ui/badge";
import {Button} from "@/ui-components/ui/button";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/ui-components/ui/dropdown-menu";
import type {Category, CategoryType} from "./api";

const FALLBACK_COLOR = "#A3A3A3";

const EMPTY_TEXT: Record<CategoryType, string> = {
    cost: "Lege Kategorien wie „Wohnen“ oder „Abos“ an, um deine Verträge zu ordnen.",
    income: "Lege Kategorien wie „Gehalt“ oder „Nebenjob“ an, um deine Einnahmen zu ordnen.",
};

interface Props {
    categories: Category[];   // bereits nach Typ gefiltert
    type: CategoryType;
    isLoading: boolean;
    onEdit: (category: Category) => void;
    onDelete: (category: Category) => void;
}

export function CategoryList({categories, type, isLoading, onEdit, onDelete}: Props) {
    if (isLoading) {
        return (
            <div className="flex flex-col gap-2">
                {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg"/>)}
            </div>
        );
    }

    if (categories.length === 0) {
        return (
            <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="font-medium">Noch keine Kategorien</p>
                <p className="text-sm text-muted-foreground">{EMPTY_TEXT[type]}</p>
            </div>
        );
    }

    return (
        <ul className="flex flex-col divide-y rounded-lg border">
            {categories.map((c) => (
                <li key={c.position_id} className="flex min-h-14 items-center gap-3 py-2 pl-4 pr-2">
                    <span
                        className="size-3 shrink-0 rounded-full"
                        style={{backgroundColor: c.color_code ?? FALLBACK_COLOR}}
                        aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate font-medium">{c.name}</span>

                    {c.is_standard ? (
                        // Standard-Kategorien: vom Backend gesperrt → keine Aktionen
                        <Badge variant="secondary" className="mr-2">Standard</Badge>
                    ) : (
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                render={
                                    <Button variant="ghost" size="icon" aria-label={`Aktionen für ${c.name}`}>
                                        <MoreHorizontal/>
                                    </Button>
                                }
                            />
                            <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem onClick={() => onEdit(c)}>
                                    <Pencil/> Bearbeiten
                                </DropdownMenuItem>
                                <DropdownMenuItem variant="destructive" onClick={() => onDelete(c)}>
                                    <Trash2/> Löschen
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </li>
            ))}
        </ul>
    );
}