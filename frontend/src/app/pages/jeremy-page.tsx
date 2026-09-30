import {useEffect, useRef, useState} from "react";
import {Link} from "react-router";
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
import {useMe} from "@/features/profile/use-me.ts";
import {useAskJeremy} from "@/features/jeremyai/use-jeremy";

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
};

function errorCode(err: unknown): string {
    return typeof err === "object" && err !== null && "code" in err ? String(err.code) : "unknown";
}

export function JeremyPage() {
    const queryClient = useQueryClient();
    const {data: flags, isLoading: flagsLoading} = useFlags();
    const {data: me, isLoading: meLoading} = useMe();
    const ask = useAskJeremy();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");

    // Blob-URLs beim Verlassen der Seite freigeben
    const audioUrls = useRef<string[]>([]);
    useEffect(() => {
        const urls = audioUrls.current;
        return () => urls.forEach((u) => URL.revokeObjectURL(u));
    }, []);

    const loading = flagsLoading || meLoading;
    const enabled = flags?.jeremy_ai ?? false;
    const consented = !!me?.ai_consent_at;
    const canChat = !loading && enabled && consented;

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

    return (
        <div className="mx-auto flex h-[calc(100svh-5rem)] max-w-2xl flex-col gap-3 p-4">
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
                <p className="text-center text-sm text-muted-foreground">
                    Um Jeremy zu nutzen, aktiviere ihn in den{" "}
                    <Link to="/einstellungen#jeremy" className="underline">Einstellungen</Link>.
                </p>
            )}

            {/* ---------- Eingabe ---------- */}
            <form onSubmit={send} className="flex gap-2">
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={canChat ? "Frag Jeremy…" : "Jeremy ist deaktiviert"}
                    disabled={!canChat || ask.isPending}
                    maxLength={500}
                    aria-label="Frage an Jeremy"
                />
                <Button type="submit" size="icon" disabled={!canChat || ask.isPending || !input.trim()} aria-label="Senden">
                    <SendHorizontal/>
                </Button>
            </form>
            <p className="text-center text-xs text-muted-foreground">
                Jeremy ist eine Parodie – keine Finanzberatung.
            </p>
        </div>
    );
}