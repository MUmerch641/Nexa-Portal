export default function DashboardLoading() {
  return (
    <div className="w-full py-12 flex flex-col items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm max-w-xs w-full text-center">
        {/* Loading Spinner with Blue Accent */}
        <div className="relative flex items-center justify-center w-12 h-12">
          <div className="w-10 h-10 rounded-full border-3 border-[#2563EB]/20 border-t-[#2563EB] animate-spin"></div>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
            Loading Dashboard Section...
          </p>
          <p className="text-[11px] text-[#64748B]">
            Syncing live database metrics
          </p>
        </div>

        {/* Shimmer skeleton bar */}
        <div className="w-full bg-[#F1F5F9] h-1.5 rounded-full overflow-hidden">
          <div className="bg-[#2563EB] h-full w-1/2 rounded-full animate-[shimmerPass_1.5s_infinite]"></div>
        </div>
      </div>
    </div>
  );
}
