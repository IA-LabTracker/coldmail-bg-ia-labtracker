"use client";

import { Schedule } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteScheduleDialogProps {
  schedule: Schedule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteScheduleDialog({
  schedule,
  open,
  onOpenChange,
  onConfirm,
}: DeleteScheduleDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to delete &quot;{schedule?.name}&quot;? This action cannot
          be undone.
        </AlertDialogDescription>
        <div className="flex justify-between gap-3">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
