import { Check } from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";
import Rating from "./Rating";

function CompleteItemDialog({
  item,
  onClose,
  onConfirm,
  onRatingChange,
  rating,
}) {
  return (
    <ConfirmDialog
      confirmIcon={Check}
      confirmLabel="Done"
      eyebrow="Move to completed"
      onClose={onClose}
      onConfirm={onConfirm}
      title={item.title}
      titleId="complete-item-title"
    >
      <div className="mt-5">
        <p className="mb-2 text-sm font-medium text-stone-700 dark:text-stone-300">Your rating</p>
        <Rating value={rating} onChange={onRatingChange} />
      </div>
    </ConfirmDialog>
  );
}

export default CompleteItemDialog;
