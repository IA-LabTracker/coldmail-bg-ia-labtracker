"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
      <div className="border-b border-border bg-card shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center">
            <Link href="/" className="text-xl font-bold text-foreground">
              Cold Email Pro
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-xl font-semibold text-foreground">
                Erro na Campanha
              </CardTitle>
              <CardDescription>
                Não foi possível carregar os detalhes da campanha. Tente novamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={reset} className="w-full" variant="default">
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar Novamente
              </Button>

              <Button asChild className="w-full" variant="outline">
                <Link href="/campaigns">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para Campaigns
                </Link>
              </Button>

              {process.env.NODE_ENV === "development" && (
                <details className="text-left">
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    Detalhes do erro
                  </summary>
                  <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs text-foreground">
                    {error.message}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
