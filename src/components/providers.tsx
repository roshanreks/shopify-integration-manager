"use client";

import { AppProvider } from "@shopify/app-bridge-react";
import { SessionProvider } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ShopifyAppBridgeProvider>
        {children}
      </ShopifyAppBridgeProvider>
    </SessionProvider>
  );
}

function ShopifyAppBridgeProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const host = searchParams.get("host");
  const shop = searchParams.get("shop");

  // When embedded in Shopify admin, host is provided
  const config = useMemo(() => {
    if (host) {
      return {
        apiKey: process.env.NEXT_PUBLIC_SHOPIFY_CLIENT_ID || "",
        host,
        forceRedirect: true,
      };
    }
    return null;
  }, [host]);

  // If not embedded (standalone mode), just render children
  if (!config) {
    return <>{children}</>;
  }

  return (
    <AppProvider config={config}>
      {children}
    </AppProvider>
  );
}
