import { Library } from "lucide-react";
import BrandWordmark from "./BrandWordmark";

function AppHeader() {
  return (
    <section className="app-header sticky top-0 z-20 border-b border-white/10 bg-[#11100e]/[0.92] backdrop-blur sm:static sm:bg-[#11100e]/90">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 pb-3 pt-2 sm:px-6 sm:py-4 lg:px-8">
        <div className="min-w-0">
          <BrandWordmark />
          <div className="mt-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-shelf-accent-bright/80 sm:mt-2 sm:text-sm sm:tracking-[0.14em]">
            <Library size={15} />
            Track your media without the noise
          </div>
        </div>
      </div>
    </section>
  );
}

export default AppHeader;
