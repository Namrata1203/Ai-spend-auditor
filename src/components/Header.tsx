import { TrendingDown, ShieldCheck, Coins } from "lucide-react";

export default function Header() {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-sm" id="app-header">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center shadow-md shadow-indigo-100">
              <TrendingDown className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading text-lg font-bold tracking-tight text-slate-900">AI Spend Auditor</span>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-500">Free tool</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Sourced by <a href="https://credex.ai" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Credex Credits</a></p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Verified May 2026 Prices
            </span>
            <a
              href="https://credex.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all"
            >
              <Coins className="h-3.5 w-3.5 text-indigo-200 fill-indigo-200/50" />
              Get Discount AI Credits
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
