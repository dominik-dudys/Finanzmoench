import type {DataExport} from "./api";

type Row = Record<string, unknown>;

function cell(value: unknown): string {
    if (value === null || value === undefined) return "";
    let s = Array.isArray(value) ? value.join(", ") : String(value);

    if (/^-?\d+\.\d+$/.test(s)) {
        s = s.replace(".", ",");
    } else if (/^[=+\-@\t\r]/.test(s)) {
        s = "'" + s;
    }
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function section(title: string, rows: Row[]): string {
    const [first] = rows;
    if (!first) return `${title}\r\n(keine Daten)`;
    const headers = Object.keys(first);
    return [
        title,
        headers.join(";"),
        ...rows.map((r) => headers.map((h) => cell(r[h])).join(";")),
    ].join("\r\n");
}

export function toCsv(data: DataExport): string {
    const {categories = [], ...household} = data.household ?? {categories: []};

    const chatMessages = data.voice_ai.chat_sessions.flatMap((s) =>
        s.messages.map((m) => ({
            chat: s.title,
            session_id: s.session_id,
            role: m.role === "model" ? "Jeremy" : "Du",
            text: m.text,
            created_at: m.created_at,
        })),
    );

    const sections = [
        section("Profil", [data.profile]),
        section("Haushalt", data.household ? [household] : []),
        section("Kategorien", categories),
        section("Abo", data.subscription ? [data.subscription] : []),
        section("Einkommen", data.finances.incomes),
        section("Kostenanteile", data.finances.cost_shares),
        section("JeremyAI-Nutzung", data.voice_ai.daily_usage),
        section("JeremyAI-Chats", chatMessages),
    ];

    // BOM, damit Excel Umlaute als UTF-8 erkennt
    return "\uFEFF" + sections.join("\r\n\r\n");
}

export function toJson(data: DataExport): string {
    return JSON.stringify(data, null, 2);
}

export function downloadFile(content: string, filename: string, mime: string): void {
    const url = URL.createObjectURL(new Blob([content], {type: mime}));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
}