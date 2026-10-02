import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {getMe, updateMe, type UpdatePersonPayload} from "@/features/profile/api.ts";

export function useMe(){
    return useQuery({
        queryKey: ["profile", "me"],
        queryFn: getMe,
    });
}

export function useUpdateMe(){
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: UpdatePersonPayload) => updateMe(payload),
        onSuccess: (data) => {
            queryClient.setQueryData(["profile", "me"], data);
        },
    });
}