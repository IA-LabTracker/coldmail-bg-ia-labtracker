"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AlertCircle, Eye, EyeOff, Loader2, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const signupSchema = z
  .object({
    email: z.string().email("Digite um e-mail válido"),
    password: z.string().min(6, "Mínimo de 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirme sua senha"),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "Você deve aceitar os Termos de Uso" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false as unknown as true,
    },
  });

  const onSubmit = async (values: SignupFormValues) => {
    setServerError("");
    try {
      await signUp(values.email, values.password);
      router.push("/login?message=Conta criada! Verifique seu e-mail para confirmar.");
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Falha ao criar conta. Tente novamente.",
      );
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left — Illustration panel */}
      <div className="hidden overflow-hidden rounded-r-[40px] bg-primary lg:flex lg:w-1/2 lg:flex-col lg:items-center lg:justify-center lg:p-12">
        <div className="flex max-w-lg flex-col items-center text-center">
          <div className="relative mb-10 w-full max-w-[400px]">
            <Image
              src="/illustrations/marketing.svg"
              alt="Marketing dashboard illustration"
              width={400}
              height={300}
              className="drop-shadow-2xl"
              priority
            />
          </div>

          <h2 className="text-2xl font-bold leading-tight text-primary-foreground">
            Comece a escalar suas<br />vendas B2B hoje.
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-primary-foreground/60">
            Crie sua conta gratuita e tenha acesso a todas as ferramentas de prospecção e automação.
          </p>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex w-full flex-col px-6 py-8 lg:w-1/2 lg:px-0">
        <div className="mx-auto w-full max-w-[400px] lg:mr-auto lg:ml-[80px]">
          {/* Logo */}
          <div className="mb-16">
            <span className="text-xl font-light tracking-tight text-foreground">
              c<span className="font-semibold">old</span>
              <span className="font-extralight">m</span>
              <span className="font-semibold">ail</span>
            </span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-[28px] font-bold tracking-tight text-foreground">
              Criar conta
            </h1>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Preencha os dados abaixo para começar.
            </p>
          </div>

          {serverError && (
            <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {serverError}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">
                      E-mail
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground/60" />
                        <Input
                          type="email"
                          placeholder="seu@email.com"
                          className="h-12 rounded-lg pl-11 text-[15px]"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">
                      Senha
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Mínimo 6 caracteres"
                          className="h-12 rounded-lg pr-11 text-[15px]"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground/60 transition-colors hover:text-foreground"
                          tabIndex={-1}
                          aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                        >
                          {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">
                      Confirmar senha
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirm ? "text" : "password"}
                          placeholder="Repita sua senha"
                          className="h-12 rounded-lg pr-11 text-[15px]"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((v) => !v)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground/60 transition-colors hover:text-foreground"
                          tabIndex={-1}
                          aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
                        >
                          {showConfirm ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="acceptTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-1">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal text-muted-foreground">
                        Li e aceito os{" "}
                        <Link
                          href="/terms"
                          target="_blank"
                          className="font-semibold text-primary hover:underline"
                        >
                          Termos de Uso
                        </Link>
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="h-12 w-full rounded-lg gap-2 text-[15px] font-semibold"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Criar conta
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </Form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Entrar
            </Link>
          </p>

          {/* Footer */}
          <div className="mt-12 flex items-center justify-between text-xs text-muted-foreground/60">
            <span>&copy; {new Date().getFullYear()} Cold Email Pro</span>
            <Link href="/terms" className="hover:text-muted-foreground hover:underline">
              Termos de Uso
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
