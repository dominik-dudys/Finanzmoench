import {useMutation, useQuery} from "@tanstack/react-query";
import {createCheckout, createPortal, getSubscriptionStatus} from "./api";

export const SUBSCRIPTION_KEY = ["payment", "status"];

// poll = true: alle 2 s neu laden, bis Premium aktiv ist (nach Rückkehr von Stripe)
export function useSubscription(poll = false, enabled = true) {
    return useQuery({
        queryKey: SUBSCRIPTION_KEY,
        queryFn: getSubscriptionStatus,
        enabled,
        refetchInterval: poll
            ? (query) => (query.state.data?.is_premium ? false : 2000)
            : false,
    });
}

export function useStartCheckout() {
    return useMutation({
        mutationFn: createCheckout,
        onSuccess: (url) => {
            window.location.href = url;
        },
    });
}

export function useOpenPortal() {
    return useMutation({
        mutationFn: createPortal,
        onSuccess: (url) => {
            window.location.href = url;
        },
    });
}