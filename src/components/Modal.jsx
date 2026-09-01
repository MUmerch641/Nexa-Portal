"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes, FaTimesCircle } from "react-icons/fa";

export default function Modal({
  isOpen,
  title,
  message,
  type = "info",
  onClose,
  maxWidth = "max-w-lg",
  children
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const icons = {
    success: <FaCheckCircle className="text-xl text-emerald-600 shrink-0" />,
    error: <FaTimesCircle className="text-xl text-rose-600 shrink-0" />,
    warning: <FaExclamationTriangle className="text-xl text-amber-600 shrink-0" />,
    info: <FaInfoCircle className="text-xl text-[#2563EB] shrink-0" />,
  };

  const borders = {
    success: "border-emerald-200",
    error: "border-rose-200",
    warning: "border-amber-200",
    info: "border-slate-200",
  };

  const buttonColors = {
    success: "bg-emerald-600 hover:bg-emerald-700 text-white",
    error: "bg-rose-600 hover:bg-rose-700 text-white",
    warning: "bg-amber-600 hover:bg-amber-700 text-white",
    info: "bg-[#2563EB] hover:bg-blue-700 text-white",
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={`w-full ${maxWidth} max-h-[90vh] flex flex-col rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border ${borders[type] || "border-slate-200"} animate-in fade-in zoom-in-95 duration-150 my-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3.5 shrink-0">
          <div className="flex items-center gap-2.5">
            {icons[type] || icons.info}
            <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
              {title || "Notification"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        {/* Body Content */}
        <div className="overflow-y-auto pt-3.5 flex-1 pr-0.5">
          {children ? (
            children
          ) : (
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {message}
              </p>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className={`rounded-xl px-5 py-2.5 text-xs font-semibold transition-colors shadow-xs cursor-pointer ${
                    buttonColors[type] || "bg-[#2563EB] text-white"
                  }`}
                >
                  OK, Understood
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
