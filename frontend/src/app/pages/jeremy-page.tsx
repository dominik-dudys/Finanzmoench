import {useEffect, useRef, useState} from "react";
import {useQueryClient} from "@tanstack/react-query";
import {SendHorizontal} from "lucide-react";
import {Avatar, AvatarFallback, AvatarImage} from "@/ui-components/ui/avatar";
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
import {useAiUsage, useAskJeremy} from "@/features/jeremyai/use-jeremy";
import {UsageMeter} from "@/features/jeremyai/usage-meter";
import {UpgradeButton} from "@/features/payment/upgrade-button";
import {toast} from "sonner";
import {Switch} from "@/ui-components/ui/switch";
import {Label} from "@/ui-components/ui/label";
import {cn} from "@/lib/utils";
import {AiConsentDialog} from "@/features/jeremyai/ai-consent-dialog";


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
};

function errorCode(err: unknown): string {
    return typeof err === "object" && err !== null && "code" in err ? String(err.code) : "unknown";
}

export function JeremyPage() {
    const queryClient = useQueryClient();
    const {data: flags, isLoading: flagsLoading} = useFlags();
    const {data: me, isLoading: meLoading} = useMe();
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


    const update = (id: string, patch: Partial<ChatMessage>) =>
        setMessages((m) => m.map((msg) => (msg.id === id ? {...msg, ...patch} : msg)));

    const send = (e: React.FormEvent) => {
        e.preventDefault();
        const question = input.trim();
        if (!question || !canChat || ask.isPending) return;

        const replyId = crypto.randomUUID();
        setMessages((m) => [
            ...m,
            {id: crypto.randomUUID(), role: "user", text: question},
            {id: replyId, role: "jeremy", text: "", status: "pending"},
        ]);
        setInput("");

        ask.mutate(question, {
            onSuccess: ({text, audioUrl}) => {
                audioUrls.current.push(audioUrl);
                update(replyId, {text, audioUrl, status: undefined});
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
            },
        });
    };

    const placeholder = quotaReached
        ? "Tageslimit erreicht"
        : canChat ? "Frag Jeremy…"
            : enabled && !consented ? "Erst Jeremy aktivieren" : "Jeremy ist deaktiviert";

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
            {/* ---------- Verlauf ---------- */}
            <MessageScrollerProvider autoScroll defaultScrollPosition="last-anchor">
                <MessageScroller className="flex-1 rounded-lg border">
                    <MessageScrollerViewport>
                        <MessageScrollerContent className="flex flex-col gap-4 p-4">
                            {messages.length === 0 && (
                                <p className="py-12 text-center text-sm text-muted-foreground">
                                    Stell Jeremy eine Frage zu deinen Finanzen!
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
                                                <Avatar>
                                                    <AvatarImage src="/JeremyPB.jpg" alt="Jeremy"/>
                                                    <AvatarFallback>J</AvatarFallback>
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