import {apiClient} from "@/shared/api";

export interface JeremyAnswer {
    text: string;
    audioUrl?: string; // fehlt, wenn die Sprachausgabe fehlgeschlagen ist
    sessionId: string;
}

export interface AskJeremyPayload {
    question: string;
    sessionId: string | null;
}

export async function askJeremy({question, sessionId}: AskJeremyPayload): Promise<JeremyAnswer> {
    try {
        const res = await apiClient.post<Blob>(
            "voice-ai/jeremy/",
            {question, session_id: sessionId},
            {responseType: "blob"},
        );
        const text = decodeURIComponent(res.headers["x-jeremy-text"] ?? "");
        return {
            text,
            audioUrl: res.data.size > 0 ? URL.createObjectURL(res.data) : undefined,
            sessionId: res.headers["x-chat-session-id"] ?? "",
        };
    } catch (err) {
        throw await parseBlobError(err);
    }
}

// Bei responseType "blob" kommen auch Fehler als Blob an → wieder in JSON umwandeln
async function parseBlobError(err: unknown): Promise<unknown> {
    if (!(err instanceof Blob)) return err;
    try {
        return JSON.parse(await err.text());
    } catch {
        return {code: "unknown_error"}; // z. B. 500 mit Text statt JSON
    }
}



export interface AiUsage {
    plan: "free" | "premium";
    limit: number;
    used: number;
    remaining: number;
    resets_at: string;
}

export async function getAiUsage(): Promise<AiUsage> {
    const res = await apiClient.get<AiUsage>("voice-ai/ai-usage/");
    return res.data;
}

// ---------- Chatverlauf ----------

export interface ChatSessionSummary {
    id: string;
    title: string;
    updated_at: string;
}

export interface ChatSessionDetail {
    id: string;
    title: string;
    messages: {role: "user" | "model"; text: string; created_at: string}[];
}

export async function getChatSessions(): Promise<ChatSessionSummary[]> {
    const res = await apiClient.get<ChatSessionSummary[]>("voice-ai/ai-sessions-list/");
    return res.data;
}

export async function getChatSession(id: string): Promise<ChatSessionDetail> {
    const res = await apiClient.get<ChatSessionDetail>(`voice-ai/ai-session-detail/${id}/`);
    return res.data;
}

export async function deleteChatSession(id: string): Promise<void> {
    await apiClient.delete(`voice-ai/ai-session-delete/${id}/`);
}