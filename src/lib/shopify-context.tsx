"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ShopifyContextType {
  shop: string | null;
  host: string | null;
  isEmbedded: boolean;
  isLoading: boolean;
}

const ShopifyContext = createContext<ShopifyContextType>({
  shop: null,
  host: null,
  isEmbedded: false,
  isLoading: true,
});

export function useShopify() {
  return useContext(ShopifyContext);
}

export function ShopifyProvider({ children }: { children: ReactNode }) {
  const [shop, setShop] = useState<string | null>(null);
  const [host, setHost] = useState<string | null>(null);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shopParam = params.get("shop");
    const hostParam = params.get("host");
    const embeddedParam = params.get("embedded");

    if (shopParam) {
      setShop(shopParam);
    }
    if (hostParam) {
      setHost(hostParam);
    }
    if (embeddedParam === "1" || window.self !== window.top) {
      setIsEmbedded(true);
    }

    setIsLoading(false);
  }, []);

  return (
    <ShopifyContext.Provider value={{ shop, host, isEmbedded, isLoading }}>
      {children}
    </ShopifyContext.Provider>
  );
}
