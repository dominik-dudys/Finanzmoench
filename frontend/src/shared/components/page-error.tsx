import {Button} from "@/ui-components/ui/button";
import {cn} from "@/lib/utils";

type Props = {
    title?: string;
    message: string;
    onRetry?: () => void;
    centered?: boolean;
};

export function PageError({title, message, onRetry, centered = false}: Props) {
    return (
        <div className={cn("mx-auto max-w-2xl p-6", centered && "text-center")}>
            {title && <h1 className="mb-2 text-lg font-semibold">{title}</h1>}
            <p className="text-sm text-destructive">{message}</p>
            {onRetry && (
                <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
                    Erneut versuchen
                </Button>
            )}
        </div>
    );
}