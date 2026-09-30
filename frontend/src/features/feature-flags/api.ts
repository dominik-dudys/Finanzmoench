import {apiClient} from "@/shared/api";

// Hier jeden neuen Flag eintragen → Tippfehler fallen beim typecheck auf
export type FlagName = "two_factor" | "jeremy_ai";

export type Flags = Partial<Record<FlagName, boolean>>;

export async function getFlags(): Promise<Flags> {
    const res = await apiClient.get<Flags>("flags/");
    return res.data;
}