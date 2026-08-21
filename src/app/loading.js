export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F8FAFC]/80 backdrop-blur-xs">
      <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-3xl border border-[#E2E8F0] shadow-xl">
        {/* Animated Double Pulse Ring */}
        <div className="relative flex items-center justify-center w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-[#2563EB]/20 animate-ping"></div>
          <div className="w-12 h-12 rounded-full border-3 border-[#2563EB] border-t-transparent animate-spin"></div>
          <div className="absolute w-4 h-4 bg-[#2563EB] rounded-full shadow-[0_0_10px_rgba(37,99,235,0.6)]"></div>
        </div>

        {/* Loading Text & Status */}
        <div className="text-center space-y-1">
          <p className="text-xs font-bold text-[#0F172A] tracking-wide uppercase">
            Loading NEXA Portal...
          </p>
          <p className="text-[10px] text-[#64748B] font-medium">
            Fetching secure data & assets
          </p>
        </div>
      </div>
    </div>
  );
}
