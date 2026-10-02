import {useMutation} from "@tanstack/react-query";
import {askJeremy} from "./api";

export function useAskJeremy() {
    return useMutation({mutationFn: askJeremy});
}