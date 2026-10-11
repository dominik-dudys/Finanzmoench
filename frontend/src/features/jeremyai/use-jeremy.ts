import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {askJeremy, getAiUsage} from "./api";

export const AI_USAGE_KEY = ["jeremy", "usage"];

export function useAiUsage(enabled = true) {
    return useQuery({
        queryKey: AI_USAGE_KEY,
        queryFn: getAiUsage,
        enabled,
    });
}

export function useAskJeremy() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: askJeremy,
        onSettled: () => queryClient.invalidateQueries({queryKey: AI_USAGE_KEY}),
    });
}