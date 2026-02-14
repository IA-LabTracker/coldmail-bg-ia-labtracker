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
  Trash2,
  Clock,
} from "lucide-react";

interface LinkedInAccount {
  id: string;
  client_id: string;
  account_id: string;
  status: string;
  data_conecction: string;
}

interface ConnectionStepProps {
  accountId: string | null;
  onAccountIdChange: (id: string | null) => void;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; color: string; bgColor: string; borderColor: string }
> = {
  CREATION_SUCCESS: {
    label: "Conectado",
    icon: <CheckCircle className="h-4 w-4" />,
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  CREATION_FAIL: {
    label: "Falha na conexao",
    icon: <AlertCircle className="h-4 w-4" />,
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  DELETION: {
    label: "Removida",
    icon: <Trash2 className="h-4 w-4" />,
    color: "text-gray-700",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
  },
  RECONNECTED: {
    label: "Reconectado",
    icon: <RefreshCw className="h-4 w-4" />,
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  CONNECTING: {
    label: "Conectando...",
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
    color: "text-yellow-700",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
  },
  ERROR: {
    label: "Erro",
    icon: <WifiOff className="h-4 w-4" />,
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
};

function getStatusConfig(status: string) {
  return (
    STATUS_CONFIG[status] ?? {
      label: status,
      icon: <Wifi className="h-4 w-4" />,
      color: "text-gray-700",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
    }
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ConnectionStep({ accountId, onAccountIdChange }: ConnectionStepProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [events, setEvents] = useState<LinkedInAccount[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const fetchEvents = useCallback(
    async (sync = false) => {
      if (!user) return;

      setLoadingEvents(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) return;

        const url = sync ? "/api/linkedin-accounts?sync=true" : "/api/linkedin-accounts";
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (res.ok) {
          const data = await res.json();
          const accounts: LinkedInAccount[] = data.accounts || [];
          setEvents(accounts);

          // Auto-select the latest successful account if none selected
          if (!accountId && accounts.length > 0) {
            const connected = accounts.find(
              (a) => a.status === "CREATION_SUCCESS" || a.status === "RECONNECTED",
            );
            if (connected) {
              onAccountIdChange(connected.account_id);
            }
          }
        }
      } catch {
        // Silently fail
      } finally {
        setLoadingEvents(false);
      }
    },
    [user, accountId, onAccountIdChange],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shouldSync = params.get("connected") === "true";
    fetchEvents(shouldSync);
  }, [fetchEvents]);

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
          success_redirect_url: `${window.location.origin}/linkedin?connected=true`,
          failure_redirect_url: `${window.location.origin}/linkedin?connected=false`,
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

  const handleDisconnect = async () => {
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      await supabase.from("settings").update({ linkedin_account_id: null }).eq("user_id", user.id);
      onAccountIdChange(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect");
    } finally {
      setLoading(false);
    }
  };

  const isConnected = !!accountId;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Step 1: LinkedIn Connection
          </div>
          {/* Connection status indicator */}
          <div className="flex items-center gap-2">
            <div
              className={`h-2.5 w-2.5 rounded-full ${isConnected ? "bg-green-500" : "bg-gray-300"}`}
            />
            <span
              className={`text-sm font-medium ${isConnected ? "text-green-700" : "text-gray-500"}`}
            >
              {isConnected ? "Conectado" : "Desconectado"}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {isConnected ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">LinkedIn conectado</p>
                  <p className="text-xs text-green-600">ID: {accountId}</p>
                </div>
              </div>
              <Button
                onClick={handleDisconnect}
                disabled={loading}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                {loading ? <LoadingSpinner /> : "Desconectar"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Conecte sua conta LinkedIn via Unipile para iniciar campanhas
            </p>
            <Button onClick={handleConnect} disabled={loading} className="w-full gap-2">
              {loading ? <LoadingSpinner /> : <LinkIcon className="h-4 w-4" />}
              Conectar LinkedIn
            </Button>
          </div>
        )}

        {/* Event history */}
        {loadingEvents ? (
          <div className="flex items-center justify-center py-2">
            <LoadingSpinner />
          </div>
        ) : (
          events.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Historico
                </h4>
                <button
                  onClick={() => fetchEvents(true)}
                  className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  title="Sincronizar com Unipile"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="max-h-36 space-y-1 overflow-y-auto">
                {events.map((event) => {
                  const config = getStatusConfig(event.status);
                  return (
                    <div
                      key={event.id}
                      className={`flex items-center justify-between rounded border px-3 py-1.5 ${config.bgColor} ${config.borderColor}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={config.color}>{config.icon}</span>
                        <span className={`text-xs font-medium ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        {formatDate(event.data_conecction)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
