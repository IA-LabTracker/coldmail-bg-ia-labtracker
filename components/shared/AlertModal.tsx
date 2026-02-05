"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function AlertModalRoot({ open, onOpenChange, children }: AlertModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>{children}</AlertDialogContent>
    </AlertDialog>
  );
}

function AlertModalHeader({ children }: { children: React.ReactNode }) {
  return <AlertDialogHeader>{children}</AlertDialogHeader>;
}

function AlertModalTitle({ children }: { children: React.ReactNode }) {
  return <AlertDialogTitle>{children}</AlertDialogTitle>;
}

function AlertModalDescription({ children }: { children: React.ReactNode }) {
  return <AlertDialogDescription>{children}</AlertDialogDescription>;
}

function AlertModalFooter({ children }: { children: React.ReactNode }) {
  return <AlertDialogFooter>{children}</AlertDialogFooter>;
}

function AlertModalCancel({ children }: { children?: React.ReactNode }) {
  return <AlertDialogCancel>{children ?? "Cancel"}</AlertDialogCancel>;
}

function AlertModalAction({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <AlertDialogAction onClick={onClick} className={className}>
      {children}
    </AlertDialogAction>
  );
}

export const AlertModal = Object.assign(AlertModalRoot, {
  Header: AlertModalHeader,
  Title: AlertModalTitle,
  Description: AlertModalDescription,
  Footer: AlertModalFooter,
  Cancel: AlertModalCancel,
  Action: AlertModalAction,
});
