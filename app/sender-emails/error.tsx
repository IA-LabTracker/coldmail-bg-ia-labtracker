"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center">
            <Link href="/" className="text-sm font-semibold text-foreground">
              Cold Email Pro
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-sm px-4 pt-24 text-center">
        <p className="text-sm font-medium text-foreground">
          Erro ao carregar emails remetentes
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Verifique sua conexao e tente novamente.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={reset} size="sm" variant="outline">
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Tentar novamente
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link href="/dashboard">Voltar ao dashboard</Link>
          </Button>
        </div>

        {process.env.NODE_ENV === "development" && (
          <details className="mt-8 text-left">
            <summary className="cursor-pointer text-[11px] text-muted-foreground/60 hover:text-muted-foreground">
              Detalhes do erro
            </summary>
            <pre className="mt-2 text-[11px] bg-muted p-3 rounded-lg overflow-auto text-muted-foreground">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
