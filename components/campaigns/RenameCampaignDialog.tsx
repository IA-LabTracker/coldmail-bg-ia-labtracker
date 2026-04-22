"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RenameCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  onRenamed: (newName: string) => void;
}

export function RenameCampaignDialog({
  open,
  onOpenChange,
  currentName,
  onRenamed,
}: RenameCampaignDialogProps) {
  const { user } = useAuth();
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setName(currentName);
  }, [open, currentName]);

  const trimmed = name.trim();
  const canSave = !!trimmed && trimmed !== currentName && !saving;

  const handleSave = async () => {
    if (!user || !canSave) return;
    setSaving(true);

    const { error: checkError, count } = await supabase
      .from("emails")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("campaign_name", trimmed);

    if (checkError) {
      toast.error(checkError.message);
      setSaving(false);
      return;
    }

    if ((count ?? 0) > 0) {
      toast.error("Já existe uma campanha com esse nome");
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("emails")
      .update({ campaign_name: trimmed })
      .eq("user_id", user.id)
      .eq("campaign_name", currentName);

    if (updateError) {
      toast.error(updateError.message);
      setSaving(false);
      return;
    }

    toast.success("Campanha renomeada");
    onRenamed(trimmed);
    onOpenChange(false);
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Renomear campanha</DialogTitle>
          <DialogDescription>
            Todos os leads dessa campanha passarão a usar o novo nome.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="campaign-name">Nome</Label>
          <Input
            id="campaign-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && canSave) {
                e.preventDefault();
                handleSave();
              }
            }}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
