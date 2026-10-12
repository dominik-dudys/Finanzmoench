import {useAuth} from "@/features/auth/useAuth";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
    DropdownMenuTrigger,

} from "@/ui-components/ui/dropdown-menu";
import {Avatar, AvatarFallback} from "@/ui-components/ui/avatar.tsx";
import {Button} from "@/ui-components/ui/button.tsx";
import {UseLogout} from "@/features/auth/useLogout.ts";
import {useNavigate} from "react-router";
import {useSubscription} from "@/features/payment/use-subscription";
import {PlanBadge} from "@/features/payment/plan-badge";
import {useMe} from "@/features/profile/use-me.ts";
import {JeremyAvatarImage} from "@/features/jeremyai/jeremy-avatar-image";


export function AvatarUserMenu() {
    const {state} = useAuth();
    const logout = UseLogout();
    const navigate = useNavigate();
    const isAuthenticated = state.status === "authenticated";
    const {data: sub} = useSubscription(false, isAuthenticated)
    const {data: me} = useMe();

    if (!isAuthenticated){
        return null
    }

    const isPremium = sub?.is_premium ?? false;


    return(
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button variant="ghost" size="icon" className="rounded-full" aria-label="Benutzermenü">
                        <Avatar className="overflow-hidden">
                            <JeremyAvatarImage mode={me?.jeremy_mode}/>
                            <AvatarFallback>{state.user.email.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                    </Button>
                }
            />
            <DropdownMenuContent align="end" className="w-56">
                {/* ---------- Konto ---------- */}
                <DropdownMenuGroup>
                    <DropdownMenuLabel className="flex flex-col items-start gap-1.5">
                        <span className="w-full truncate text-sm font-medium text-foreground">
                            {state.user.email}
                        </span>
                        {sub && <PlanBadge premium={isPremium}/>}
                    </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator/>

                <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => navigate("/profil")}>Profil</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/einstellungen")}>Einstellungen</DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator/>

                <DropdownMenuGroup>
                    <DropdownMenuItem
                        variant="destructive"
                        disabled={logout.isPending}
                        onClick={() => logout.mutate()}
                    >
                        Abmelden
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}