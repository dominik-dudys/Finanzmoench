import {MoreHorizontal, Pencil, Trash2} from "lucide-react";                          // NEU
import {Skeleton} from "@/ui-components/ui/skeleton";
import {Button} from "@/ui-components/ui/button";                                    // NEU
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/ui-components/ui/dropdown-menu";                                            // NEU
import type {Category} from "./api";

const FALLBACK_COLOR = "#A3A3A3";

function contractLabel(count: number | null) {
    const n = count ?? 0;
    return n === 1 ? "1 Vertrag" : `${n} Verträge`;
}

interface Props {
    categories: Category[];
    isLoading: boolean;
    onEdit: (category: Category) => void;      // NEU
    onDelete: (category: Category) => void;    // NEU
}

export function CategoryList({categories, isLoading, onEdit, onDelete}: Props) {     // NEU (onEdit, onDelete)
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
                <p className="text-sm text-muted-foreground">
                    Lege Kategorien wie „Wohnen“ oder „Abos“ an, um deine Verträge zu ordnen.
                </p>
            </div>
        );
    }

    return (
        <ul className="flex flex-col divide-y rounded-lg border">
            {categories.map((c) => (
                <li key={c.position_id} className="flex items-center gap-3 py-2 pl-4 pr-2">
                    <span
                        className="size-3 shrink-0 rounded-full"
                        style={{backgroundColor: c.color_code ?? FALLBACK_COLOR}}
                        aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate font-medium">{c.name}</span>
                    <span className="shrink-0 text-sm text-muted-foreground">
                        {contractLabel(c.contract_count)}
                    </span>

                    {/* NEU: Aktionen pro Zeile */}
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
                </li>
            ))}
        </ul>
    );
}