import { cn } from "cn"
import * as React from "react"
import {useForm} from "react-hook-form"
import {zodResolver} from "@hookform/resolvers/zod"
import {z} from "zod"
import {useMutation, useQueryClient} from "@tanstack/react-query"
import {useLocation, useNavigate} from "react-router"
import { Button } from "@/ui-components/ui/button"
import { Card, CardContent } from "@/ui-components/ui/card"
import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/ui-components/ui/field"
import { Input } from "@/ui-components/ui/input"
import {isAllauthResponse, requestPasswordReset} from "@/features/auth/api.ts"

const forgotSchema = z.object({
    email: z.email("Bitte gib eine gültige E-Mail-Adresse ein"),
})

type ForgotValues = z.infer<typeof forgotSchema>

export function ForgotPasswordForm({
                                       className,
                                       ...props
                                   }: React.ComponentProps<"div">) {
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const location = useLocation()
    const prefill = (location.state as {email?: string} | null)?.email ?? ""

    const {
        register,
        handleSubmit,
        setError,
        formState: {errors},
    } = useForm<ForgotValues>({
        resolver: zodResolver(forgotSchema),
        defaultValues: {email: prefill}
    })

    const mutation = useMutation({
        mutationFn: (v: ForgotValues) => requestPasswordReset(v.email),
        onSuccess: async (_data, variables) => {
            // Session neu laden, damit der Zustand "pending_password_reset" bekannt ist
            await queryClient.invalidateQueries({queryKey: ["auth", "session"]})
            navigate("/forgot-password/reset", {state: {email: variables.email}})
        },
        onError: (err) => {
            if (isAllauthResponse(err) && err.status === 429) {
                setError("root", {message: "Zu viele Versuche. Bitte warte einen Moment."})
            } else {
                setError("root", {message: "Das hat nicht geklappt. Bitte versuche es später erneut."})
            }
        },
    })

    const onSubmit = handleSubmit((values) => mutation.mutate(values))

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardContent className="p-6 md:p-8">
                    <form onSubmit={onSubmit} noValidate>
                        <FieldGroup>
                            <div className="flex flex-col items-center gap-2 text-center">
                                <h1 className="text-2xl font-bold">Passwort vergessen?</h1>
                                <p className="text-sm text-balance text-muted-foreground">
                                    Gib deine E-Mail-Adresse ein. Wir schicken dir einen Code, mit dem du ein neues Passwort festlegen kannst.
                                </p>
                            </div>
                            <Field>
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <Input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="m@example.com"
                                    aria-invalid={!!errors.email}
                                    {...register("email")}
                                />
                                <FieldError errors={[errors.email]} />
                            </Field>
                            <Field>
                                {errors.root && <FieldError>{errors.root.message}</FieldError>}
                                <Button type="submit" disabled={mutation.isPending}>
                                    {mutation.isPending ? "Wird gesendet..." : "Code senden"}
                                </Button>
                            </Field>
                            <FieldDescription className="text-center">
                                <a href="/login">Zurück zur Anmeldung</a>
                            </FieldDescription>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}