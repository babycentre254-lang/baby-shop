import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata = {
  title: "Create account",
};

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">A little account, a lot of convenience</p>
        <h1 className="font-display text-3xl text-ink-900">Create account</h1>
        <p className="text-sm text-ink-500">
          Save your details and keep your family’s essentials close
        </p>
      </div>

      <RegisterForm />

      <div className="text-center text-sm text-ink-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-blue-500 hover:text-blue-600 hover:underline"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
