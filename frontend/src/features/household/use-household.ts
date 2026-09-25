import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {
    createHousehold, deleteHousehold,
    getHouseholdMembers,
    getMyHousehold, type HouseholdCreatePayload,
    type HouseholdPayload, joinHousehold,
    leaveHousehold,
    updateHousehold
} from "@/features/household/api.ts";

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
        onSuccess: (data) => {
            queryClient.setQueryData(["household", "mine"], data.household);
        },
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
    return useQuery({
        queryKey: ["household", "members"],
        queryFn: getHouseholdMembers,
        enabled,
    });
}