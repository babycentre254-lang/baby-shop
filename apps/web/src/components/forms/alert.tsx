import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  variant?: "error" | "success" | "info";
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Alert({
  variant = "error",
  title,
  children,
  className,
}: Props) {
  const styles = {
    error: "bg-pink-50 border-pink-200 text-pink-800",
    success: "bg-blue-50 border-blue-200 text-blue-800",
    info: "bg-cream-100 border-cream-300 text-ink-700",
  }[variant];

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-xl border-2 px-4 py-3 text-sm",
        styles,
        className
      )}
    >
      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
      <div className="min-w-0">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}