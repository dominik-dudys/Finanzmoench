import {apiClient} from "@/shared/api";

export interface Income {
    income_id: string;
    person: string;
    amount: string;
    valid_from: string;
    valid_until: string | null;
    position_category: string;
}

export interface IncomePayload {
    amount: string;
    position_category: string;
}

export type IncomeErrors =
    Partial<Record<keyof IncomePayload, string[]>> & {error?: string};

const BASE = "finances/";

export async function getIncomes(date?: string): Promise<Income[]> {
    const res = await apiClient.get<Income[]>(`${BASE}incomes-show/`, {
        params: date ? {date} : undefined,
    });
    return res.data;
}

export async function createIncome(payload: IncomePayload): Promise<void> {
    await apiClient.post(`${BASE}income-create/`, payload);
}

export async function updateIncome(id: string, payload: Partial<IncomePayload>): Promise<void> {
    await apiClient.patch(`${BASE}income-update/${id}/`, payload);
}

export async function archiveIncome(id: string): Promise<void> {
    await apiClient.delete(`${BASE}income-delete/${id}/`);
}