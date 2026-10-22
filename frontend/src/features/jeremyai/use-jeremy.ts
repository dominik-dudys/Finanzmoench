import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {askJeremy, deleteChatSession, getAiUsage, getChatSessions} from "./api";

export const AI_USAGE_KEY = ["jeremy", "usage"];
export const CHAT_SESSIONS_KEY = ["jeremy", "sessions"];
export const chatSessionKey = (id: string) => ["jeremy", "session", id];

export function useAiUsage(enabled = true) {
    return useQuery({
        queryKey: AI_USAGE_KEY,
        queryFn: getAiUsage,
        enabled,
    });
}

export function useChatSessions(enabled = true) {
    return useQuery({
        queryKey: CHAT_SESSIONS_KEY,
        queryFn: getChatSessions,
        enabled,
    });
}

export function useAskJeremy() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: askJeremy,
        onSettled: () => {
            queryClient.invalidateQueries({queryKey: AI_USAGE_KEY});
            queryClient.invalidateQueries({queryKey: CHAT_SESSIONS_KEY}); // neuer Chat / neue Reihenfolge
        },
    });
}

export function useDeleteChatSession() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteChatSession,
        onSuccess: (_data, id) => {
            queryClient.removeQueries({queryKey: chatSessionKey(id)});
            queryClient.invalidateQueries({queryKey: CHAT_SESSIONS_KEY});
        },
    });
}