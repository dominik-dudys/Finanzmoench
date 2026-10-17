import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {
    archiveCostItem, createCostItem, getCostItems, updateCostItem,
    type CostItemPayload,
} from "./api";
import {useMyHousehold} from "@/features/household/use-household.ts";

const KEY = ["cost-items"];

function useInvalidate() {
    const qc = useQueryClient();
    return () => {
        qc.invalidateQueries({queryKey: KEY});
    };
}

export function useCostItems() {
    const {data: household} = useMyHousehold();
    const householdId = household?.household_id;
    return useQuery({
        queryKey: [...KEY, householdId],
        queryFn: () => getCostItems(),
        enabled: !!householdId,
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