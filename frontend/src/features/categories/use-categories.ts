import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {
    createCategory, deleteCategory, getCategories, updateCategory,
    type CategoryPayload,
} from "./api";

const KEY = ["categories"];

// Alle Kategorien des Haushalts (Ausgaben + Einkommen) – gefiltert wird im Frontend
export function useCategories() {
    return useQuery({
        queryKey: KEY,
        queryFn: getCategories,
    });
}

function useInvalidate() {
    const qc = useQueryClient();
    return () => {
        qc.invalidateQueries({queryKey: KEY});
        qc.invalidateQueries({queryKey: ["cost-items"]});
    };
}

export function useCreateCategory() {
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: (payload: CategoryPayload) => createCategory(payload),
        onSuccess: invalidate,
    });
}

export function useUpdateCategory() {
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: ({id, payload}: {id: string; payload: CategoryPayload}) => updateCategory(id, payload),
        onSuccess: invalidate,
    });
}

export function useDeleteCategory() {
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: ({id, fallbackId}: {id: string; fallbackId?: string}) => deleteCategory(id, fallbackId),
        onSuccess: invalidate,
    });
}