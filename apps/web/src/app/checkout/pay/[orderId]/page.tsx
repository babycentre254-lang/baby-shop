import { PaymentClient } from "./payment-client";

export const metadata = {
  title: "Complete Payment",
};

interface Props {
  params: Promise<{ orderId: string }>;
}

export default async function PaymentPage({ params }: Props) {
  const { orderId: sessionId } = await params;
  return <PaymentClient sessionId={sessionId} />;
}
