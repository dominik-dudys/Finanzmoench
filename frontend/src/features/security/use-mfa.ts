import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {
    activateTotp, deactivateTotp, getAuthenticators, getRecoveryCodes,
    getTotpSetup, reauthenticate, regenerateRecoveryCodes,
} from "./mfa-api";

const KEY = ["security", "authenticators"];

export function useAuthenticators() {
    return useQuery({queryKey: KEY, queryFn: getAuthenticators});
}

/** Mutation statt Query: jedes GET erzeugt ein NEUES Secret –
 *  ein Refetch (z. B. bei Fensterfokus) würde den QR-Code ungültig machen */
export function useStartTotpSetup() {
    return useMutation({mutationFn: getTotpSetup});
}

export function useActivateTotp() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: activateTotp,
        onSuccess: () => qc.invalidateQueries({queryKey: KEY}),
    });
}

export function useDeactivateTotp() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: deactivateTotp,
        onSuccess: () => qc.invalidateQueries({queryKey: KEY}),
    });
}

export function useLoadRecoveryCodes() {
    return useMutation({mutationFn: getRecoveryCodes});
}

export function useRegenerateRecoveryCodes() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: regenerateRecoveryCodes,
        onSuccess: () => qc.invalidateQueries({queryKey: KEY}),
    });
}

export function useReauthenticate() {
    return useMutation({mutationFn: reauthenticate});
}