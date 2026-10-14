import { CheckoutClient } from "./checkout-client";

export const metadata = {
  title: "Checkout",
  description: "Complete your order securely",
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}