import {useAuth} from "@/features/auth/useAuth";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator
} from "@/ui-components/ui/dropdown-menu";
import {DropdownMenuTrigger} from "@/ui-components/ui/dropdown-menu.tsx";
import {Avatar, AvatarFallback, AvatarImage} from "@/ui-components/ui/avatar.tsx";
import {Button} from "@/ui-components/ui/button.tsx";
import {UseLogout} from "@/features/auth/useLogout.ts";


export function AvatarUserMenu() {
    const {state} = useAuth();
    const logout = UseLogout();

    if (state.status !== "authenticated"){
        return null
    }


    return(
        <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="rounded-full"><Avatar>
                <AvatarImage src="/JeremyPB.jpg" alt="shadcn" />
                <AvatarFallback>CN</AvatarFallback>
            </Avatar></Button>} />
            <DropdownMenuContent className="w-32">
                <DropdownMenuGroup>
                    <DropdownMenuItem>
                        <a href="/profil">Profil</a>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <a href="/einstellungen">Einstlelungen</a>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator/>
                <DropdownMenuGroup>
                    <DropdownMenuItem variant="destructive" disabled={logout.isPending} onClick={() => {logout.mutate()}} >
                        <a href="/">Abmelden</a>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}