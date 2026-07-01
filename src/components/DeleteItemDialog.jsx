import { Trash2 } from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";

function DeleteItemDialog({ item, onClose, onConfirm }) {
  return (
    <ConfirmDialog
      confirmIcon={Trash2}
      confirmLabel="Delete"
      eyebrow="Delete item"
      onClose={onClose}
      onConfirm={onConfirm}
      title={item.title}
      titleId="delete-item-title"
      variant="danger"
    >
      <p className="mt-4 text-sm leading-6 text-stone-600 dark:text-stone-300">
        This will remove the item from your library.
      </p>
    </ConfirmDialog>
  );
}

export default DeleteItemDialog;
