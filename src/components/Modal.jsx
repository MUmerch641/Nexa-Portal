"use client";

import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes, FaTimesCircle } from "react-icons/fa";

export default function Modal({ isOpen, title, message, type = "info", onClose }) {
  if (!isOpen) return null;

  const icons = {
    success: <FaCheckCircle className="text-2xl text-emerald-600" />,
    error: <FaTimesCircle className="text-2xl text-rose-600" />,
    warning: <FaExclamationTriangle className="text-2xl text-amber-600" />,
    info: <FaInfoCircle className="text-2xl text-blue-600" />,
  };

  const borders = {
    success: "border-emerald-200",
    error: "border-rose-200",
    warning: "border-amber-200",
    info: "border-blue-200",
  };

  const buttonColors = {
    success: "bg-emerald-600 hover:bg-emerald-700 text-white",
    error: "bg-rose-600 hover:bg-rose-700 text-white",
    warning: "bg-amber-600 hover:bg-amber-700 text-white",
    info: "bg-blue-600 hover:bg-blue-700 text-white",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className={`w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border ${borders[type] || "border-slate-200"} space-y-4`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {icons[type] || icons.info}
            <h3 className="text-base font-bold text-slate-900">{title || "Notification"}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <FaTimes />
          </button>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{message}</p>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${buttonColors[type] || "bg-blue-600 text-white"}`}
          >
            OK, Understood
          </button>
        </div>
      </div>
    </div>
  );
}
