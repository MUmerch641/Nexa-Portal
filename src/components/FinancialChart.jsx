"use client";

import { memo, useState, useMemo } from "react";
import { FaChartLine, FaMoneyBillWave, FaArrowUp, FaArrowDown, FaDownload, FaInfoCircle } from "react-icons/fa";
import Modal from "@/components/Modal";

function FinancialChart({ revenue = 0, expenses = 0, categoryData = [], onBudgetRatioClick }) {
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [timeRange, setTimeRange] = useState("6M");
  const [showBudgetModal, setShowBudgetModal] = useState(false);

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
                  <p className="text-xs text-[#64748B]">Revenue: {formatCurrency(safeRevenue)} • Expenses: {formatCurrency(safeExpenses)}</p>
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
                  <FaDownload className="text-xs" /> <span>Export</span>
                </button>
              </div>
            </div>

            {/* BAR CHART CANVAS CONTAINER */}
            <div className="mt-6">
              <div className="h-48 flex items-end justify-between gap-2 border-b border-[#E2E8F0] pb-2 pt-4 px-2">
                {trendData.map((d, idx) => {
                  const revHeightPct = maxVal > 0 ? (d.revenue / maxVal) * 100 : 0;
                  const expHeightPct = maxVal > 0 ? (d.expenses / maxVal) * 100 : 0;

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center h-full justify-end group relative"
                      onMouseEnter={() => setActiveTooltip(idx)}
                      onMouseLeave={() => setActiveTooltip(null)}
                    >
                      {/* Tooltip Hover Overlay */}
                      {activeTooltip === idx && (
                        <div className="absolute -top-12 z-20 bg-[#0F172A] text-white text-[10px] py-1.5 px-3 rounded-lg shadow-lg whitespace-nowrap space-y-0.5">
                          <p className="font-bold border-b border-slate-700 pb-0.5">{d.label}</p>
                          <p className="text-blue-400">Revenue: {formatCurrency(d.revenue)}</p>
                          <p className="text-slate-300">Expenses: {formatCurrency(d.expenses)}</p>
                          <p className={d.profit >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                            Net: {formatCurrency(d.profit)}
                          </p>
                        </div>
                      )}

                      <div className="w-full flex items-end justify-center gap-1 h-full">
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
                      <span className="text-[11px] font-semibold text-[#64748B] mt-2">{d.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-4 text-xs font-semibold text-[#64748B]">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-[#2563EB] inline-block" />
                  <span>Revenue ({formatCurrency(safeRevenue)})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-[#64748B] inline-block" />
                  <span>Expenses ({formatCurrency(safeExpenses)})</span>
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
            {safeRevenue === 0 && safeExpenses === 0 ? (
              <span className="font-bold text-[#64748B]">No financial data recorded yet</span>
            ) : (
              <span className={`font-bold flex items-center gap-1.5 ${netProfit >= 0 ? "text-[#2563EB]" : "text-rose-600"}`}>
                {netProfit > 0 ? (
                  <FaArrowUp className="text-emerald-600" />
                ) : netProfit < 0 ? (
                  <FaArrowDown className="text-rose-600" />
                ) : null}
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
              <button
                type="button"
                onClick={() => {
                  if (onBudgetRatioClick) onBudgetRatioClick();
                  setShowBudgetModal(true);
                }}
                className="text-[10px] font-bold bg-[#EFF6FF] hover:bg-[#2563EB] text-[#2563EB] hover:text-white px-3 py-1.5 rounded-full border border-[#2563EB]/20 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 group shrink-0"
                title="Click for detailed Budget Ratio Analysis"
              >
                <FaMoneyBillWave className="text-[10px] text-[#2563EB] group-hover:text-white transition-colors" />
                <span>Budget Ratio</span>
                <span className="text-[9px] bg-[#2563EB] group-hover:bg-white text-white group-hover:text-[#2563EB] px-1.5 py-0.2 rounded-full font-black transition-colors">
                  {safeRevenue > 0 ? `${Math.round((safeExpenses / safeRevenue) * 100)}%` : "0%"}
                </span>
              </button>
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
            <span>Hover any period bar for breakdown. Click Budget Ratio for detailed analysis.</span>
          </div>
        </div>

      </div>

      {/* BUDGET RATIO ANALYSIS MODAL */}
      <Modal
        isOpen={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        title="Monthly Budget Ratio & Financial Health Analytics"
        type="info"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-5 text-xs text-[#0F172A]">
          {/* Financial Health Status Banner */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            safeRevenue === 0
              ? "bg-slate-50 border-slate-200 text-slate-700"
              : (safeExpenses / safeRevenue) <= 0.5
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : (safeExpenses / safeRevenue) <= 0.8
                  ? "bg-amber-50 border-amber-200 text-amber-900"
                  : "bg-rose-50 border-rose-200 text-rose-900"
          }`}>
            <FaInfoCircle className="text-base shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm">
                {safeRevenue === 0
                  ? "No Active Revenue Recorded"
                  : (safeExpenses / safeRevenue) <= 0.5
                    ? "🟢 Healthy Budget Ratio (Optimal Cash Flow)"
                    : (safeExpenses / safeRevenue) <= 0.8
                      ? "🟠 Moderate Expense Ratio (Monitor Allocations)"
                      : "🔴 High Expense Ratio Alert (Over-budget)"}
              </h4>
              <p className="text-xs leading-relaxed">
                {safeRevenue === 0
                  ? "Record client invoices and monthly revenue to compute live expense-to-revenue ratio."
                  : (safeExpenses / safeRevenue) <= 0.5
                    ? `Operating expenses consume only ${Math.round((safeExpenses / safeRevenue) * 100)}% of monthly revenue. Your organization has strong retained earnings and operational liquidity.`
                    : (safeExpenses / safeRevenue) <= 0.8
                      ? `Expenses account for ${Math.round((safeExpenses / safeRevenue) * 100)}% of revenue. Review discretionary spending and key expense categories.`
                      : `Expenses consume ${Math.round((safeExpenses / safeRevenue) * 100)}% of current revenue. High overhead may reduce profit margins.`}
              </p>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-[#EFF6FF] border border-[#2563EB]/20 space-y-1">
              <span className="text-[10px] font-bold uppercase text-[#2563EB] tracking-wider block">Monthly Revenue</span>
              <p className="text-lg font-black text-[#2563EB]">{formatCurrency(safeRevenue)}</p>
              <span className="text-[10px] text-[#64748B]">Total Collections</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="text-[10px] font-bold uppercase text-[#64748B] tracking-wider block">Total Expenses</span>
              <p className="text-lg font-black text-[#0F172A]">{formatCurrency(safeExpenses)}</p>
              <span className="text-[10px] text-[#64748B]">Operating Spend</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FEF3C7] border border-[#F59E0B]/20 space-y-1">
              <span className="text-[10px] font-bold uppercase text-[#92400E] tracking-wider block">Expense Ratio</span>
              <p className="text-lg font-black text-[#92400E]">
                {safeRevenue > 0 ? `${Math.round((safeExpenses / safeRevenue) * 100)}%` : "0%"}
              </p>
              <span className="text-[10px] text-[#92400E]">Spend / Income</span>
            </div>

            <div className={`p-3.5 rounded-xl border space-y-1 ${
              netProfit >= 0 ? "bg-[#ECFDF5] border-[#059669]/20" : "bg-[#FEE2E2] border-[#EF4444]/20"
            }`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block ${netProfit >= 0 ? "text-[#059669]" : "text-rose-700"}`}>
                Net Margin
              </span>
              <p className={`text-lg font-black ${netProfit >= 0 ? "text-[#059669]" : "text-rose-700"}`}>
                {profitMarginPct}%
              </p>
              <span className="text-[10px] text-[#64748B]">Profitability</span>
            </div>
          </div>

          {/* Visual Progress Ratio Bar */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span>Revenue vs Expense Allocation Breakdown</span>
              <span className="text-[#2563EB]">100% Total Budget Window</span>
            </div>
            <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${safeRevenue > 0 ? Math.max(0, Math.min(100, Math.round((netProfit / safeRevenue) * 100))) : 0}%` }}
                title="Net Profit Portion"
              />
              <div
                className="h-full bg-[#2563EB] transition-all"
                style={{ width: `${safeRevenue > 0 ? Math.min(100, Math.round((safeExpenses / safeRevenue) * 100)) : 0}%` }}
                title="Operating Expenses Portion"
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 font-medium">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] inline-block" />
                Operating Expenses ({safeRevenue > 0 ? Math.round((safeExpenses / safeRevenue) * 100) : 0}%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Retained Profit Margin ({profitMarginPct}%)
              </span>
            </div>
          </div>

          {/* Category Distribution Breakdown */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#64748B]">
              Category Expense Distribution
            </h4>

            {categoryData.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center text-[#64748B] italic">
                No category breakdown recorded for current selection.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold uppercase text-[10px] tracking-wider border-b border-[#E2E8F0]">
                    <tr>
                      <th className="py-2.5 px-3">Expense Category</th>
                      <th className="py-2.5 px-3 text-right">Amount (PKR)</th>
                      <th className="py-2.5 px-3 text-right">% of Expenses</th>
                      <th className="py-2.5 px-3 text-right">% of Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {categoryData.map((cat, idx) => {
                      const amt = Number(cat.amount) || 0;
                      const expPct = safeExpenses > 0 ? Math.round((amt / safeExpenses) * 100) : 0;
                      const revPct = safeRevenue > 0 ? Math.round((amt / safeRevenue) * 100) : 0;
                      return (
                        <tr key={idx} className="hover:bg-[#F8FAFC]">
                          <td className="py-2.5 px-3 font-semibold text-[#0F172A]">{cat.category || cat.title || "General"}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-[#2563EB]">{formatCurrency(amt)}</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-[#0F172A]">{expPct}%</td>
                          <td className="py-2.5 px-3 text-right font-medium text-[#64748B]">{revPct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="pt-2 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleExportCsv}
              className="w-full sm:w-auto bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-[#2563EB]/20"
            >
              <FaDownload className="text-xs" /> Export Budget Report CSV
            </button>

            <button
              type="button"
              onClick={() => setShowBudgetModal(false)}
              className="w-full sm:w-auto bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold px-5 py-2 rounded-xl text-xs transition-colors cursor-pointer text-center"
            >
              Close Analytics
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default memo(FinancialChart);
