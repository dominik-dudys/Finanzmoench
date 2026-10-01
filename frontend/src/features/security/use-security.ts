import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {
    changePassword, disconnectProvider, getProviderAccounts,
    type ChangePasswordPayload,
} from "./api";

export function useChangePassword() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (p: ChangePasswordPayload) => changePassword(p),
        onSuccess: () => {
            qc.invalidateQueries({queryKey: ["profile", "me"]});
        },
    });
}

export function useProviderAccounts() {
    return useQuery({
        queryKey: ["security", "providers"],
        queryFn: getProviderAccounts,
    });
}

export function useDisconnectProvider() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({provider, account}: {provider: string; account: string}) =>
            disconnectProvider(provider, account),
        onSuccess: (data) => {
            qc.setQueryData(["security", "providers"], data);
            qc.invalidateQueries({queryKey: ["profile", "me"]}); // login_method ändert sich
        },
    });
}