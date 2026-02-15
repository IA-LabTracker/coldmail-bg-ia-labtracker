"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  CheckCircle,
  AlertCircle,
  LinkIcon,
  Wifi,
  WifiOff,
  RefreshCw,
  Loader2,
} from "lucide-react";

interface LinkedInAccount {
  id: string;
  account_id: string;
  display_name: string;
  provider: string;
  status: string; // OK, STOPPED, ERROR, CREDENTIALS, CONNECTING, etc.
  linkedin_username?: string;
  connected_at: string;
  is_active: boolean;
}

interface ConnectionStepProps {
  accountId: string | null;
  onAccountIdChange: (id: string | null) => void;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; dotColor: string; textColor: string }
> = {
  OK: {
    label: "Running",
    icon: <CheckCircle className="h-4 w-4" />,
    dotColor: "bg-green-500 dark:bg-green-500/70",
    textColor: "text-green-700 dark:text-green-400",
  },
  CONNECTING: {
    label: "Conectando...",
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
    dotColor: "bg-yellow-500",
    textColor: "text-yellow-700",
  },
  STOPPED: {
    label: "Parado",
    icon: <WifiOff className="h-4 w-4" />,
    dotColor: "bg-orange-500",
    textColor: "text-orange-700",
  },
  ERROR: {
    label: "Erro",
    icon: <WifiOff className="h-4 w-4" />,
    dotColor: "bg-red-500",
    textColor: "text-red-700",
  },
  CREDENTIALS: {
    label: "Credenciais",
    icon: <AlertCircle className="h-4 w-4" />,
    dotColor: "bg-red-500",
    textColor: "text-red-700",
  },
  PERMISSIONS: {
    label: "Permissões",
    icon: <AlertCircle className="h-4 w-4" />,
    dotColor: "bg-red-500",
    textColor: "text-red-700",
  },
};

function getStatusConfig(status: string) {
  return (
    STATUS_CONFIG[status] ?? {
      label: status,
      icon: <Wifi className="h-4 w-4" />,
      dotColor: "bg-gray-400",
      textColor: "text-gray-600",
    }
  );
}

export function ConnectionStep({ accountId, onAccountIdChange }: ConnectionStepProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [accounts, setAccounts] = useState<LinkedInAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  const fetchAccounts = useCallback(async () => {
    if (!user) return;

    setLoadingAccounts(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      const res = await fetch("/api/linkedin-accounts", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const accs: LinkedInAccount[] = data.accounts || [];
        setAccounts(accs);

        // Auto-select the latest active account if none selected
        if (!accountId && accs.length > 0) {
          const connected = accs.find((a) => a.is_active);
          if (connected) {
            onAccountIdChange(connected.account_id);
          }
        }
      }
    } catch {
      // Silently fail
    } finally {
      setLoadingAccounts(false);
    }
  }, [user, accountId, onAccountIdChange]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleConnect = async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch("/api/unipile-auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
        },
        body: JSON.stringify({
          success_redirect_url: `${window.location.origin}/settings?connected=true`,
          failure_redirect_url: `${window.location.origin}/settings?connected=false`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create auth link");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No OAuth URL returned from server");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect LinkedIn");
      setLoading(false);
    }
  };

  const handleDisconnect = async (targetAccountId: string) => {
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("No session");
      }

      const res = await fetch("/api/linkedin-accounts", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ account_id: targetAccountId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove account");
      }

      // Remove from local state
      setAccounts((prev) => prev.filter((a) => a.account_id !== targetAccountId));

      // Clear selection if this was the active account
      if (accountId === targetAccountId) {
        onAccountIdChange(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect");
    } finally {
      setLoading(false);
    }
  };

  const isConnected = !!accountId;
  const activeAccounts = accounts.filter((a) => a.is_active);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-base">
            <LinkIcon className="h-5 w-5" />
            LinkedIn Connection
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${
                isConnected ? "bg-green-500 dark:bg-green-500/70" : "bg-gray-300 dark:bg-gray-600"
              }`}
            />
            <span
              className={`text-xs font-medium ${
                isConnected
                  ? "text-green-700 dark:text-green-400"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            >
              {isConnected ? "Ativo" : "Inativo"}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {loadingAccounts ? (
          <div className="flex items-center justify-center py-4">
            <LoadingSpinner />
          </div>
        ) : activeAccounts.length > 0 ? (
          <div className="space-y-2">
            {activeAccounts.map((account) => {
              const config = getStatusConfig(account.status);
              const isSelected = account.account_id === accountId;

              return (
                <div
                  key={account.id}
                  className={`rounded-lg border p-3 transition-colors ${
                    isSelected
                      ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
                      : "border-border bg-card hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                        <LinkIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {account.display_name || "LinkedIn"}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.textColor} bg-opacity-10`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${config.dotColor}`} />
                            {config.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {account.linkedin_username
                            ? `@${account.linkedin_username}`
                            : `ID: ${account.account_id.substring(0, 16)}...`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isSelected && (
                        <Button
                          onClick={() => onAccountIdChange(account.account_id)}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          Usar
                        </Button>
                      )}
                      {isSelected && (
                        <Button
                          onClick={() => handleDisconnect(account.account_id)}
                          disabled={loading}
                          variant="ghost"
                          size="sm"
                          className="text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
                        >
                          {loading ? <LoadingSpinner /> : "Remover"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Conecte sua conta LinkedIn via Unipile para iniciar campanhas
            </p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            onClick={handleConnect}
            disabled={loading}
            variant={activeAccounts.length > 0 ? "outline" : "default"}
            className="flex-1 gap-2"
            size="sm"
          >
            {loading ? <LoadingSpinner /> : <LinkIcon className="h-4 w-4" />}
            {activeAccounts.length > 0 ? "Conectar outra conta" : "Conectar LinkedIn"}
          </Button>
          {accounts.length > 0 && (
            <Button
              onClick={fetchAccounts}
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={loadingAccounts}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingAccounts ? "animate-spin" : ""}`} />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
