import type { Metadata } from "next";
import { Providers } from "./providers";
import { Header } from "@/components/shop/header";
import { Footer } from "@/components/shop/footer";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "BabyCentre Baby Shop — Little Needs, Big Smiles",
    template: "%s | BabyCentre",
  },
  description:
    "Organic cotton essentials, safe toys, and thoughtful gear for babies and toddlers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-cream-100">
        <Script id="brevo-conversations" strategy="afterInteractive">
          {`(function(d, w, c) {
            w.BrevoConversationsID = '6acf5eeb034f68bce20cdc5e';
            w[c] = w[c] || function() {
              (w[c].q = w[c].q || []).push(arguments);
            };
            var s = d.createElement('script');
            s.async = true;
            s.src = 'https://conversations-widget.brevo.com/brevo-conversations.js';
            if (d.head) d.head.appendChild(s);
          })(document, window, 'BrevoConversations');`}
        </Script>
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
