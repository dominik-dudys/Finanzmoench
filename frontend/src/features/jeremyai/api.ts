import {apiClient} from "@/shared/api";

export interface JeremyAnswer {
    text: string;
    audioUrl: string; // lokale Blob-URL fürs <audio>-Element
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

export async function askJeremy(question: string): Promise<JeremyAnswer> {
    try {
        const res = await apiClient.post<Blob>("voice-ai/jeremy/", {question}, {responseType: "blob"});
        const text = decodeURIComponent(res.headers["x-jeremy-text"] ?? "");
        return {text, audioUrl: URL.createObjectURL(res.data)};
    } catch (err) {
        throw await parseBlobError(err);
    }
}