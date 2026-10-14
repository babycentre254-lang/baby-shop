import { notFound, redirect } from "next/navigation";
import { ordersServerApi } from "@/lib/api/endpoints.server";
import { OrderDetail } from "./order-detail";
import type { Order } from "@baby-shop/shared";

export const metadata = { title: "Order Details" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;

  let order: Order | null = null;
  try {
    const res = await ordersServerApi.getMine(id);
    order = res.order;
  } catch (err: any) {
    if (err?.status === 403 || err?.status === 404) notFound();
    notFound();
  }

  if (!order) notFound();

  return <OrderDetail order={order} />;
}