import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {
    archiveCostItem, createCostItem, getCostItems, updateCostItem,
    type CostItemPayload,
} from "./api";

const KEY = ["cost-items"];

function useInvalidate() {
    const qc = useQueryClient();
    return () => {
        qc.invalidateQueries({queryKey: KEY});
    };
}

export function useCostItems() {
    return useQuery({
        queryKey: KEY,
        queryFn: getCostItems,
    });
}

export function useCreateCostItem() {
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: (payload: CostItemPayload) => createCostItem(payload),
        onSuccess: invalidate,
    });
}

export function useUpdateCostItem() {
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: ({id, payload}: {id: string; payload: Partial<CostItemPayload>}) => updateCostItem(id, payload),
        onSuccess: invalidate,
    });
}

export function useArchiveCostItem() {
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: (id: string) => archiveCostItem(id),
        onSuccess: invalidate,
    });
}