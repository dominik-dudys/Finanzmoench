import {useEffect, useRef, useState} from "react";
import {useQueryClient} from "@tanstack/react-query";
import {History, SendHorizontal, SquarePen} from "lucide-react";
import {Avatar, AvatarFallback} from "@/ui-components/ui/avatar";
import {Bubble, BubbleContent} from "@/ui-components/ui/bubble";
import {Message, MessageAvatar, MessageContent} from "@/ui-components/ui/message";
import {
    MessageScroller, MessageScrollerButton, MessageScrollerContent,
    MessageScrollerItem, MessageScrollerProvider, MessageScrollerViewport,
} from "@/ui-components/ui/message-scroller";
import {Input} from "@/ui-components/ui/input";
import {Button} from "@/ui-components/ui/button";
import {useFlags} from "@/features/feature-flags/use-flags";
import {useMe, useUpdateMe} from "@/features/profile/use-me.ts";
import {chatSessionKey, useAiUsage, useAskJeremy, useChatSessions} from "@/features/jeremyai/use-jeremy";
import {getChatSession, type ChatSessionDetail} from "@/features/jeremyai/api";
import {ChatList} from "@/features/jeremyai/chat-list";
import {UsageMeter} from "@/features/jeremyai/usage-meter";
import {UpgradeButton} from "@/features/payment/upgrade-button";
import {toast} from "sonner";
import {Switch} from "@/ui-components/ui/switch";
import {Label} from "@/ui-components/ui/label";
import {cn} from "@/lib/utils";
import {AiConsentDialog} from "@/features/jeremyai/ai-consent-dialog";
import {PageError} from "@/shared/components/page-error";
import {JeremyAvatarImage} from "@/features/jeremyai/jeremy-avatar-image";

type ChatMessage = {
    id: string;
    role: "user" | "jeremy";
    text: string;
    audioUrl?: string;
    status?: "pending" | "error";
};

const ERROR_TEXT: Record<string, string> = {
    ai_consent_required: "Du hast der Nutzung von Jeremy nicht zugestimmt.",
    jeremy_disabled: "Jeremy ist gerade nicht verfügbar.",
    ai_busy: "Jeremy ist gerade überlastet. Versuch es in ein paar Sekunden nochmal.",
    ai_quota_exceeded: "Du hast dein Tageslimit erreicht",
    session_not_found: "Dieser Chat existiert nicht mehr. Starte einen neuen Chat.",
};

function errorCode(err: unknown): string {
    return typeof err === "object" && err !== null && "code" in err ? String(err.code) : "unknown";
}


function toChatMessages(chat: ChatSessionDetail): ChatMessage[] {
    return chat.messages.map((m, i) => ({
        id: `${chat.id}-${i}`,
        role: m.role === "user" ? "user" : "jeremy",
        text: m.text,
    }));
}

