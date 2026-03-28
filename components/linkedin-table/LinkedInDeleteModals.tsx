import { LinkedInMessage } from "@/types";
import { AlertModal } from "@/components/shared/AlertModal";

interface LinkedInDeleteModalsProps {
  deleteTarget: LinkedInMessage | null;
  deleteModalOpen: boolean;
  onDeleteOpenChange: (open: boolean) => void;
  onConfirmDelete: () => void;
  bulkDeleteModalOpen: boolean;
  onBulkDeleteOpenChange: (open: boolean) => void;
  onConfirmBulkDelete: () => void;
  selectedCount: number;
}

export function LinkedInDeleteModals({
  deleteTarget,
  deleteModalOpen,
  onDeleteOpenChange,
  onConfirmDelete,
  bulkDeleteModalOpen,
  onBulkDeleteOpenChange,
  onConfirmBulkDelete,
  selectedCount,
}: LinkedInDeleteModalsProps) {
  return (
    <>
      <AlertModal open={deleteModalOpen} onOpenChange={onDeleteOpenChange}>
        <AlertModal.Header>
          <AlertModal.Title>Delete Record</AlertModal.Title>
          <AlertModal.Description>
            Are you sure you want to delete the record for{" "}
            <strong>
              {deleteTarget ? `${deleteTarget.first_name} ${deleteTarget.last_name}`.trim() : ""}
            </strong>
            ? This action cannot be undone.
          </AlertModal.Description>
        </AlertModal.Header>
        <AlertModal.Footer>
          <AlertModal.Cancel>Cancel</AlertModal.Cancel>
          <AlertModal.Action onClick={onConfirmDelete} className="bg-red-600 hover:bg-red-700">
            Delete
          </AlertModal.Action>
        </AlertModal.Footer>
      </AlertModal>

      <AlertModal open={bulkDeleteModalOpen} onOpenChange={onBulkDeleteOpenChange}>
        <AlertModal.Header>
          <AlertModal.Title>Delete Selected Records</AlertModal.Title>
          <AlertModal.Description>
            Are you sure you want to delete <strong>{selectedCount}</strong> selected record
            {selectedCount > 1 ? "s" : ""}? This action cannot be undone.
          </AlertModal.Description>
        </AlertModal.Header>
        <AlertModal.Footer>
          <AlertModal.Cancel>Cancel</AlertModal.Cancel>
          <AlertModal.Action onClick={onConfirmBulkDelete} className="bg-red-600 hover:bg-red-700">
            Delete All
          </AlertModal.Action>
        </AlertModal.Footer>
      </AlertModal>
    </>
  );
}
