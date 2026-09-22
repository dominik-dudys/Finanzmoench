import {apiClient} from "@/shared/api";

export interface Household {
    household_id: string;
    name: string;
    address: string;
    postal_code: string;
    city: string;
    currency: string;
    member_count?: number;
}

export interface HouseholdPayload {
    name?: string;
    address?: string;
    postal_code?: string;
    city?: string;
    currency?: string;
}

export async function getMyHousehold(): Promise<Household | null> {
    const res = await apiClient.get<Household[]>("households/myhouseholds/");
    return res.data[0] ?? null;
}

export async function updateHousehold(payload: HouseholdPayload): Promise<Household>{
    const res = await apiClient.patch<Household>("households/update/", payload);
    return res.data
}

export async function leaveHousehold(): Promise<void>{
    await apiClient.post("households/leave/")
}