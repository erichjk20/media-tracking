import { useState } from "react";
import { getFinishedDateLabel, getFinishedDatePrecision, getLocalDate } from "../lib/mediaDates";

function FinishedDateField({ category, onChange, value }) {
  const today = getLocalDate();
  const label = getFinishedDateLabel(category);
  const [precision, setPrecision] = useState(() => getFinishedDatePrecision(value));
  const choiceClassName = "inline-flex min-h-9 items-center justify-center rounded-md border px-3 text-xs font-semibold transition focus:outline-none focus:ring-4 focus:ring-shelf-accent-deep/35";
  const selectedClassName = "border-shelf-accent/30 bg-shelf-accent-deep/10 text-shelf-accent-deep dark:bg-shelf-accent-deep/20 dark:text-shelf-accent-soft";
  const unselectedClassName = "border-stone-300 text-stone-600 hover:bg-stone-100 dark:border-white/10 dark:text-stone-300 dark:hover:bg-white/5";

  function changePrecision(nextPrecision) {
    setPrecision(nextPrecision);
    if (nextPrecision === "unknown") onChange("");
    else if (nextPrecision === "month") onChange(value ? value.slice(0, 7) : "");
    else onChange(getFinishedDatePrecision(value) === "day" ? value : "");
  }

  return (
    <div>
      <p className="text-sm font-medium text-stone-700 dark:text-stone-300">When did you {label === "Watched" ? "watch" : "finish"} it?</p>
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={`${label} date choices`}>
        {[{ value: "day", label: "Exact date" }, { value: "month", label: "Month & year" }, { value: "unknown", label: "Don't remember" }].map((option) => (
          <button
            key={option.value}
            className={`${choiceClassName} ${precision === option.value ? selectedClassName : unselectedClassName}`}
            type="button"
            aria-pressed={precision === option.value}
            onClick={() => changePrecision(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {precision !== "unknown" && (
        <label className="mt-3 block text-sm font-medium text-stone-700 dark:text-stone-300">
          {label} {precision === "month" ? "in" : "on"}
          <input
            key={precision}
            className="input mt-2 w-full min-w-0"
            type={precision === "month" ? "month" : "date"}
            min={precision === "month" ? "0001-01" : "0001-01-01"}
            placeholder={precision === "month" ? "YYYY-MM" : undefined}
            max={precision === "month" ? today.slice(0, 7) : today}
            value={value || ""}
            onChange={(event) => onChange(event.target.value)}
          />
        </label>
      )}
      <div className="mt-2">
        <button
          className={`${choiceClassName} ${value === today ? selectedClassName : unselectedClassName}`}
          type="button"
          aria-pressed={value === today}
          onClick={() => {
            setPrecision("day");
            onChange(getLocalDate());
          }}
        >
          Today
        </button>
      </div>
      <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400" aria-live="polite">
        {precision === "month" ? "Only the month and year will be saved." : value ? "Choose a different date, if needed." : "Date unknown. You can add it later."}
      </p>
    </div>
  );
}

export default FinishedDateField;
