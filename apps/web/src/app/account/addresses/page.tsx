import { cookies } from "next/headers";
import { apiServer } from "@/lib/api/client.server";
import { AddressesManager } from "./addresses-manager";
import type { Address } from "@baby-shop/shared";

export const metadata = { title: "My Addresses" };

export default async function AddressesPage() {
  let addresses: Address[] = [];
  let unavailable = false;
  try {
    addresses = (await apiServer<{ items: Address[] }>("/users/me/addresses", { cookies: (await cookies()).toString() })).items ?? [];
  } catch { unavailable = true; }
  return <AddressesManager initialAddresses={addresses} unavailable={unavailable}/>;
}
