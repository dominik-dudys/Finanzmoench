import {useQueries} from "@tanstack/react-query";
import {getDashboardStats} from "./api";
import type {MonthRef} from "./dates";

// Ein Request pro Monat, parallel und gecacht
export function useDashboardSeries(months: MonthRef[], enabled: boolean) {
    const results = useQueries({
        queries: months.map((m) => ({
            queryKey: ["dashboard", m.year, m.month],
            queryFn: () => getDashboardStats(m.month, m.year),
            enabled,
        })),
    });

    return {
        data: results.map((r) => r.data),
        isLoading: results.some((r) => r.isLoading),
        isError: results.some((r) => r.isError),
    };
}