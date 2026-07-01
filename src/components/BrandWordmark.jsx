function BrandWordmark({ animateBook = false, onClick }) {
  return (
    <h1>
      <button
        aria-label="Go home"
        className="relative inline-flex items-end pb-1 text-[2.1rem] font-semibold leading-none tracking-normal text-[#eee9df] transition hover:text-shelf-accent-soft focus:outline-none focus:ring-4 focus:ring-shelf-accent-deep/35 sm:text-5xl"
        onClick={onClick}
        type="button"
      >
        <span>she</span>
        <span
          aria-hidden="true"
          className={`mx-0.5 inline-block origin-center rounded-[0.12em] bg-shelf-accent-bright/90 px-[0.045em] font-medium text-[#11100e] shadow-sm ${
            animateBook ? "brand-book-tilt" : "-rotate-6"
          }`}
        >
          l
        </span>
        <span>vd</span>
        <span aria-hidden="true" className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-white/10" />
      </button>
    </h1>
  );
}

export default BrandWordmark;
