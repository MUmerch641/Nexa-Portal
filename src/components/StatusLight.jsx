"use client";

import React from "react";

export default function StatusLight({ color }) {
  const bgColor = {
    green: "bg-emerald-500",
    orange: "bg-amber-500",
    red: "bg-rose-500",
    grey: "bg-gray-400",
  }[color] || "bg-gray-400";

  return (
    <span
      className={`inline-block w-4 h-4 rounded-full ${bgColor} shadow-md animate-pulse`}
      aria-label={`status ${color}`}
    />
  );
}
