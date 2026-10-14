import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = { title: "My Wishlist" };

export default function WishlistPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-ink-900">Wishlist</h1>
      <div className="rounded-3xl border-2 border-cream-300 bg-white p-10 text-center space-y-4">
        <div className="h-16 w-16 rounded-full bg-pink-50 flex items-center justify-center mx-auto">
          <Heart className="h-8 w-8 text-pink-500" />
        </div>
        <h2 className="font-display text-2xl text-ink-900">
          Your wishlist is empty
        </h2>
        <p className="text-ink-500 max-w-sm mx-auto">
          Save your favourite items to buy them later.
        </p>
        <Button asChild>
          <Link href="/products">Browse products</Link>
        </Button>
      </div>
    </div>
  );
}
