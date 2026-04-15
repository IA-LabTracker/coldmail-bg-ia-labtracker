"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const loginSchema = z.object({
  email: z.string().email("Digite um e-mail válido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError("");
    try {
      await signIn(values.email, values.password);
      router.push("/");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Falha ao entrar. Tente novamente.");
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left — Form */}
      <div className="flex w-full flex-col px-6 py-8 lg:w-1/2 lg:px-0">
        <div className="mx-auto w-full max-w-[400px] lg:ml-auto lg:mr-[80px]">
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
              Bem-vindo de volta
            </h1>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Entre com seu e-mail e senha para acessar sua conta.
            </p>
          </div>

          {message && (
            <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
              {message}
            </div>
          )}

          {serverError && (
            <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {serverError}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                          placeholder="Digite sua senha"
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
                          {showPassword ? (
                            <EyeOff className="h-[18px] w-[18px]" />
                          ) : (
                            <Eye className="h-[18px] w-[18px]" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
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
                    Entrar
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </Form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Não tem uma conta?{" "}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              Criar conta
            </Link>
          </p>

          {/* Footer */}
          <div className="mt-16 flex items-center justify-between text-xs text-muted-foreground/60">
            <span>&copy; {new Date().getFullYear()} Cold Email Pro</span>
            <Link href="/terms" className="hover:text-muted-foreground hover:underline">
              Termos de Uso
            </Link>
          </div>
        </div>
      </div>

      {/* Right — Illustration panel */}
      <div className="hidden overflow-hidden rounded-l-[40px] bg-primary lg:flex lg:w-1/2 lg:flex-col lg:items-center lg:justify-center lg:p-12">
        <div className="flex max-w-lg flex-col items-center text-center">
          <div className="relative mb-10 w-full max-w-[420px]">
            <Image
              src="/illustrations/email-campaign.svg"
              alt="Email campaign illustration"
              width={420}
              height={380}
              className="drop-shadow-2xl"
              priority
            />
          </div>

          <h2 className="text-2xl font-bold leading-tight text-primary-foreground">
            Gerencie seus leads e<br />automatize seu outreach.
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-primary-foreground/60">
            Importe contatos, crie campanhas personalizadas e acompanhe resultados em tempo real.
          </p>
        </div>
      </div>
    </div>
  );
}
