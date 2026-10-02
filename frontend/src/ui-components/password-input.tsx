import * as React from "react"
import {EyeIcon, EyeOffIcon} from "lucide-react"
import {Input} from "@/ui-components/ui/input"

export function PasswordInput(props: Omit<React.ComponentProps<"input">, "type">) {
    const [visible, setVisible] = React.useState(false)

    return (
        <div className="relative">
            <Input
                {...props}
                type={visible ? "text" : "password"}
                className="pr-10"
            />
            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? "Passwort verbergen" : "Passwort anzeigen"}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                tabIndex={-1}
            >
                {visible ? <EyeOffIcon className="size-4"/> : <EyeIcon className="size-4"/>}
            </button>
        </div>
    )
}