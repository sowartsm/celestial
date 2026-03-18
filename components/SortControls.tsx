"use client";

import type { SortConfig, SortField, SortOrder } from "@/lib/types";

interface SortControlsProps {
  sort: SortConfig;
  onChange: (s: SortConfig) => void;
}

const FIELDS: { value: SortField; label: string }[] = [
  { value: "date", label: "Date" },
  { value: "name", label: "Name" },
  { value: "uid", label: "UID" },
];

export default function SortControls({ sort, onChange }: SortControlsProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span
        className="text-xs uppercase tracking-widest"
        style={{ color: "rgba(200,169,110,0.4)", fontFamily: "'Cinzel', serif" }}
      >
        Sort
      </span>
      {FIELDS.map((f) => (
        <button
          key={f.value}
          onClick={() =>
            onChange({
              field: f.value,
              order:
                sort.field === f.value
                  ? sort.order === "asc"
                    ? "desc"
                    : "asc"
                  : "asc",
            })
          }
          className={`cat-pill text-xs flex items-center gap-1 ${
            sort.field === f.value ? "cat-pill-active" : "cat-pill-inactive"
          }`}
        >
          {f.label}
          {sort.field === f.value && (
            <span>{sort.order === "asc" ? "↑" : "↓"}</span>
          )}
        </button>
      ))}
    </div>
  );
}
