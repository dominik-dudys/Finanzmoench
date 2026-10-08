import {useMutation, useQueries, useQuery, useQueryClient} from "@tanstack/react-query";
import {
    archiveIncome, createIncome, getIncomes, updateIncome,
    type Income, type IncomePayload,
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
        queryFn: () => getIncomes(),
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

export function useIncomesAt(date: string | null) {
    return useQuery({
        queryKey: [...KEY, "at", date],
        queryFn: () => getIncomes(date ?? undefined),
        enabled: date !== null,
    });
}

export function useEndedIncomes(dates: string[], activeIds: Set<string>) {
    const results = useQueries({
        queries: dates.map((date) => ({
            queryKey: [...KEY, "at", date],
            queryFn: () => getIncomes(date),
            staleTime: 5 * 60 * 1000,
        })),
    });

    const byId = new Map<string, Income>();
    const lastSeen = new Map<string, string>();

    // dates ist absteigend → erster Treffer = letzter Tag, an dem es aktiv war
    results.forEach((r, i) => {
        const date = dates[i];
        if (!date) return;
        for (const income of r.data ?? []) {
            if (activeIds.has(income.income_id) || byId.has(income.income_id)) continue;
            byId.set(income.income_id, income);
            lastSeen.set(income.income_id, date);
        }
    });

    const items = [...byId.values()].sort(
        (a, b) => lastSeen.get(b.income_id)!.localeCompare(lastSeen.get(a.income_id)!),
    );

    return {
        items,
        lastSeen,
        isLoading: results.some((r) => r.isLoading),
        isError: results.some((r) => r.isError),
    };
}