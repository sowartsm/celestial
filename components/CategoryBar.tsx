"use client";

import type { CategoriesData } from "@/lib/types";

interface CategoryBarProps {
  categories: CategoriesData;
  active: string;
  onChange: (id: string) => void;
  playerCounts?: Record<string, number>;
}

export default function CategoryBar({
  categories,
  active,
  onChange,
  playerCounts = {},
}: CategoryBarProps) {
  const allCategories = [
    { id: "dated", label: "All" },
    { id: "undated", label: "Undated" },
    { id: "starred", label: "★ Starred" },
    ...categories.custom.map((c) => ({ id: c.id, label: c.label })),
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap justify-center">
      {allCategories.map((cat) => {
        const count = playerCounts[cat.id];
        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={`cat-pill ${
              active === cat.id ? "cat-pill-active" : "cat-pill-inactive"
            }`}
          >
            {cat.label}
            {count !== undefined && (
              <span
                className="ml-1.5 opacity-70"
                style={{ fontSize: "0.65rem" }}
              >
                ({count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}