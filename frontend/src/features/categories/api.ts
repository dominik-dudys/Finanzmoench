import {apiClient} from "@/shared/api";

export type CategoryType = "cost" | "income";

export interface Category {
    position_id: string;
    name: string;
    color_code: string | null;
    type: CategoryType;
    is_standard: boolean;
}

export interface CategoryPayload {
    name?: string;
    color_code?: string | null;
    type?: CategoryType;
}

/**
 * Fehlerformate des Backends:
 * - Feldfehler (Serializer): {color_code: ["…"]}
 * - Fachliche Fehler (Service): {error: "…"}
 */
export type CategoryErrors =
    Partial<Record<"name" | "color_code" | "type", string[]>> & {error?: string};

const BASE = "households/";

export async function getCategories(): Promise<Category[]> {
    const res = await apiClient.get<Category[]>(`${BASE}categories-show/`);
    return res.data;
}

export async function createCategory(payload: CategoryPayload): Promise<Category> {
    const res = await apiClient.post<Category>(`${BASE}category-create/`, payload);
    return res.data;
}

export async function updateCategory(id: string, payload: CategoryPayload): Promise<Category> {
    const res = await apiClient.patch<Category>(`${BASE}category-update/${id}/`, payload);
    return res.data;
}

export async function deleteCategory(id: string, fallbackId?: string): Promise<void> {
    await apiClient.delete(`${BASE}category-delete/${id}/`, {
        params: fallbackId ? {fallback_category_id: fallbackId} : undefined,
    });
}