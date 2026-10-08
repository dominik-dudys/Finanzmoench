import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {
    archiveIncome, createIncome, getIncomes, updateIncome,
    type IncomePayload,
} from "./api";

const KEY = ["incomes"];

function useInvalidate() {
    const qc = useQueryClient();
    return () => {
        qc.invalidateQueries({queryKey: KEY});
    };
}

export function useIncomes() {
    return useQuery({
        queryKey: KEY,
        queryFn: getIncomes,
    });
}

export function useCreateIncome() {
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: (payload: IncomePayload) => createIncome(payload),
        onSuccess: invalidate,
    });
}

export function useUpdateIncome() {
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: ({id, payload}: {id: string; payload: Partial<IncomePayload>}) => updateIncome(id, payload),
        onSuccess: invalidate,
    });
}

export function useArchiveIncome() {
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: (id: string) => archiveIncome(id),
        onSuccess: invalidate,
    });
}