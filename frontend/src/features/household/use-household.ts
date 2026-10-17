import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {
    createHousehold, deleteHousehold,
    getHouseholdJoinRequests,
    getHouseholdMembers,
    getMyHousehold, getMyJoinRequests, type HouseholdCreatePayload,
    type HouseholdPayload, joinHousehold,
    leaveHousehold,
    respondJoinRequest,
    updateHousehold
} from "@/features/household/api.ts";

export const MY_JOIN_REQUESTS_KEY = ["household", "my-join-requests"];
export const HOUSEHOLD_JOIN_REQUESTS_KEY = ["household", "join-requests"];

export function useMyHousehold(){
    return useQuery({
        queryKey: ["household", "mine"],
        queryFn: getMyHousehold,
    });
}
export function useCreateHousehold(){
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: HouseholdCreatePayload) => createHousehold(payload),
        onSuccess: (data) => {
            queryClient.setQueryData(["household", "mine"], data);
        },
    });
}

export function useJoinHousehold(){
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (householdId: string) => joinHousehold(householdId),
        onSuccess: () => queryClient.invalidateQueries({queryKey: MY_JOIN_REQUESTS_KEY}),
    });
}

export function useUpdateHousehold(){
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: HouseholdPayload) => updateHousehold(payload),
        onSuccess: (data) => {
            queryClient.setQueryData(["household", "mine"], data);
        },
    });
}

export function useLeaveHousehold(){
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: leaveHousehold,
        onSuccess: () => {
            queryClient.setQueryData(["household", "mine"], null)
        }
    })
}

export function useDeleteHousehold(){
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteHousehold,
        onSuccess: () => {
            queryClient.setQueryData(["household", "mine"], null);
        },
    });
}

export function useHouseholdMembers(enabled: boolean = true){
    const {data: household} = useMyHousehold();
    const householdId = household?.household_id;
    return useQuery({
        queryKey: ["household", "members", householdId],
        queryFn: getHouseholdMembers,
        enabled: enabled && !!householdId,
    });
}

export function useMyJoinRequests(enabled: boolean = true){
    return useQuery({
        queryKey: MY_JOIN_REQUESTS_KEY,
        queryFn: getMyJoinRequests,
        enabled,
        refetchInterval: (query) =>
            query.state.data?.some((r) => r.status === "pending") ? 10_000 : false,
    });
}

export function useHouseholdJoinRequests(enabled: boolean = true){
    return useQuery({
        queryKey: HOUSEHOLD_JOIN_REQUESTS_KEY,
        queryFn: getHouseholdJoinRequests,
        enabled,
        refetchInterval: 15_000,
    });
}

export function useRespondJoinRequest(){
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({requestId, approve}: {requestId: string; approve: boolean}) =>
            respondJoinRequest(requestId, approve),
        onSettled: async () => {
            await queryClient.invalidateQueries({queryKey: HOUSEHOLD_JOIN_REQUESTS_KEY});
            await queryClient.invalidateQueries({queryKey: ["household", "members"]});
        },
    });
}
