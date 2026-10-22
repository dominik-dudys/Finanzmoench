import {useState} from "react";
import {Trash2} from "lucide-react";
import {Button} from "@/ui-components/ui/button";
import {ConfirmDialog} from "@/shared/components/confirm-dialog";
import {cn} from "@/lib/utils";
import type {ChatSessionSummary} from "./api";
import {useDeleteChatSession} from "./use-jeremy";

interface Props {
    sessions: ChatSessionSummary[];
    activeId: string | null;
    onSelect: (id: string) => void;
    onDeleted: (id: string) => void;
}

const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("de-DE", {day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"});

export function ChatList({sessions, activeId, onSelect, onDeleted}: Props) {
    const deleteChat = useDeleteChatSession();
    const [toDelete, setToDelete] = useState<ChatSessionSummary | null>(null);

    if (sessions.length === 0) {
        return (
            <p className="rounded-lg border p-3 text-center text-sm text-muted-foreground">
                Noch keine Chats.
            </p>
        );
    }

    return (
        <>
            <ul className="max-h-60 overflow-y-auto rounded-lg border">
                {sessions.map((s) => (
                    <li
                        key={s.id}
                        className={cn("flex items-center gap-1 border-b", s.id === activeId && "bg-muted")}
                    >
                        <button type="button" onClick={() => onSelect(s.id)} className="min-w-0 flex-1 px-3 py-2 text-left">
                            <span className="block truncate text-sm">{s.title}</span>
                            <span className="block text-xs text-muted-foreground">{formatDate(s.updated_at)}</span>
                        </button>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Chat „${s.title}“ löschen`}
                            onClick={() => {
                                deleteChat.reset();
                                setToDelete(s);
                            }}
                        >
                            <Trash2/>
                        </Button>
                    </li>
                ))}
            </ul>

            <ConfirmDialog
                open={toDelete !== null}
                onOpenChange={(o) => !o && setToDelete(null)}
                title="Chat löschen?"
                description={<>„{toDelete?.title}“ wird mit allen Nachrichten endgültig gelöscht.</>}
                confirmLabel="Löschen"
                pendingLabel="Wird gelöscht..."
                destructive
                pending={deleteChat.isPending}
                error={deleteChat.isError ? "Der Chat konnte nicht gelöscht werden." : null}
                onConfirm={() =>
                    toDelete && deleteChat.mutate(toDelete.id, {
                        onSuccess: () => {
                            onDeleted(toDelete.id);
                            setToDelete(null);
                        },
                    })
                }
            />
        </>
    );
}