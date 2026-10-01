import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {
    createCategory, deleteCategory, getCategories, updateCategory,
    type CategoryPayload,
} from "./api";

const KEY = ["categories"];

export function useCategories() {
    return useQuery({
        queryKey: KEY,
        queryFn: getCategories,
    });
}

export function useCreateCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: CategoryPayload) => createCategory(payload),
        onSuccess: () => qc.invalidateQueries({queryKey: KEY}),
    });
}

export function useUpdateCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({id, payload}: {id: string; payload: CategoryPayload}) => updateCategory(id, payload),
        onSuccess: () => qc.invalidateQueries({queryKey: KEY}),
    });
}

export function useDeleteCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteCategory(id),
        onSuccess: () => qc.invalidateQueries({queryKey: KEY}),
    });
}