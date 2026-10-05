import {apiClient} from "@/shared/api";

export type Interval = "daily" | "weekly" | "monthly" | "yearly";

export interface CostShare {
    person: string;
    percentage: string;
}

export interface CostItem {
    cost_item_id: string;
    history_group_id: string;
    household: string;
    position_category: string;
    name: string;
    amount: string;
    description: string | null;
    interval: Interval;
    start_date: string | null;
    end_date: string | null;
    valid_from: string;
    valid_until: string | null;
    shares: CostShare[];
}

export interface CostItemPayload {
    name: string;
    amount: string;
    interval: Interval;
    position_category: string;
    description: string | null;
    start_date: string | null;
    end_date: string | null;
    shares: CostShare[];
}
export type CostItemErrors =
    Partial<Record<keyof CostItemPayload, string[]>> & {error?: string};

const BASE = "finances/";

export async function getCostItems(): Promise<CostItem[]> {
    const res = await apiClient.get<CostItem[]>(`${BASE}costitems-show/`);
    return res.data;
}

export async function createCostItem(payload: CostItemPayload): Promise<void> {
    await apiClient.post(`${BASE}costitem-create/`, payload);
}

export async function updateCostItem(id: string, payload: Partial<CostItemPayload>): Promise<void> {
    await apiClient.patch(`${BASE}costitem-update/${id}/`, payload);
}

export async function archiveCostItem(id: string): Promise<void> {
    await apiClient.delete(`${BASE}costitem-delete/${id}/`);
}