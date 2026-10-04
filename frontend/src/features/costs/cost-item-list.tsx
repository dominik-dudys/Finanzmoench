import {Archive, MoreHorizontal, Pencil} from "lucide-react";
import {Skeleton} from "@/ui-components/ui/skeleton";
import {Button} from "@/ui-components/ui/button";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/ui-components/ui/dropdown-menu";
import type {Category} from "@/features/categories/api";
import type {CostItem} from "./api";
import {INTERVAL_LABELS, formatDate, formatMoney} from "./format";

const FALLBACK_COLOR = "#A3A3A3";

interface Props {
    items: CostItem[];
    categories: Category[];
    isLoading: boolean;
    showContractInfo: boolean;
    emptyTitle: string;
    emptyText: string;
    onEdit: (item: CostItem) => void;
    onArchive: (item: CostItem) => void;
}

function runtimeText(item: CostItem): string {
    const parts: string[] = [];
    if (item.start_date) parts.push(`seit ${formatDate(item.start_date)}`);
    parts.push(item.end_date ? `endet am ${formatDate(item.end_date)}` : "unbefristet");
    return parts.join(" · ");
}

export function CostItemList({items, categories, isLoading, showContractInfo, emptyTitle, emptyText, onEdit, onArchive}: Props) {
    if (isLoading) {
        return (
            <div className="flex flex-col gap-2">
                {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg"/>)}
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="font-medium">{emptyTitle}</p>
                <p className="text-sm text-muted-foreground">{emptyText}</p>
            </div>
        );
    }

    const categoryById = new Map(categories.map((c) => [c.position_id, c]));

    return (
        <ul className="flex flex-col divide-y rounded-lg border">
            {items.map((item) => {
                const category = categoryById.get(item.position_category);
                return (
                    <li key={item.cost_item_id} className="flex min-h-16 items-center gap-3 py-2 pl-4 pr-2">
                        <span
                            className="size-3 shrink-0 rounded-full"
                            style={{backgroundColor: category?.color_code ?? FALLBACK_COLOR}}
                            aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{item.name}</p>
                            <p className="truncate text-sm text-muted-foreground">
                                {showContractInfo ? runtimeText(item) : (category?.name ?? "Ohne Kategorie")}
                            </p>
                        </div>
                        <div className="shrink-0 text-right">
                            <p className="font-medium">{formatMoney(item.amount)}</p>
                            <p className="text-sm text-muted-foreground">pro {INTERVAL_LABELS[item.interval]}</p>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger
                                render={
                                    <Button variant="ghost" size="icon" aria-label={`Aktionen für ${item.name}`}>
                                        <MoreHorizontal/>
                                    </Button>
                                }
                            />
                            <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem onClick={() => onEdit(item)}>
                                    <Pencil/> Bearbeiten
                                </DropdownMenuItem>
                                <DropdownMenuItem variant="destructive" onClick={() => onArchive(item)}>
                                    <Archive/> Archivieren
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </li>
                );
            })}
        </ul>
    );
}