import { cn } from "@/lib/utils";

interface Props {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  autoComplete?: string;
  errors?: string[];
  className?: string;
  hint?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
}

export function FormField({
  label,
  name,
  type = "text",
  placeholder,
  defaultValue,
  required,
  autoComplete,
  errors,
  className,
  hint,
  inputMode,
  maxLength,
}: Props) {
  const hasError = !!errors?.length;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-ink-700"
      >
        {label}
        {required && <span className="text-pink-500 ml-0.5">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${name}-error` : undefined}
        className={cn(
          "w-full h-12 rounded-xl border border-ink-200 bg-white px-3.5 text-sm text-ink-900 shadow-sm shadow-ink-900/[0.02]",
          "placeholder:text-ink-400 transition-colors",
          "focus:outline-none focus:ring-4",
          hasError
            ? "border-pink-400 focus:border-pink-500 focus:ring-pink-100"
            : "border-ink-200 focus:border-blue-500 focus:ring-blue-100"
        )}
      />
      {hint && !hasError && (
        <p className="text-xs text-ink-500">{hint}</p>
      )}
      {hasError && (
        <ul
          id={`${name}-error`}
          className="text-xs text-pink-600 space-y-0.5"
        >
          {errors!.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
