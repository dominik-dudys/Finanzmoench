import {useMutation, useQueryClient} from "@tanstack/react-query";
import {useNavigate} from "react-router";
import {logout} from "./api";

export function UseLogout(){
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    return useMutation({
        mutationFn: logout,
        onSuccess: () => {
            queryClient.clear()
            navigate("/", {replace: true})
        },
    })
}