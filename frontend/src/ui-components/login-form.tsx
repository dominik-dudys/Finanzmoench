import { cn } from "cn"

import { Button } from "@/ui-components/ui/button"
import { Card, CardContent } from "@/ui-components/ui/card"
import {
  Field,
  FieldDescription, FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/ui-components/ui/field"
import { Input } from "@/ui-components/ui/input"
import * as React from "react";
import {z} from "zod";
import {useNavigate} from "react-router";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {zodResolver} from "@hookform/resolvers/zod";
import {useForm} from "react-hook-form";
import {isAllauthResponse, login} from "@/features/auth/api.ts";
import {toAuthState} from "@/features/auth/auth-state.ts";

const loginSchema = z.object({
  email: z.email("Bitte gib eine gültige E-Mail-Adresse ein"),
  password: z.string().min(1, "Butte gib dein Passwort ein"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setError,
    formState: {errors},
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const mutation = useMutation({
    mutationFn: (v: LoginValues) => login(v.email, v.password),
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({queryKey: ["auth", "session"]});
      const next = toAuthState(res, false);
      if (next.status === "authenticated"){
        navigate("/dashboard", {replace: true});
      } else if (next.status === "pending_login_code") {
        navigate("/login/code");
      } else if (next.status === "pending_verify_email"){
        navigate("/register/verify");
      } else {
        setError("root", {message: "Anmeldung nicht möglich. Bitte versuche es später erneut"});
      }
    },
    onError: (err) => {
      if (isAllauthResponse(err) && err.status === 429){
        setError("root", {message: "Zu viele Versuche. Bitte warte einen Moment"});
      } else if (isAllauthResponse(err) && err.errors){
        setError("root", {message: "E-Mail oder Passwort ist falsch"});
      } else {
        setError("root", {message: "Anmeldung fehlgeschlagen. Bitte versuche es später erneut"})
      }
    },
  });

  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={onSubmit} noValidate className="p-6 md:p-8">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Willkommen zurück</h1>
                <p className="text-balance text-muted-foreground">
                  Bei Finanzmönch anmelden
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
                <FieldError errors={[errors.email]}/>
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Passwort</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-2 hover:underline"
                  >
                    Passwort vergessen?
                  </a>
                </div>
                <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    aria-invalid={!!errors.password}
                    {...register("password")}
                />
                <FieldError errors={[errors.password]}/>
              </Field>
              <Field>
                {errors.root && <FieldError>{errors.root.message}</FieldError>}
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Wird angemeldet..." : "Anmelden"}
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Oder anmelden mit
              </FieldSeparator>
              <Field className="grid grid-cols-2 gap-4">

                <Button variant="outline" type="button" onClick={() => {window.location.href = '/accounts/google/login/'}}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="sr-only">Login with Google</span>
                </Button>

                <Button variant="outline" type="button" onClick={() => {window.location.href = '/accounts/github/login/'}}>
                  <img src="/github-svgrepo-com.svg" className="size-6"/>
                  <span className="sr-only">Login with GitHub</span>
                </Button>

              </Field>
              <FieldDescription className="text-center">
                Noch kein Account? <a href="/register">Registrieren</a>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="relative hidden bg-muted md:block">
            <img
              src="/finanzmoench-logo-transparent.png"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}
