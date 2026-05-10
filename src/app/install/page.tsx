"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, ArrowRight } from "lucide-react";

export default function InstallPage() {
  const [shop, setShop] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let cleanShop = shop.trim().toLowerCase();
    cleanShop = cleanShop.replace(/^https?:\/\//, "").replace(/\/+$/, "");
    if (!cleanShop.includes(".")) {
      cleanShop += ".myshopify.com";
    }
    window.location.href = `/api/auth?shop=${encodeURIComponent(cleanShop)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6 text-indigo-600" />
            <CardTitle className="text-2xl font-bold">Shopify Integration Manager</CardTitle>
          </div>
          <CardDescription>
            Install this app on your Shopify store to manage API configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shop">Store URL</Label>
              <Input
                id="shop"
                placeholder="mystore.myshopify.com"
                value={shop}
                onChange={(e) => setShop(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full gap-2">
              Install App
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
          <p className="text-xs text-gray-500 mt-4 text-center">
            This app must be installed from the Shopify Partners Dev Dashboard first.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
