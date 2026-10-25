import {useMutation, useQueryClient} from "@tanstack/react-query";
import {useNavigate} from "react-router";
import {deleteAccount, getDataExport} from "./api";
import {downloadFile, toCsv, toJson} from "./export-format";

export type ExportFormat = "json" | "csv";

export function useDataExport() {
    return useMutation({
        mutationFn: async (format: ExportFormat) => {
            const data = await getDataExport();
            const date = new Date().toISOString().slice(0, 10);
            if (format === "csv") {
                downloadFile(toCsv(data), `finanzmoench_daten_${date}.csv`, "text/csv;charset=utf-8");
            } else {
                downloadFile(toJson(data), `finanzmoench_daten_${date}.json`, "application/json");
            }
        },
    });
}

export function useDeleteAccount() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: deleteAccount,
        onSuccess: async () => {
            // Wie beim Logout: Nutzerdaten verwerfen, Session neu holen -> "anonymous"
            queryClient.removeQueries({predicate: (q) => q.queryKey[0] !== "auth"});
            await queryClient.resetQueries({queryKey: ["auth", "session"]});
            navigate("/", {replace: true});
        },
    });
}