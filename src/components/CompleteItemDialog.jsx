import { Check } from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";
import Rating from "./Rating";
import FinishedDateField from "./FinishedDateField";

function CompleteItemDialog({
  item,
  errorMessage,
  finishedOn,
  onClose,
  onConfirm,
  onRatingChange,
  onFinishedOnChange,
  rating,
}) {
  return (
    <ConfirmDialog
      confirmIcon={Check}
      confirmLabel="Done"
      eyebrow="Move to Done"
      onClose={onClose}
      onConfirm={onConfirm}
      title={item.title}
      titleId="complete-item-title"
    >
      <div className="mt-5 space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium text-stone-700 dark:text-stone-300">Your rating</p>
          <Rating value={rating} onChange={onRatingChange} />
        </div>
        <FinishedDateField category={item.category} value={finishedOn} onChange={onFinishedOnChange} />
        {errorMessage && <p className="text-sm text-red-700 dark:text-red-300" role="alert">{errorMessage}</p>}
      </div>
    </ConfirmDialog>
  );
}

export default CompleteItemDialog;
