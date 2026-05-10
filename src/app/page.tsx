"use client";

import { useEffect } from "react";
import { useShopify } from "@/lib/shopify-context";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { shop, isLoading } = useShopify();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (shop) {
      router.push(`/dashboard?shop=${encodeURIComponent(shop)}`);
    } else {
      // Not in Shopify context, show install instructions
      router.push("/install");
    }
  }, [shop, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
    </div>
  );
}
