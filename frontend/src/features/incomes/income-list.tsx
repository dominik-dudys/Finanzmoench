import {Archive, MoreHorizontal, Pencil} from "lucide-react";
import {Skeleton} from "@/ui-components/ui/skeleton";
import {Button} from "@/ui-components/ui/button";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/ui-components/ui/dropdown-menu";
import type {Category} from "@/features/categories/api";
import type {HouseholdMember} from "@/features/household/api";
import {formatDate, formatMoney} from "@/features/costs/format";
import type {Income} from "./api";

const FALLBACK_COLOR = "#A3A3A3";

interface Props {
    items: Income[];
    categories: Category[];
    members: HouseholdMember[];
    myId?: string;
    isLoading: boolean;
    emptyTitle: string;
    emptyText: string;
    readOnly?: boolean;
    lastSeen?: Map<string, string>;
    onEdit: (item: Income) => void;
    onArchive: (item: Income) => void;
}

export function IncomeList({
                               items, categories, members, myId, isLoading, emptyTitle, emptyText,
                               readOnly = false, lastSeen, onEdit, onArchive,
                           }: Props) {
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
    const memberById = new Map(members.map((m) => [m.person_id, m]));

    return (
        <ul className="flex flex-col divide-y rounded-lg border">
            {items.map((item) => {
                const category = categoryById.get(item.position_category);
                const isMine = item.person === myId;
                const title = category?.name ?? "Ohne Kategorie";
                const owner = isMine ? "Du" : (memberById.get(item.person)?.first_name ?? "Unbekannt");
                const seen = lastSeen?.get(item.income_id);
                const subtitle = seen
                    ? `${owner} · zuletzt aktiv ${formatDate(seen)}`
                    : `${owner} · seit ${formatDate(item.valid_from)}`;
                const showActions = !readOnly && isMine;

                return (
                    <li
                        key={item.income_id}
                        className={"flex min-h-16 items-center gap-3 py-2 pl-4 " + (readOnly ? "pr-4" : "pr-2")}
                    >
                        <span
                            className="size-3 shrink-0 rounded-full"
                            style={{backgroundColor: category?.color_code ?? FALLBACK_COLOR}}
                            aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{title}</p>
                            <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
                        </div>
                        <div className="shrink-0 text-right">
                            <p className="font-medium">{formatMoney(item.amount)}</p>
                            <p className="text-sm text-muted-foreground">pro Monat</p>
                        </div>

                        {showActions && (
                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    render={
                                        <Button variant="ghost" size="icon" aria-label={`Aktionen für ${title}`}>
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
                        )}
                        {!readOnly && !isMine && (
                            // Platzhalter, damit die Beträge bündig bleiben
                            <span className="size-9 shrink-0" aria-hidden/>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}