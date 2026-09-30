import {apiClient} from "@/shared/api";
import type {SessionResponse} from "@/features/auth/api";

const ACCOUNT = "auth/browser/v1/account";

export interface ChangePasswordPayload {
    current_password: string;
    new_password: string;
}

export async function changePassword(
    payload: ChangePasswordPayload
): Promise<SessionResponse> {
    const res = await apiClient.post(`${ACCOUNT}/password/change`, payload);
    return res.data;
}

export interface ProviderAccount {
    uid: string;
    display: string;
    provider: {
        id: string;
        name: string;
    };
}

interface ProvidersResponse {
    status: number;
    data: ProviderAccount[];
}

export async function getProviderAccounts(): Promise<ProviderAccount[]> {
    const res = await apiClient.get<ProvidersResponse>(`${ACCOUNT}/providers`);
    return res.data.data;
}

export async function disconnectProvider(
    provider: string,
    account: string
): Promise<ProviderAccount[]> {
    const res = await apiClient.delete<ProvidersResponse>(`${ACCOUNT}/providers`, {
        data: {provider, account},
    });
    return res.data.data;
}

export function connectProviderUrl(provider: string): string {
    const next = encodeURIComponent(`${window.location.origin}/einstellungen`);
    return `/accounts/${provider}/login/?process=connect&next=${next}`;
}

