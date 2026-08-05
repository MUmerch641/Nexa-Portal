"use client";

import toast, { Toaster } from "react-hot-toast";

export const showToast = (title, message, type = "success") => {
  const content = (
    <div className="flex flex-col text-left">
      {title && <span className="font-bold text-xs text-slate-900">{title}</span>}
      {message && <span className="text-[11px] text-slate-600 mt-0.5 leading-snug">{message}</span>}
    </div>
  );

  const toastOptions = {
    duration: 4000,
    style: {
      borderRadius: "16px",
      background: "#ffffff",
      color: "#0f172a",
      fontSize: "12px",
      padding: "12px 16px",
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
      border: "1px solid #e2e8f0",
    },
  };

  switch (type) {
    case "success":
      return toast.success(content, {
        ...toastOptions,
        iconTheme: { primary: "#2563eb", secondary: "#ffffff" },
      });
    case "error":
      return toast.error(content, {
        ...toastOptions,
        iconTheme: { primary: "#ef4444", secondary: "#ffffff" },
      });
    case "warning":
      return toast(content, {
        ...toastOptions,
        icon: "⚠️",
      });
    case "info":
    default:
      return toast(content, {
        ...toastOptions,
        iconTheme: { primary: "#2563eb", secondary: "#ffffff" },
      });
  }
};

export default function ToastContainer() {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        className: "font-sans",
      }}
    />
  );
}
