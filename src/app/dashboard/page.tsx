"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Store,
  KeyRound,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  ExternalLink,
} from "lucide-react";

interface ApiConfig {
  id: string;
  name: string;
  status: string;
  apiType: string;
  scopes: string[];
  tokens: {
    id: string;
    expiresAt: string | null;
    needsRefresh: boolean;
    installedAt: string;
  }[];
}

interface StoreData {
  storeUrl: string;
  storeName: string | null;
  configs: ApiConfig[];
}

export default function DashboardPage() {
  const { status } = useSession();
  const searchParams = useSearchParams();
  const shop = searchParams.get("shop");
  const host = searchParams.get("host");

  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Extract shop from URL params (embedded mode) or detect from API
  const shopDomain = shop
    ? shop.replace(/^https?:\/\//, "").replace(/\/+$/, "")
    : null;

  useEffect(() => {
    if (status === "unauthenticated") {
      setLoading(false);
      return;
    }

    fetch("/api/store")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setStoreData(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load store data");
        setLoading(false);
      });
  }, [status]);

  const getTokenStatus = (tokens: ApiConfig["tokens"]) => {
    if (tokens.length === 0)
      return { label: "No Token", color: "gray", icon: AlertTriangle };

    const now = new Date();
    const activeToken = tokens.find((t) => t.isActive);
    if (!activeToken) return { label: "Inactive", color: "gray", icon: AlertTriangle };

    if (activeToken.expiresAt && new Date(activeToken.expiresAt) < now) {
      return { label: "Expired", color: "red", icon: AlertTriangle };
    }
    if (
      activeToken.expiresAt &&
      new Date(activeToken.expiresAt).getTime() - now.getTime() <
        24 * 60 * 60 * 1000
    ) {
      return { label: "Expiring Soon", color: "yellow", icon: Clock };
    }
    return { label: "Active", color: "green", icon: CheckCircle };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        {!shopDomain && (
          <p className="mt-4 text-gray-500 text-sm">
            This app should be accessed from within your Shopify admin.
          </p>
        )}
      </div>
    );
  }

  if (!storeData || storeData.configs.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            API Integration Manager
          </h1>
          <p className="text-gray-500 mt-1">
            Manage API access for {shopDomain || "your store"}
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No API configurations yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Create your first API configuration to generate access tokens
              </p>
              <Button className="mt-4">
                <KeyRound className="h-4 w-4 mr-2" />
                Create API Config
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalConfigs = storeData.configs.length;
  const activeTokens = storeData.configs.filter(
    (c) => c.status === "active"
  ).length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          API Integration Manager
        </h1>
        <p className="text-gray-500 mt-1">
          {storeData.storeName || storeData.storeUrl}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Store
            </CardTitle>
            <Store className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">
              {storeData.storeUrl}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              API Configs
            </CardTitle>
            <KeyRound className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalConfigs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Active
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {activeTokens}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Configs Table */}
      <Card>
        <CardHeader>
          <CardTitle>API Configurations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Scopes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Token Health</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {storeData.configs.map((config) => {
                const status = getTokenStatus(config.tokens);
                const StatusIcon = status.icon;
                return (
                  <TableRow key={config.id}>
                    <TableCell className="font-medium">{config.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{config.apiType}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {config.scopes.slice(0, 3).map((scope) => (
                          <Badge
                            key={scope}
                            variant="secondary"
                            className="text-xs"
                          >
                            {scope}
                          </Badge>
                        ))}
                        {config.scopes.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{config.scopes.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          config.status === "active"
                            ? "default"
                            : config.status === "pending"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {config.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          status.color === "green"
                            ? "default"
                            : status.color === "yellow"
                            ? "secondary"
                            : "destructive"
                        }
                        className="gap-1"
                      >
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
