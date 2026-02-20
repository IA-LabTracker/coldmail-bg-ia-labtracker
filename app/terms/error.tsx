"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl font-semibold">Erro ao Carregar os Termos</CardTitle>
          <CardDescription>
            Não foi possível carregar a página de Termos de Uso. Verifique sua conexão.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={reset} className="w-full" variant="default">
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar Novamente
          </Button>

          <Button asChild className="w-full" variant="outline">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Voltar ao Início
            </Link>
          </Button>

          {process.env.NODE_ENV === "development" && (
            <details className="text-left">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                Detalhes do erro
              </summary>
              <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto text-muted-foreground">
                {error.message}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
