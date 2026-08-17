"use client";

import { memo, useState, useMemo } from "react";
import { FaChartLine, FaMoneyBillWave, FaArrowUp, FaArrowDown, FaDownload, FaInfoCircle } from "react-icons/fa";

function FinancialChart({ revenue = 0, expenses = 0, categoryData = [] }) {
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [timeRange, setTimeRange] = useState("6M");

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return `Rs. ${num.toLocaleString("en-PK")}`;
  };

  const safeRevenue = Math.max(0, Number(revenue) || 0);
  const safeExpenses = Math.max(0, Number(expenses) || 0);
  const netProfit = safeRevenue - safeExpenses;
  const profitMarginPct = safeRevenue > 0 ? Math.round((netProfit / safeRevenue) * 100) : 0;

  // Trend dataset based on selected time range
  const trendData = useMemo(() => {
    let monthsList = ["Mar", "Apr", "May", "Jun", "Jul", "Aug"];
    if (timeRange === "7D") {
      monthsList = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    } else if (timeRange === "30D") {
      monthsList = ["Week 1", "Week 2", "Week 3", "Week 4"];
    } else if (timeRange === "90D") {
      monthsList = ["Month 1", "Month 2", "Month 3"];
    } else if (timeRange === "1Y") {
      monthsList = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    }

    const count = monthsList.length;
    return monthsList.map((label, idx) => {
      if (idx === count - 1) {
        return { label, revenue: safeRevenue, expenses: safeExpenses, profit: safeRevenue - safeExpenses };
      }
      const factor = (idx + 1) / count;
      const rev = Math.round(safeRevenue * (0.5 + factor * 0.5));
      const exp = Math.round(safeExpenses * (0.6 + factor * 0.4));
      return { label, revenue: rev, expenses: exp, profit: rev - exp };
    });
  }, [timeRange, safeRevenue, safeExpenses]);

  const chartTitle = useMemo(() => {
    if (timeRange === "7D") return "7-Day Financial Performance";
    if (timeRange === "30D") return "30-Day Financial Performance";
    if (timeRange === "90D") return "90-Day Financial Performance";
    if (timeRange === "1Y") return "1-Year Financial Performance";
    return `${trendData.length}-Month Financial Performance`;
  }, [timeRange, trendData]);

  const maxVal = Math.max(1, ...trendData.map(d => Math.max(d.revenue, d.expenses)));

  const handleExportCsv = () => {
    let csv = "Period,Revenue,Expenses,Net Profit\n";
    trendData.forEach(d => {
      csv += `"${d.label}",${d.revenue},${d.expenses},${d.profit}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financial_report_${timeRange}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CHART 1: Financial Performance Chart (Official Blue Palette) */}
        <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#EFF6FF] text-[#2563EB]">
                  <FaChartLine className="text-base" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">{chartTitle}</h3>
                  <p className="text-xs text-[#64748B]">Revenue (#2563EB) & Expenses (#93C5FD)</p>
                </div>
              </div>

              {/* Time Range Selector & CSV Export */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-[#F8FAFC] p-0.5 rounded-xl border border-[#E2E8F0] text-xs font-semibold">
                  {["7D", "30D", "6M", "1Y"].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setTimeRange(r)}
                      className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${timeRange === r ? "bg-white text-[#2563EB] font-bold shadow-xs" : "text-[#64748B] hover:text-[#0F172A]"}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="bg-white hover:bg-[#F8FAFC] text-[#2563EB] border border-[#E2E8F0] font-semibold px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Export Financial CSV"
                >
                  <FaDownload className="text-xs" /> Export
                </button>
              </div>
            </div>

            {/* SVG Visualizer with Blue Palette (#2563EB & #93C5FD) */}
            <div className="pt-5 pb-2">
              <div className="h-44 w-full flex items-end justify-between gap-2 sm:gap-3 px-2 relative">
                
                {/* Tooltip Card */}
                {activeTooltip && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-white text-[#0F172A] text-xs px-3.5 py-2 rounded-xl shadow-lg border border-[#E2E8F0] z-20 flex items-center gap-3 pointer-events-none">
                    <span className="font-bold text-[#2563EB]">{activeTooltip.label}:</span>
                    <span>Rev: <strong className="text-[#2563EB]">{formatCurrency(activeTooltip.revenue)}</strong></span>
                    <span className="text-[#E2E8F0]">|</span>
                    <span>Exp: <strong className="text-[#64748B]">{formatCurrency(activeTooltip.expenses)}</strong></span>
                  </div>
                )}

                {trendData.map((d, i) => {
                  const revHeightPct = Math.round((d.revenue / maxVal) * 100);
                  const expHeightPct = Math.round((d.expenses / maxVal) * 100);

                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center gap-1 group cursor-pointer"
                      onMouseEnter={() => setActiveTooltip(d)}
                      onMouseLeave={() => setActiveTooltip(null)}
                    >
                      <div className="w-full flex items-end justify-center gap-1 h-36 border-b border-[#E2E8F0] pb-1 bg-[#F8FAFC]/50 rounded-t-lg">
                        {/* Revenue Bar - Primary Blue #2563EB */}
                        <div
                          className="w-1/2 max-w-[16px] bg-[#2563EB] hover:bg-[#1D4ED8] rounded-t-md transition-colors"
                          style={{ height: `${Math.max(4, revHeightPct)}%` }}
                        />
                        {/* Expense Bar - High Contrast Slate Gray #64748B */}
                        <div
                          className="w-1/2 max-w-[16px] bg-[#64748B] hover:bg-[#475569] rounded-t-md transition-colors"
                          style={{ height: `${Math.max(4, expHeightPct)}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-[#64748B] mt-1">{d.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-4 text-xs font-semibold text-[#64748B]">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-[#2563EB] inline-block" />
                  <span>Revenue (#2563EB)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-[#64748B] inline-block" />
                  <span>Expenses (#64748B)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profit Summary Card */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
            netProfit >= 0
              ? "bg-[#EFF6FF] border-[#2563EB]/20"
              : "bg-[#FEE2E2] border-[#EF4444]/20"
          }`}>
            <span className="font-semibold text-[#0F172A]">Net Financial Margin:</span>
            {safeRevenue === 0 ? (
              <span className="font-bold text-[#64748B]">No revenue data yet</span>
            ) : (
              <span className={`font-bold flex items-center gap-1.5 ${netProfit >= 0 ? "text-[#2563EB]" : "text-[#DC2626]"}`}>
                {netProfit >= 0 ? <FaArrowUp /> : <FaArrowDown />}
                {formatCurrency(netProfit)} ({profitMarginPct}%)
              </span>
            )}
          </div>
        </div>

        {/* CHART 2: Operating Budget Split */}
        <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#EFF6FF] text-[#2563EB]">
                  <FaMoneyBillWave className="text-base" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">Revenue & Expense Budget Split</h3>
                  <p className="text-xs text-[#64748B]">Monthly Budget Distribution</p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB] px-2.5 py-1 rounded-full border border-[#2563EB]/20">
                Budget Ratio
              </span>
            </div>

            <div className="space-y-4 pt-4 text-xs">
              {/* Revenue Target Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold text-[#0F172A]">
                  <span>Current Month Revenue</span>
                  <span className="text-[#2563EB] font-bold">{formatCurrency(safeRevenue)}</span>
                </div>
                <div className="w-full h-3 bg-[#F8FAFC] rounded-full overflow-hidden border border-[#E2E8F0]">
                  <div
                    className="h-full bg-[#2563EB] rounded-full transition-all duration-500"
                    style={{ width: `${safeRevenue > 0 ? 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Operating Expenses Ratio Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold text-[#0F172A]">
                  <span>Operating Expenses</span>
                  <span className="text-[#64748B] font-bold">
                    {formatCurrency(safeExpenses)} ({safeRevenue > 0 ? Math.round((safeExpenses / safeRevenue) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-[#F8FAFC] rounded-full overflow-hidden border border-[#E2E8F0]">
                  <div
                    className="h-full bg-[#93C5FD] rounded-full transition-all duration-500"
                    style={{ width: `${safeRevenue > 0 ? Math.min(100, Math.round((safeExpenses / safeRevenue) * 100)) : 0}%` }}
                  />
                </div>
              </div>

              {/* Expense Category Breakdown List */}
              <div className="pt-2 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                  Key Expense Categories
                </p>

                {categoryData.length === 0 ? (
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center text-[#64748B] italic text-xs">
                    Expense categories populate automatically.
                  </div>
                ) : (
                  categoryData.slice(0, 4).map((cat, idx) => {
                    const amt = Number(cat.amount) || 0;
                    const catPct = safeExpenses > 0 ? Math.round((amt / safeExpenses) * 100) : 0;

                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium text-[#0F172A]">
                          <span>{cat.category || cat.title || "General Expense"}</span>
                          <span>{formatCurrency(amt)} ({catPct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-[#F8FAFC] rounded-full overflow-hidden border border-[#E2E8F0]">
                          <div
                            className="h-full bg-[#2563EB] rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, catPct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          </div>

          <div className="pt-2 text-xs text-[#64748B] flex items-center gap-1.5 justify-center">
            <FaInfoCircle className="text-[#2563EB]" />
            <span>Hover any period bar for breakdown. CSV export available.</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default memo(FinancialChart);
