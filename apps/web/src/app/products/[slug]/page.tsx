import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { catalogServerApi } from "@/lib/api/endpoints.server";
import { ProductDetail } from "./product-detail";
import type { Product } from "@baby-shop/shared";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await catalogServerApi.getProduct(slug);
    const p = res.product;
    return {
      title: p.name,
      description:
        (p as any).shortDesc ||
        p.description?.replace(/<[^>]+>/g, "").slice(0, 160) ||
        `Buy ${p.name} at BabyCentre`,
      openGraph: {
        title: p.name,
        images: (p as any).images?.[0]?.url ? [(p as any).images[0].url] : [],
      },
    };
  } catch {
    return { title: "Product not found" };
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;

  let product: Product | null = null;
  try {
    const res = await catalogServerApi.getProduct(slug);
    product = res.product;
  } catch (err) {
    console.error("[product page] failed:", err);
    notFound();
  }

  if (!product) notFound();

  // Related products — same category, exclude self
  const categoryId = (product as any).categoryId?._id ?? (product as any).categoryId;
  const relatedRes = categoryId
    ? await catalogServerApi
        .listProducts({ categoryId, pageSize: 5 })
        .catch(() => ({ items: [] }))
    : { items: [] };

  const related = ((relatedRes as any).items ?? [])
    .filter((p: any) => p._id !== product!._id)
    .slice(0, 4);

  return <ProductDetail product={product} related={related} />;
}