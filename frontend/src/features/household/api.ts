import {apiClient} from "@/shared/api";

export type JoinRequestStatus = "pending" | "approved" | "rejected";

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

export interface HouseholdCreatePayload {
    name: string;
    address: string;
    postal_code: string;
    city: string;
    currency: string;
}

export interface JoinRequest {
    request_id: string;
    household_id: string;
    household_name: string;
    person_id: string;
    first_name: string;
    last_name: string;
    email: string;
    status: JoinRequestStatus;
    created_at: string;
    responded_at: string | null;
}

export interface JoinRequestResponse {
    message: string;
    join_request: JoinRequest;
}

export interface HouseholdMember {
    person_id: string;
    first_name: string;
    last_name: string;
}

export async function getMyHousehold(): Promise<Household | null> {
    const res = await apiClient.get<Household | null>("households/myhousehold/");
    return res.data;
}

export async function createHousehold(payload: HouseholdCreatePayload): Promise<Household> {
    const res = await apiClient.post<Household>("households/create/", payload);
    return res.data;
}

export async function joinHousehold(householdId: string): Promise<JoinRequestResponse> {
    const res = await apiClient.post<JoinRequestResponse>("households/join/", {household_id: householdId});
    return res.data;
}


export async function updateHousehold(payload: HouseholdPayload): Promise<Household>{
    const res = await apiClient.patch<Household>("households/update/", payload);
    return res.data
}

export async function leaveHousehold(): Promise<void>{
    await apiClient.post("households/leave/")
}

export async function deleteHousehold(): Promise<void> {
    await apiClient.delete("households/delete/");
}

export async function getHouseholdMembers(): Promise<HouseholdMember[]> {
    const res = await apiClient.get<HouseholdMember[]>("households/householdmembers/");
    return res.data;
}

export async function getMyJoinRequests(): Promise<JoinRequest[]> {
    const res = await apiClient.get<JoinRequest[]>("households/my-join-requests/");
    return res.data;
}

export async function respondJoinRequest(requestId: string, approve: boolean): Promise<JoinRequestResponse> {
    const res = await apiClient.post<JoinRequestResponse>(
        `households/respond-join-requests/${requestId}/`,
        {approve},
    );
    return res.data;
}
export async function getHouseholdJoinRequests(): Promise<JoinRequest[]> {
    const res = await apiClient.get<JoinRequest[]>("households/join-requests/");
    return res.data;
}