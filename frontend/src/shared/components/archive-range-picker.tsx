import {Archive, X} from "lucide-react";
import {Button} from "@/ui-components/ui/button";
import {ARCHIVE_RANGES, type ArchiveRange} from "@/shared/lib/archive-range";

interface Props {
    value: ArchiveRange | null;
    onChange: (range: ArchiveRange | null) => void;
}

export function ArchiveRangePicker({value, onChange}: Props) {
    if (value === null) {
        return (
            <button
                type="button"
                onClick={() => onChange("1m")}
                className="flex items-center gap-1.5 self-start text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
                <Archive className="size-4"/> Archiv ansehen
            </button>
        );
    }

    return (
        <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-3">
            <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-sm font-medium">
                    <Archive className="size-4"/> Archiv
                </p>
                <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
                    <X/> Zurück
                </Button>
            </div>

            <div className="flex flex-wrap gap-2">
                {ARCHIVE_RANGES.map((r) => (
                    <Button
                        key={r.key}
                        type="button"
                        size="sm"
                        variant={value === r.key ? "default" : "outline"}
                        onClick={() => onChange(r.key)}
                    >
                        {r.label}
                    </Button>
                ))}
            </div>
        </div>
    );
}