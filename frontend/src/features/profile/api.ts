import {apiClient} from "@/shared/api";

export interface Person {
    person_id: string;
    first_name: string;
    last_name: string;
    email: string;
    created_at: string;
    login_method: string[];
}

export interface UpdatePersonPayload{
    first_name?: string;
    last_name?: string;
}

export async function getMe(): Promise<Person>{
    const res = await apiClient.get<Person>("accounts/me/");
    return res.data;
}

export async function updateMe(payload: UpdatePersonPayload): Promise<Person>{
    const res = await apiClient.patch<Person>("accounts/me/", payload);
    return res.data;
}