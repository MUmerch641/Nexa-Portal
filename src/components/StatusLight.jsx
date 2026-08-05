"use client";

import React from "react";

export default function StatusLight({ color }) {
  const bgColor = {
    white: "bg-white border-2 border-slate-300 shadow-sm",
    green: "bg-emerald-500 shadow-md shadow-emerald-200",
    orange: "bg-amber-500 shadow-md shadow-amber-200",
    red: "bg-rose-500 shadow-md shadow-rose-200",
    grey: "bg-gray-400 shadow-sm",
  }[color] || "bg-gray-400 shadow-sm";

  return (
    <span
      className={`inline-block w-4 h-4 rounded-full ${bgColor} shadow-md animate-pulse`}
      aria-label={`status ${color}`}
    />
  );
}
