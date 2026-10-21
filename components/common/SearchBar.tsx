"use client";

import React from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search conversations, people, projects...",
  className = "",
}: SearchBarProps) {
  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <Search
        className="absolute left-3.5 h-4 w-4 text-[#6C716D] pointer-events-none"
        strokeWidth={1.75}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl bg-[#F0F1EE] pl-9.5 pr-8 text-sm text-[#181A19] placeholder-[#9B9E9C] transition-colors focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1F5C4A] border border-transparent focus:border-[#1F5C4A]"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#E3E5E1] text-[#6C716D] hover:text-[#181A19]"
          aria-label="Clear search"
        >
          <X className="h-3 w-3" strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
