import {z} from "zod";

export const householdSchema = z.object({
    name: z.string().min(1, "Bitte gib einen Namen ein"),
    address: z.string().regex(/^.+\s\d+.*$/, "Format: Straße Hausnummer (z. B. Hauptstraße 42)"),
    postal_code: z.string().regex(/^\d{5}$/, "Genau 5 Ziffern"),
    city: z.string().min(2, "Zu kurz"),
    currency: z.enum(["EUR", "USD"]),
});

export type HouseholdValues = z.infer<typeof householdSchema>;

export const joinSchema = z.object({
    household_id: z.string().min(1, "Bitte Haushalts-ID eingeben"),
});

export type JoinValues = z.infer<typeof joinSchema>;

export const selectClass =
    "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";