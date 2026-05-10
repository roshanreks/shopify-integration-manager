"use client";

import { useShopify } from "@/lib/shopify-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Store,
  KeyRound,
  LogOut,
  Shield,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/clients", label: "Clients", icon: Store },
  { href: "/dashboard/configs/new", label: "New Config", icon: KeyRound },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { shop, isLoading } = useShopify();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !shop) {
      router.push("/install");
    }
  }, [shop, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!shop) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-indigo-600" />
            <span className="font-bold text-lg text-gray-900">Shopify Manager</span>
          </div>
          <p className="text-xs text-gray-500 mt-1 truncate">{shop}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={`${item.href}?shop=${encodeURIComponent(shop)}`}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => {
              window.location.href = "/install";
            }}
          >
            <LogOut className="h-4 w-4" />
            Switch Store
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
