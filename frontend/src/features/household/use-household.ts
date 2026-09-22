import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {getMyHousehold, type HouseholdPayload, leaveHousehold, updateHousehold} from "@/features/household/api.ts";

export function useMyHousehold(){
    return useQuery({
        queryKey: ["household", "mine"],
        queryFn: getMyHousehold,
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