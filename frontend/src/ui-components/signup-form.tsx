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
import {isAllauthResponse, signup} from "@/features/auth/api.ts";

const signupSchema = z
    .object({
      email: z.email("Bitte gib eine gültige E-Mail-Adresse ein"),
      password: z.string().min(8, "Mindestens 8 Zeichen"),
      confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, {
      message: "Die Passwörter stimmen nicht überein",
      path: ["confirmPassword"],
    });

type SignupValues = z.infer<typeof  signupSchema>;

export function SignupForm({
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
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
  });

  const mutation = useMutation({
    mutationFn: (v: SignupValues)=> signup(v.email, v.password),
    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey: ["auth", "session"]});
      navigate("/register/verify");
    },
    onError: (err) => {
      if (isAllauthResponse(err) && err.errors){
        for (const e of err.errors){
          if (e.param === "email" || e.param === "password"){
            setError(e.param, {message: e.message});
          } else {
            setError("root", {message: e.message});
          }
        }
      } else {
        setError("root", {
          message: "Registrierung fehlgeschlagen. Bitte versuche es später erneut",
        });
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
                <h1 className="text-2xl font-bold">Erstelle dein Konto</h1>
                <p className="text-sm text-balance text-muted-foreground">
                  Registriere dich mit deiner E-Mail Adresse
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
                <FieldDescription>
                Deine Daten sind bei uns sicher.
                </FieldDescription>
              </Field>
              <Field>
                <Field className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="password">Passwort</FieldLabel>
                    <Input
                        id="password"
                        type="password"
                        autoComplete="new-password"
                        aria-invalid={!!errors.password}
                        {...register("password")}
                    />
                    <FieldError errors={[errors.password]}/>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-password">
                      Passwort wiederholen
                    </FieldLabel>
                    <Input
                        id="confirm-password"
                        type="password"
                        autoComplete="new-password"
                        aria-invalid={!!errors.confirmPassword}
                        {...register("confirmPassword")}
                    />
                    <FieldError errors={[errors.confirmPassword]}/>
                  </Field>
                </Field>
                <FieldDescription>
                  Dein passwort muss mindestens 8 Zeichen lang sein.
                </FieldDescription>
              </Field>
              <Field>
                {errors.root && <FieldError>{errors.root.message}</FieldError>}
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Wird erstellt..." : "Account erstellen"}
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
                  <span className="sr-only">Sign up with Google</span>
                </Button>

                <Button variant="outline" type="button" onClick={() => {window.location.href = '/accounts/github/login/'}}>
                  <img src="/github-svgrepo-com.svg" className="size-6"/>
                  <span className="sr-only">Sign up with Github</span>
                </Button>

              </Field>
              <FieldDescription className="text-center">
                Du hast bereits ein Konto? <a href="/login">Anmelden</a>
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
