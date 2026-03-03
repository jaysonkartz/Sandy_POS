"use client";

import React from "react";

type OptionPickerProps = {
  label: string;
  options: string[];
  value: string;
  onChange: (next: string) => void;

  // behavior tweaks
  emptyMode?: "hide" | "na";      // default "hide"
  disabledWhenSingle?: boolean;    // default true (shows pill)
  className?: string;
};

const uniq = (arr: string[]) =>
  Array.from(new Set(arr.map((x) => (x ?? "").trim()).filter(Boolean)));

export default function OptionPicker({
  label,
  options,
  value,
  onChange,
  emptyMode = "hide",
  disabledWhenSingle = true,
  className = "",
}: OptionPickerProps) {
  const list = uniq(options);

  // 0 options
  if (list.length === 0) {
    if (emptyMode === "na") {
      return (
        <div className={`text-sm text-gray-500 ${className}`}>
          {label}: <span className="font-medium">N/A</span>
        </div>
      );
    }
    return null;
  }

  // 1 option => fixed display (no dropdown)
  if (list.length === 1 && disabledWhenSingle) {
    const single = list[0];

    // keep internal value consistent
    if (value !== single) {
      // avoid state updates during render; do it in microtask
      queueMicrotask(() => onChange(single));
    }

    return (
      <div className={`text-sm text-gray-600 ${className}`}>
        <span className="mr-2">{label}:</span>
        <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 rounded">
          {single}
        </span>
      </div>
    );
  }

  // 2+ options => dropdown
  const safeValue = list.includes(value) ? value : list[0];

  return (
    <label className={`block text-sm ${className}`}>
      <div className="mb-1 text-gray-600">{label}</div>
      <select
        value={safeValue}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded px-2 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {list.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
