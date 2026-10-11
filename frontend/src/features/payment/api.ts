import {apiClient} from "@/shared/api";

export type Plan = "free" | "premium";

export interface SubscriptionStatus {
    plan: Plan;
    is_premium: boolean;
    status: string | null; // Stripe-Status, z. B. active, canceled, past_due
    current_period_end: string | null;
    cancel_at_period_end: boolean;
}

const BASE = "payment/";

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
    const res = await apiClient.get<SubscriptionStatus>(`${BASE}status/`);
    return res.data;
}

// Liefert die URL zur Stripe-Bezahlseite
export async function createCheckout(): Promise<string> {
    const res = await apiClient.post<{url: string}>(`${BASE}checkout/`);
    return res.data.url;
}

// Liefert die URL zum Stripe-Kundenportal (kündigen, Zahlungsart ändern)
export async function createPortal(): Promise<string> {
    const res = await apiClient.post<{url: string}>(`${BASE}portal/`);
    return res.data.url;
}