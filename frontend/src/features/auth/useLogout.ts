import {useMutation, useQueryClient} from "@tanstack/react-query";
import {useNavigate} from "react-router";
import {logout} from "./api";

const SESSION_KEY = ["auth", "session"];

export function UseLogout() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: logout,
        onSuccess: async () => {
            // Alle Nutzerdaten verwerfen (Profil, Kosten, Abo, …)
            queryClient.removeQueries({predicate: (q) => q.queryKey[0] !== "auth"});
            // Session neu vom Backend holen → AuthProvider sieht sofort "abgemeldet"
            await queryClient.resetQueries({queryKey: SESSION_KEY});
            navigate("/", {replace: true});
        },
    });
}