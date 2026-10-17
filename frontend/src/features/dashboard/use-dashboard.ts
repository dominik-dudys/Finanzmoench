import {useQueries} from "@tanstack/react-query";
import {getDashboardStats} from "./api";
import type {MonthRef} from "./dates";
import {useMyHousehold} from "@/features/household/use-household.ts";

// Ein Request pro Monat, parallel und gecacht
export function useDashboardSeries(months: MonthRef[], enabled: boolean) {
    const {data: household} = useMyHousehold();
    const householdId = household?.household_id;
    const results = useQueries({
        queries: months.map((m) => ({
            queryKey: ["dashboard", householdId, m.year, m.month],
            queryFn: () => getDashboardStats(m.month, m.year),
            enabled: enabled && !!householdId,
        })),
    });

    return {
        data: results.map((r) => r.data),
        isLoading: results.some((r) => r.isLoading),
        isError: results.some((r) => r.isError),
    };
}