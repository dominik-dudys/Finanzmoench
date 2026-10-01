import {apiClient} from "@/shared/api";

export type JeremyMode = "serious" | "satire";

export interface Person {
    person_id: string;
    first_name: string;
    last_name: string;
    email: string;
    created_at: string;
    login_method: string[];
    has_password: boolean;
    ai_consent_at: string | null;
    jeremy_mode: JeremyMode;
}

export interface UpdatePersonPayload{
    first_name?: string;
    last_name?: string;
    ai_consent?: boolean;
    jeremy_mode?: JeremyMode;
}

export async function getMe(): Promise<Person>{
    const res = await apiClient.get<Person>("accounts/me/");
    return res.data;
}

export async function updateMe(payload: UpdatePersonPayload): Promise<Person>{
    const res = await apiClient.patch<Person>("accounts/me/", payload);
    return res.data;
}