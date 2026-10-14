import Link from "next/link";
import { LockKeyhole } from "lucide-react";

export const metadata = { title: "Access restricted" };

export default function AccessDeniedPage() {
  return <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 text-center">
    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-100"><LockKeyhole className="h-6 w-6" /></div>
    <p className="mt-5 text-xs font-bold uppercase tracking-[.16em] text-amber-700">Access restricted</p>
    <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink-900">No admin sections are assigned</h1>
    <p className="mt-2 max-w-md text-sm leading-6 text-ink-500">Ask a Super Admin to assign the store areas you need to manage.</p>
    <Link href="/dashboard" className="mt-6 inline-flex h-10 items-center rounded-xl bg-blue-700 px-4 text-sm font-semibold text-white">Return to dashboard</Link>
  </div>;
}
