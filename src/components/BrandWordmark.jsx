function BrandWordmark({ animateBook = false, onClick }) {
  return (
    <h1>
      <button
        aria-label="Go home"
        className="relative inline-flex items-end pb-1 text-[2.1rem] font-semibold leading-none tracking-normal text-stone-950 transition hover:text-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-100 dark:text-stone-100 dark:hover:text-teal-300 dark:focus:ring-teal-950 sm:text-5xl"
        onClick={onClick}
        type="button"
      >
        <span>she</span>
        <span
          aria-hidden="true"
          className={`mx-0.5 inline-block origin-center rounded-[0.12em] bg-teal-700 px-[0.045em] font-medium text-[#fafbf8] shadow-sm dark:bg-teal-500 dark:text-stone-950 ${
            animateBook ? "brand-book-tilt" : "-rotate-6"
          }`}
        >
          l
        </span>
        <span>vd</span>
        <span aria-hidden="true" className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-stone-300 dark:bg-stone-700" />
      </button>
    </h1>
  );
}

export default BrandWordmark;
