"use client";

import { ReactNode } from "react";
import { AlertModal } from "@/components/shared/AlertModal";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
}: ConfirmDeleteDialogProps) {
  return (
    <AlertModal open={open} onOpenChange={onOpenChange}>
      <AlertModal.Header>
        <AlertModal.Title>{title}</AlertModal.Title>
        <AlertModal.Description>{description}</AlertModal.Description>
      </AlertModal.Header>
      <AlertModal.Footer>
        <AlertModal.Cancel>Cancel</AlertModal.Cancel>
        <AlertModal.Action onClick={onConfirm} className="bg-red-600 hover:bg-red-700">
          {confirmLabel}
        </AlertModal.Action>
      </AlertModal.Footer>
    </AlertModal>
  );
}
