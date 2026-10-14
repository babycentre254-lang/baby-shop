import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Admin · BabyCentre",
    template: "%s | BabyCentre Admin",
  },
  description: "BabyCentre admin dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}