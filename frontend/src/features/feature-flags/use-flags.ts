import {useQuery} from "@tanstack/react-query";
import {getFlags, type FlagName} from "./api";

export function useFlags() {
    return useQuery({
        queryKey: ["feature-flags"],
        queryFn: getFlags,
        staleTime: 5 * 60_000, // Flags ändern sich selten
    });
}

/** false, solange geladen wird oder der Flag nicht existiert */
export function useFlag(name: FlagName): boolean {
    const {data} = useFlags();
    return data?.[name] ?? false;
}