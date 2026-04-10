"use client";

import { Search } from "lucide-react";

interface SearchInputProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function SearchInput({
  placeholder,
  value,
  onChange,
  className = "",
}: SearchInputProps) {
  return (
    <div
      className={`flex items-center gap-2 border border-b2 rounded-lg px-3 py-[7px] bg-white min-w-[200px] ${className}`}
    >
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-none outline-none font-sans text-[13px] text-gray-900 bg-transparent w-full placeholder:text-light"
      />
      <Search className="w-[13px] h-[13px] text-light flex-shrink-0" />
    </div>
  );
}
