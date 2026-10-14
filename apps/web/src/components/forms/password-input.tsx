"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  name: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  errors?: string[];
  hint?: string;
}

export function PasswordInput({
  label,
  name,
  placeholder,
  autoComplete,
  required,
  errors,
  hint,
}: Props) {
  const [show, setShow] = useState(false);
  const hasError = !!errors?.length;

  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-medium text-ink-700">
        {label}
        {required && <span className="text-pink-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${name}-error` : undefined}
          className={cn(
          "w-full h-12 rounded-xl border bg-white pl-3.5 pr-11 text-sm text-ink-900 shadow-sm shadow-ink-900/[0.02]",
            "placeholder:text-ink-400 transition-colors",
            "focus:outline-none focus:ring-4",
            hasError
              ? "border-pink-400 focus:border-pink-500 focus:ring-pink-100"
              : "border-ink-200 focus:border-blue-500 focus:ring-blue-100"
          )}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg flex items-center justify-center text-ink-500 hover:text-ink-800 hover:bg-cream-100 transition-colors"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {hint && !hasError && <p className="text-xs text-ink-500">{hint}</p>}
      {hasError && (
        <ul id={`${name}-error`} className="text-xs text-pink-600 space-y-0.5">
          {errors!.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
