import Link from "next/link";
import { Search, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onClear?: () => void;
}

export function EmptyState({ onClear }: Props) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-cream-300 bg-white p-12 text-center">
      <div className="h-16 w-16 rounded-full bg-cream-100 flex items-center justify-center mx-auto mb-4">
        <Search className="h-7 w-7 text-ink-400" />
      </div>
      <h3 className="font-display text-2xl text-ink-900">No products found</h3>
      <p className="text-sm text-ink-500 mt-2 max-w-md mx-auto">
        Try adjusting your filters or search terms, or browse the full
        collection.
      </p>
      <div className="mt-6 flex items-center justify-center gap-3">
        {onClear && (
          <Button variant="outline" onClick={onClear}>
            Clear filters
          </Button>
        )}
        <Button asChild>
          <Link href="/products">Browse all</Link>
        </Button>
      </div>
    </div>
  );
}