const ERRORS: Record<string, string> = {
    already_premium: "Du hast bereits Premium.",
    no_subscription: "Es gibt noch kein Abo zum Verwalten.",
    payment_provider_error: "Stripe ist gerade nicht erreichbar. Bitte versuch es später erneut.",
};

export function paymentErrorText(err: unknown): string {
    const code = (err as {code?: string} | null)?.code;
    return (code && ERRORS[code]) || "Etwas ist schiefgelaufen. Bitte versuch es erneut.";
}