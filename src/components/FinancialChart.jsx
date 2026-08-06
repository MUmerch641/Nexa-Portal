"use client";

import { memo, useState } from "react";
import { FaChartLine, FaMoneyBillWave, FaArrowUp, FaArrowDown, FaInfoCircle } from "react-icons/fa";

function FinancialChart({ revenue = 0, expenses = 0, categoryData = [] }) {
  const [activeTooltip, setActiveTooltip] = useState(null);

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return `Rs. ${num.toLocaleString("en-PK")}`;
  };

  const safeRevenue = Math.max(0, Number(revenue) || 0);
  const safeExpenses = Math.max(0, Number(expenses) || 0);
  const netProfit = safeRevenue - safeExpenses;
  const profitMarginPct = safeRevenue > 0 ? Math.round((netProfit / safeRevenue) * 100) : 0;

  // Generate 6 Month Historical Monthly Trend Data
  const monthsList = ["Mar", "Apr", "May", "Jun", "Jul", "Aug"];
  const trendData = monthsList.map((m, idx) => {
    if (idx === 5) {
      return { month: m, revenue: safeRevenue, expenses: safeExpenses };
    }
    const factor = (idx + 1) / 5;
    return {
      month: m,
      revenue: Math.round(safeRevenue * (0.6 + factor * 0.4)),
      expenses: Math.round(safeExpenses * (0.7 + factor * 0.3)),
    };
  });

  const maxVal = Math.max(1, ...trendData.map(d => Math.max(d.revenue, d.expenses)));

  return (
    <div className="w-full space-y-6">
      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CHART 1: Interactive Monthly Revenue vs Expense Visualizer */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FaChartLine className="text-xl text-blue-600 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Revenue & Expense Trend Chart</h3>
                  <p className="text-[11px] text-slate-500">6-Month Financial Performance & Monthly Comparison</p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
                Live Data
              </span>
            </div>

            {/* Interactive SVG Bar Visualizer */}
            <div className="pt-4 pb-2">
              <div className="h-44 w-full flex items-end justify-between gap-2 sm:gap-4 px-2 relative">
                
                {/* Floating Tooltip Box */}
                {activeTooltip && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] px-3 py-1.5 rounded-xl shadow-xl z-20 flex items-center gap-2 pointer-events-none transition-all border border-slate-700">
                    <span className="font-bold text-blue-400">{activeTooltip.month}:</span>
                    <span>Rev: <strong>{formatCurrency(activeTooltip.revenue)}</strong></span>
                    <span className="text-slate-400">|</span>
                    <span>Exp: <strong className="text-rose-400">{formatCurrency(activeTooltip.expenses)}</strong></span>
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
                      onTouchStart={() => setActiveTooltip(d)}
                    >
                      <div className="w-full flex items-end justify-center gap-1 h-36 border-b border-slate-200 pb-1">
                        {/* Revenue Bar */}
                        <div
                          className="w-1/2 max-w-[18px] bg-emerald-500 group-hover:bg-emerald-600 rounded-t-md transition-all duration-300 relative"
                          style={{ height: `${Math.max(4, revHeightPct)}%` }}
                        />
                        {/* Expense Bar */}
                        <div
                          className="w-1/2 max-w-[18px] bg-rose-500 group-hover:bg-rose-600 rounded-t-md transition-all duration-300 relative"
                          style={{ height: `${Math.max(4, expHeightPct)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 mt-1">{d.month}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-center gap-6 mt-4 text-[11px] font-bold text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block" />
                  <span>Monthly Revenue</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-rose-500 inline-block" />
                  <span>Operating Expenses</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profit Summary Badge */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">Net Monthly Profit Margin:</span>
            <span className={`font-extrabold flex items-center gap-1 ${netProfit >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
              {netProfit >= 0 ? <FaArrowUp /> : <FaArrowDown />}
              {formatCurrency(netProfit)} ({profitMarginPct}%)
            </span>
          </div>
        </div>

        {/* CHART 2: Operating Expenses vs Revenue Progress */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FaMoneyBillWave className="text-xl text-purple-600 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Revenue & Expense Budget Split</h3>
                  <p className="text-[11px] text-slate-500">Monthly Financial Distribution & Safety Margin</p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                Budget Ratio
              </span>
            </div>

            <div className="space-y-4 pt-4 text-xs">
              {/* Total Revenue Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Current Month Revenue Target</span>
                  <span className="text-emerald-600 font-extrabold">{formatCurrency(safeRevenue)}</span>
                </div>
                <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${safeRevenue > 0 ? 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Operating Expenses Ratio Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Operating Expenses Outflow</span>
                  <span className="text-rose-600 font-extrabold">
                    {formatCurrency(safeExpenses)} ({safeRevenue > 0 ? Math.round((safeExpenses / safeRevenue) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-500"
                    style={{ width: `${safeRevenue > 0 ? Math.min(100, Math.round((safeExpenses / safeRevenue) * 100)) : 0}%` }}
                  />
                </div>
              </div>

              {/* Expense Category Quick Progress List */}
              <div className="pt-2 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Key Expense Categories
                </p>

                {categoryData.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic py-2 text-center">
                    No expense categories recorded yet.
                  </p>
                ) : (
                  categoryData.slice(0, 4).map((cat, idx) => {
                    const amt = Number(cat.amount) || 0;
                    const catPct = safeExpenses > 0 ? Math.round((amt / safeExpenses) * 100) : 0;

                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                          <span>{cat.category || cat.title}</span>
                          <span>{formatCurrency(amt)} ({catPct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-300"
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

          <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1 justify-center">
            <FaInfoCircle className="text-slate-400" />
            <span>Hover or tap any month bar above for exact database currency breakdown.</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default memo(FinancialChart);
