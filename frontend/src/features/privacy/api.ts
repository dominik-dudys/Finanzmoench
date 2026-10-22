import {apiClient} from "@/shared/api";

export interface DeleteAccountPayload {
    password?: string;
    confirm_email?: string;
}

export interface DataExport {
    export_metadata: Record<string, unknown>;
    profile: Record<string, unknown>;
    household: (Record<string, unknown> & {categories: Record<string, unknown>[]}) | null;
    subscription: Record<string, unknown> | null;
    finances: {
        incomes: Record<string, unknown>[];
        cost_shares: Record<string, unknown>[];
    };
    voice_ai: {
        daily_usage: Record<string, unknown>[];
        chat_sessions: {
            session_id: string;
            title: string;
            created_at: string;
            updated_at: string;
            messages: {role: string; text: string; created_at: string}[];
        }[];
    };
}

export async function getDataExport(): Promise<DataExport> {
    const res = await apiClient.get<DataExport>("accounts/dsgvo-export/");
    return res.data;
}

export async function deleteAccount(payload: DeleteAccountPayload): Promise<void> {
    await apiClient.post("accounts/dsgvo-delete/", payload);
}