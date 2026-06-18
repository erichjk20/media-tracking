import { Star } from "lucide-react";

function Rating({ value, onChange, readOnly = false, compact = false }) {
  const starSize = compact ? 13 : 18;
  const buttonSize = compact ? "h-6 w-6" : "h-8 w-8";

  return (
    <div className={`flex items-center gap-0.5 ${compact ? "mt-1 h-5" : "h-8 gap-1"}`} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((rating) => {
        const filled = rating <= value;
        const classes = filled ? "fill-amber-400 text-amber-500" : "text-stone-300 dark:text-stone-600";
        if (readOnly) {
          return <Star key={rating} className={classes} size={starSize} />;
        }

        return (
          <button
            key={rating}
            className={`inline-flex ${buttonSize} items-center justify-center rounded text-stone-400 transition hover:bg-amber-50 hover:text-amber-500 dark:text-stone-500 dark:hover:bg-amber-950/40 dark:hover:text-amber-300`}
            onClick={() => onChange(rating)}
            type="button"
            aria-label={`${rating} stars`}
            title={`${rating} stars`}
          >
            <Star className={classes} size={compact ? 15 : 20} />
          </button>
        );
      })}
    </div>
  );
}

export default Rating;
