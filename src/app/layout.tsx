import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ShopifyProvider } from "@/lib/shopify-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Shopify Integration Manager",
  description: "Manage Shopify API connections for multiple client stores",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ShopifyProvider>
          {children}
          <Toaster position="top-right" />
        </ShopifyProvider>
      </body>
    </html>
  );
}
