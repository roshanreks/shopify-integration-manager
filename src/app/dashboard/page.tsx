"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Store, KeyRound, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useShopify } from "@/lib/shopify-context";

interface Client {
  id: string;
  name: string;
  storeUrl: string;
  storeName: string | null;
  contactEmail: string | null;
  apiConfigs: {
    id: string;
    status: string;
    tokens: {
      id: string;
      expiresAt: string | null;
      needsRefresh: boolean;
    }[];
  }[];
}

export default function DashboardPage() {
  const { shop } = useShopify();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shop) return;
    fetch(`/api/clients?shop=${encodeURIComponent(shop)}`)
      .then((res) => res.json())
      .then((data) => {
        setClients(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [shop]);

  const getTokenStatus = (configs: Client["apiConfigs"]) => {
    const allTokens = configs.flatMap((c) => c.tokens);
    if (allTokens.length === 0) return { label: "No Token", color: "gray", icon: AlertTriangle };

    const now = new Date();
    const hasExpired = allTokens.some(
      (t) => t.expiresAt && new Date(t.expiresAt) < now
    );
    const expiringSoon = allTokens.some(
      (t) =>
        t.expiresAt &&
        new Date(t.expiresAt).getTime() - now.getTime() < 24 * 60 * 60 * 1000 &&
        new Date(t.expiresAt) > now
    );
    const needsRefresh = allTokens.some((t) => t.needsRefresh);

    if (hasExpired) return { label: "Expired", color: "red", icon: AlertTriangle };
    if (expiringSoon || needsRefresh) return { label: "Expiring Soon", color: "yellow", icon: Clock };
    return { label: "Active", color: "green", icon: CheckCircle };
  };

  const totalConfigs = clients.reduce((sum, c) => sum + c.apiConfigs.length, 0);
  const activeTokens = clients.reduce(
    (sum, c) =>
      sum +
      c.apiConfigs.filter((cfg) => cfg.status === "active").length,
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of all your client stores and API connections</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Clients</CardTitle>
            <Store className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{clients.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">API Configs</CardTitle>
            <KeyRound className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalConfigs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Connections</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{activeTokens}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Clients</CardTitle>
          <Link href={`/dashboard/clients?shop=${encodeURIComponent(shop || "")}`}>
            <Button variant="outline" size="sm">
              <Store className="h-4 w-4 mr-2" />
              Manage Clients
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Store className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No clients yet</p>
              <p className="text-sm">Add your first client store to get started</p>
              <Link href={`/dashboard/clients?shop=${encodeURIComponent(shop || "")}`}>
                <Button className="mt-4">Add Client</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Store URL</TableHead>
                  <TableHead>Configs</TableHead>
                  <TableHead>Token Health</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => {
                  const status = getTokenStatus(client.apiConfigs);
                  const StatusIcon = status.icon;
                  return (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        {client.name}
                        {client.contactEmail && (
                          <p className="text-xs text-gray-500">{client.contactEmail}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{client.storeUrl}</TableCell>
                      <TableCell>{client.apiConfigs.length}</TableCell>
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
                        <Link href={`/dashboard/configs/new?shop=${encodeURIComponent(shop || "")}&clientId=${client.id}`}>
                          <Button variant="ghost" size="sm">
                            <KeyRound className="h-4 w-4 mr-1" />
                            New Config
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
