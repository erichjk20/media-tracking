// Completion is a calendar date, so it must never shift with UTC conversion.
export function getLocalDate(value = new Date()) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return [
    String(date.getFullYear()).padStart(4, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function isValidDateOnly(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
  if (value.startsWith("0000-")) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function isValidMonthOnly(value) {
  return typeof value === "string" && value.length === 7 && /^(?!0000)[0-9]{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function getFinishedDatePrecision(value) {
  if (isValidDateOnly(value)) return "day";
  if (isValidMonthOnly(value)) return "month";
  return "unknown";
}

export function getFinishedDateError(value, today = getLocalDate()) {
  if (!value) return "";
  if (isValidMonthOnly(value)) {
    return value > today.slice(0, 7) ? "The finished month cannot be in the future." : "";
  }
  if (!isValidDateOnly(value)) return "Choose a valid finished date.";
  if (value > today) return "The finished date cannot be in the future.";
  return "";
}

export function getFinishedDateLabel(category) {
  return category === "movies" || category === "tv" ? "Watched" : "Finished";
}

export function getMediaActivityDate(item) {
  const isCompleted = item.status === "Completed";
  const dateTime = isCompleted ? item.finishedOn : item.addedAt;
  return {
    label: isCompleted ? getFinishedDateLabel(item.category) : "Added",
    dateTime,
    value: formatMediaDate(dateTime, { dateOnly: isCompleted }),
  };
}

export function formatMediaDate(value, { dateOnly = false } = {}) {
  const isMonth = dateOnly && isValidMonthOnly(value);
  if (!value || (dateOnly && !isMonth && !isValidDateOnly(value))) return "";
  // A temporary anchor is only for Intl formatting; month-only entries store no day.
  const date = new Date(dateOnly ? `${value}${isMonth ? "-01" : ""}T12:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: isMonth ? "long" : "short",
    ...(isMonth ? {} : { day: "numeric" }),
    ...(dateOnly ? { timeZone: "UTC" } : {}),
  }).format(date);
}
