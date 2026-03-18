"use client";

import { useState, useRef } from "react";

interface SearchBoxProps {
  value: string;
  onChange: (v: string) => void;
  onClear?: () => void;
}

export default function SearchBox({ value, onChange, onClear }: SearchBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, ""); // numbers only
    onChange(v);
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Glow ring */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(200,169,110,0.07) 0%, transparent 70%)",
          transform: "scale(1.15)",
        }}
      />

      <div className="relative flex items-center">
        {/* Search icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="absolute left-4 w-5 h-5"
          style={{ color: "rgba(200,169,110,0.4)", pointerEvents: "none" }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>

        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={12}
          value={value}
          onChange={handleChange}
          placeholder="Enter UID..."
          className="search-input w-full rounded-xl pl-12 pr-12 py-4"
        />

        {/* Clear button */}
        {value && (
          <button
            onClick={() => {
              onChange("");
              onClear?.();
              inputRef.current?.focus();
            }}
            className="absolute right-4"
            style={{ color: "rgba(200,169,110,0.4)" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
