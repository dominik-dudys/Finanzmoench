import {apiClient} from "@/shared/api";

export interface Category {
    position_id: string;
    name: string;
    color_code: string | null;
    contract_count: number | null;
}

export interface CategoryPayload {
    name?: string;
    color_code?: string | null;
}

// DRF-Feldfehler, z. B. {name: ["Eine Kategorie mit diesem Namen gibt es bereits."]}
export type CategoryFieldErrors = Partial<Record<"name" | "color_code", string[]>>;

const BASE = "households/categories/";

export async function getCategories(): Promise<Category[]> {
    const res = await apiClient.get<Category[]>(BASE);
    return res.data;
}

export async function createCategory(payload: CategoryPayload): Promise<Category> {
    const res = await apiClient.post<Category>(BASE, payload);
    return res.data;
}

export async function updateCategory(id: string, payload: CategoryPayload): Promise<Category> {
    const res = await apiClient.patch<Category>(`${BASE}${id}/`, payload);
    return res.data;
}

export async function deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`${BASE}${id}/`);
}