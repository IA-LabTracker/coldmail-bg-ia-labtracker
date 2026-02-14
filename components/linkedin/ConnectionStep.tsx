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
    label: "Conectado com sucesso",
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
    label: "Conta removida",
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
    label: "Erro na conta",
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

  const fetchEvents = useCallback(async (sync = false) => {
    if (!user) return;

    setLoadingEvents(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const url = sync ? "/api/linkedin-accounts?sync=true" : "/api/linkedin-accounts";
      const res = await fetch(url, {
        headers: {
          ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
        },
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
      // Silently fail - events are supplementary info
    } finally {
      setLoadingEvents(false);
    }
  }, [user, accountId, onAccountIdChange]);

  useEffect(() => {
    // If returning from OAuth, sync from Unipile API as fallback
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          Step 1: LinkedIn Connection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {accountId ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Connected</p>
                <p className="text-sm text-green-700">Account ID: {accountId}</p>
              </div>
            </div>

            <Button
              onClick={handleDisconnect}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? <LoadingSpinner /> : "Disconnect LinkedIn"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Connect your LinkedIn account via Unipile to start building campaigns
            </p>

            <Button onClick={handleConnect} disabled={loading} className="w-full gap-2">
              {loading ? <LoadingSpinner /> : <LinkIcon className="h-4 w-4" />}
              Connect LinkedIn
            </Button>
          </div>
        )}

        {/* Webhook Events History */}
        {loadingEvents ? (
          <div className="flex items-center justify-center py-3">
            <LoadingSpinner />
          </div>
        ) : (
          events.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700">Historico de eventos</h4>
                <button onClick={() => fetchEvents(true)} className="text-xs text-gray-500 hover:text-gray-700">
                  <RefreshCw className="h-3 w-3" />
                </button>
              </div>
              <div className="max-h-48 space-y-1.5 overflow-y-auto">
                {events.map((event) => {
                  const config = getStatusConfig(event.status);
                  return (
                    <div
                      key={event.id}
                      className={`flex items-center justify-between rounded-md border px-3 py-2 ${config.bgColor} ${config.borderColor}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={config.color}>{config.icon}</span>
                        <span className={`text-sm font-medium ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
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