export function JeremyPage() {
    const queryClient = useQueryClient();
    const {data: flags, isLoading: flagsLoading, isError: flagsError, refetch: refetchFlags} = useFlags();
    const {data: me, isLoading: meLoading, isError: meError, refetch: refetchMe} = useMe();
    const ask = useAskJeremy();
    const updateMe = useUpdateMe();

    const toggleSatire = (checked: boolean) =>
        updateMe.mutate(
            {jeremy_mode: checked ? "satire" : "serious"},
            {onError: () => toast.error("Modus konnte nicht geändert werden.")},
        );

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [consentOpen, setConsentOpen] = useState(false);

    // Blob-URLs beim Verlassen der Seite freigeben
    const audioUrls = useRef<string[]>([]);
    useEffect(() => {
        const urls = audioUrls.current;
        return () => urls.forEach((u) => URL.revokeObjectURL(u));
    }, []);

    const loading = flagsLoading || meLoading;
    const enabled = flags?.jeremy_ai ?? false;
    const consented = !!me?.ai_consent_at;
    const {data: usage} = useAiUsage(enabled && consented);
    const quotaReached = usage ? usage.remaining <= 0 : false;
    const canChat = !loading && enabled && consented && !quotaReached;
    const satire = me?.jeremy_mode === "satire";

    // ---------- Chatverlauf ----------
    const {data: sessions = [], isSuccess: sessionsLoaded} = useChatSessions(enabled && consented);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [chatLoading, setChatLoading] = useState(false);
    const [listOpen, setListOpen] = useState(false);
    const initialized = useRef(false);
    const latestRequested = useRef<string | null>(null); // schützt vor Antworten in falscher Reihenfolge

    const fetchChat = (id: string) =>
        queryClient.fetchQuery({
            queryKey: chatSessionKey(id),
            queryFn: () => getChatSession(id),
            staleTime: 0,
        });

    const openChat = async (id: string) => {
        if (ask.isPending) return;
        initialized.current = true;
        latestRequested.current = id;
        setListOpen(false);
        setActiveId(id);
        setMessages([]);
        setChatLoading(true);
        try {
            const chat = await fetchChat(id);
            if (latestRequested.current !== id) return; // inzwischen anderer Chat gewählt
            setMessages(toChatMessages(chat));
        } catch {
            if (latestRequested.current === id) toast.error("Chat konnte nicht geladen werden.");
        } finally {
            if (latestRequested.current === id) setChatLoading(false);
        }
    };

    const newChat = () => {
        if (ask.isPending) return;
        initialized.current = true;
        latestRequested.current = null;
        setListOpen(false);
        setActiveId(null);
        setMessages([]);
        setChatLoading(false);
    };

    const onChatDeleted = (id: string) => {
        if (id === activeId) newChat();
    };

    // Beim Aufrufen: zuletzt genutzten Chat laden.
    // State wird erst im Callback gesetzt (nicht synchron im Effekt) -> kein Cascading Render.
    useEffect(() => {
        if (initialized.current || !sessionsLoaded) return;
        initialized.current = true;
        const latest = sessions[0];
        if (!latest) return;

        latestRequested.current = latest.id;
        fetchChat(latest.id)
            .then((chat) => {
                if (latestRequested.current !== latest.id) return; // Nutzer hat inzwischen gewechselt/geschrieben
                setActiveId(latest.id);
                setMessages(toChatMessages(chat));
            })
            .catch(() => toast.error("Letzter Chat konnte nicht geladen werden."));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionsLoaded]);

    const activeTitle = sessions.find((s) => s.id === activeId)?.title ?? "Neuer Chat";

    const update = (id: string, patch: Partial<ChatMessage>) =>
        setMessages((m) => m.map((msg) => (msg.id === id ? {...msg, ...patch} : msg)));

    const send = (e: React.FormEvent) => {
        e.preventDefault();
        const question = input.trim();
        if (!question || !canChat || ask.isPending) return;
        initialized.current = true; // erste Frage vor Laden der Liste → nicht überschreiben
        if (!activeId) latestRequested.current = null; // laufendes Laden des letzten Chats verwerfen

        const replyId = crypto.randomUUID();
        setMessages((m) => [
            ...m,
            {id: crypto.randomUUID(), role: "user", text: question},
            {id: replyId, role: "jeremy", text: "", status: "pending"},
        ]);
        setInput("");

        ask.mutate({question, sessionId: activeId}, {
            onSuccess: ({text, audioUrl, sessionId}) => {
                if (audioUrl) audioUrls.current.push(audioUrl);
                update(replyId, {text, audioUrl, status: undefined});
                // Neuer Chat: ab jetzt diese Session weiterverwenden
                if (!activeId && sessionId) {
                    latestRequested.current = sessionId;
                    setActiveId(sessionId);
                }
            },
            onError: (err) => {
                const code = errorCode(err);
                update(replyId, {
                    text: ERROR_TEXT[code] ?? "Jeremy hat gerade keine Antwort. Versuch es später nochmal.",
                    status: "error",
                });
                // Zustand neu laden, damit Eingabe + Hinweis stimmen
                if (code === "ai_consent_required") queryClient.invalidateQueries({queryKey: ["profile", "me"]});
                if (code === "jeremy_disabled") queryClient.invalidateQueries({queryKey: ["feature-flags"]});
                if (code === "session_not_found") {
                    latestRequested.current = null;
                    setActiveId(null);
                }
            },
        });
    };

    const placeholder = quotaReached
        ? "Tageslimit erreicht"
        : canChat ? "Frag Jeremy…"
            : enabled && !consented ? "Erst Jeremy aktivieren" : "Jeremy ist deaktiviert";

    if (flagsError || meError) {
        return (
            <PageError
                title="JeremyAI"
                message="Jeremy konnte nicht geladen werden."
                onRetry={() => {
                    if (flagsError) refetchFlags();
                    if (meError) refetchMe();
                }}
            />
        );
    }

    return (
        <div className="mx-auto flex h-[calc(100svh-5rem)] max-w-2xl flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold">JeremyAI</h1>
                {consented && (
                    <div className="flex items-center gap-2">
                        <Label
                            htmlFor="jeremy-satire-toggle"
                            className={cn("text-sm", satire ? "font-semibold text-destructive" : "text-muted-foreground")}
                        >
                            Satire-Modus
                        </Label>
                        <Switch
                            id="jeremy-satire-toggle"
                            checked={satire}
                            disabled={updateMe.isPending}
                            onCheckedChange={toggleSatire}
                            className="data-checked:bg-destructive"
                        />
                    </div>
                )}
            </div>

            {enabled && consented && usage && (
                <UsageMeter
                    usage={usage}
                    action={<UpgradeButton variant="link" size="sm" label="Mehr mit Premium" className="h-auto p-0 text-xs"/>}
                />
            )}

            {/* ---------- Chat-Auswahl ---------- */}
            {enabled && consented && (
                <>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setListOpen((o) => !o)}
                            disabled={ask.isPending}
                        >
                            <History/> Chats{sessions.length > 0 && ` (${sessions.length})`}
                        </Button>
                        <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                            {activeTitle}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={newChat}
                            disabled={ask.isPending || (activeId === null && messages.length === 0)}
                        >
                            <SquarePen/> Neu
                        </Button>
                    </div>
                    {listOpen && (
                        <ChatList
                            sessions={sessions}
                            activeId={activeId}
                            onSelect={openChat}
                            onDeleted={onChatDeleted}
                        />
                    )}
                </>
            )}

            {/* ---------- Verlauf ---------- */}
            <MessageScrollerProvider autoScroll defaultScrollPosition="last-anchor">
                <MessageScroller className="flex-1 rounded-lg border">
                    <MessageScrollerViewport>
                        <MessageScrollerContent className="flex flex-col gap-4 p-4">
                            {messages.length === 0 && (
                                <p className="py-12 text-center text-sm text-muted-foreground">
                                    {chatLoading ? "Chat wird geladen…" : "Stell Jeremy eine Frage zu deinen Finanzen!"}
                                </p>
                            )}
                            {messages.map((msg) => (
                                <MessageScrollerItem
                                    key={msg.id}
                                    messageId={msg.id}
                                    scrollAnchor={msg.role === "user"}
                                >
                                    <Message align={msg.role === "user" ? "end" : "start"}>
                                        {msg.role === "jeremy" && (
                                            <MessageAvatar>
                                                <Avatar className="overflow-hidden">
                                                    <JeremyAvatarImage mode={me?.jeremy_mode} alt="Jeremy"/>
                                                    <AvatarFallback>Mönch</AvatarFallback>
                                                </Avatar>
                                            </MessageAvatar>
                                        )}
                                        <MessageContent>
                                            <Bubble
                                                align={msg.role === "user" ? "end" : "start"}
                                                variant={
                                                    msg.role === "user" ? "default"
                                                        : msg.status === "error" ? "destructive"
                                                            : "secondary"
                                                }
                                            >
                                                <BubbleContent className={msg.status === "pending" ? "animate-pulse" : undefined}>
                                                    {msg.status === "pending" ? "Jeremy überlegt…" : msg.text}
                                                </BubbleContent>
                                            </Bubble>
                                            {msg.audioUrl && (
                                                <audio controls autoPlay src={msg.audioUrl} className="mt-2 h-8 w-full max-w-xs"/>
                                            )}
                                        </MessageContent>
                                    </Message>
                                </MessageScrollerItem>
                            ))}
                        </MessageScrollerContent>
                    </MessageScrollerViewport>
                    <MessageScrollerButton/>
                </MessageScroller>
            </MessageScrollerProvider>

            {/* ---------- Hinweis, warum die Eingabe gesperrt ist ---------- */}
            {!loading && !enabled && (
                <p className="text-center text-sm text-muted-foreground">
                    Jeremy ist gerade nicht verfügbar. Schau später nochmal vorbei.
                </p>
            )}
            {!loading && enabled && !consented && (
                <div className="flex flex-col items-center gap-2 rounded-lg border p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                        Jeremy braucht deine Einwilligung, bevor es losgehen kann.
                    </p>
                    <Button onClick={() => setConsentOpen(true)}>Jeremy aktivieren</Button>
                </div>
            )}
            <AiConsentDialog open={consentOpen} onOpenChange={setConsentOpen}/>

            {!loading && enabled && consented && quotaReached && usage && (
                <div className="flex flex-col items-center gap-2 rounded-lg border p-4 text-center">
                    <p className="text-sm">
                        Du hast heute alle {usage.limit} Fragen genutzt. Ab Mitternacht geht's weiter.
                    </p>
                    {usage.plan === "free" && (
                        <>
                            <p className="text-sm text-muted-foreground">
                                Mit Premium kannst du Jeremy 10 Fragen pro Tag stellen.
                            </p>
                            <UpgradeButton/>
                        </>
                    )}
                </div>
            )}

            {/* ---------- Eingabe ---------- */}
            <form onSubmit={send} className="flex gap-2">
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={placeholder}
                    disabled={!canChat || ask.isPending}
                    maxLength={500}
                    aria-label="Frage an Jeremy"
                />
                <Button type="submit" size="icon" disabled={!canChat || ask.isPending || !input.trim()} aria-label="Senden">
                    <SendHorizontal/>
                </Button>
            </form>
            <p className={cn("text-center text-xs", satire ? "font-medium text-destructive" : "text-muted-foreground")}>
                {satire
                    ? "Satire-Modus: nicht ernst gemeint – keine Finanzberatung."
                    : "Allgemeine Tipps – keine Finanzberatung."}
            </p>
        </div>
    );
}