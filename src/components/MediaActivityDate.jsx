import { getMediaActivityDate } from "../lib/mediaDates";

function MediaActivityDate({ item, className = "" }) {
  const { label, dateTime, value } = getMediaActivityDate(item);

  return (
    <p className={`flex flex-wrap items-baseline gap-x-1.5 ${className}`}>
      <span className="text-stone-500 dark:text-stone-400">{label}</span>
      {value ? (
        <time className="whitespace-nowrap" dateTime={dateTime}>{value}</time>
      ) : (
        <span className="text-stone-500 dark:text-stone-400">Unknown</span>
      )}
    </p>
  );
}

export default MediaActivityDate;
