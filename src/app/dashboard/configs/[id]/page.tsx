"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Copy,
  ExternalLink,
  KeyRound,
  RefreshCw,
  Trash2,
  ArrowLeft,
  FileText,
  Terminal,
} from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface ConfigDetail {
  id: string;
  name: string;
  apiType: string;
  oauthFlow: string;
  status: string;
  scopes: string[];
  shopifyClientId: string | null;
  installGuide: {
    steps: string[];
    devDashboardSettings: {
      appName: string;
      appUrl: string;
      redirectUrls: string[];
      requiredScopes: string[];
    };
    oauthUrl: string;
    warnings: string[];
  } | null;
  client: {
    name: string;
    storeUrl: string;
  };
  tokens: {
    id: string;
    shopDomain: string;
    grantedScopes: string[];
    expiresAt: string | null;
    isActive: boolean;
    needsRefresh: boolean;
    installedAt: string;
    lastUsedAt: string | null;
  }[];
}

export default function ConfigDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const configId = params.id as string;
  const oauthSuccess = searchParams.get("oauth") === "success";

  const [config, setConfig] = useState<ConfigDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [oauthLoading, setOauthLoading] = useState(false);

  const fetchConfig = () => {
    fetch(`/api/configs/${configId}`)
      .then((res) => res.json())
      .then((data) => {
        setConfig(data);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load config");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchConfig();
  }, [configId]);

  useEffect(() => {
    if (oauthSuccess) {
      toast.success("OAuth completed successfully!");
    }
  }, [oauthSuccess]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const startOAuth = async () => {
    if (!config) return;
    setOauthLoading(true);

    try {
      const res = await fetch("/api/shopify/oauth/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          configId: config.id,
          shopDomain: config.client.storeUrl,
        }),
      });

      const data = await res.json();
      if (res.ok && data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        toast.error(data.error || "Failed to start OAuth");
        setOauthLoading(false);
      }
    } catch {
      toast.error("Something went wrong");
      setOauthLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      const res = await fetch(`/api/configs/${configId}/token/refresh`, {
        method: "POST",
      });

      if (res.ok) {
        toast.success("Token refreshed successfully");
        fetchConfig();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to refresh token");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const revokeToken = async () => {
    if (!confirm("Are you sure you want to revoke this token?")) return;

    try {
      const res = await fetch(`/api/configs/${configId}/token`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Token revoked");
        fetchConfig();
      } else {
        toast.error("Failed to revoke token");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const deleteConfig = async () => {
    if (!confirm("Are you sure you want to delete this configuration?")) return;

    try {
      const res = await fetch(`/api/configs/${configId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Configuration deleted");
        router.push("/dashboard");
      } else {
        toast.error("Failed to delete configuration");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const getStatusBadge = () => {
    switch (config?.status) {
      case "active":
        return (
          <Badge className="gap-1 bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="h-3 w-3" />
            Active
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Expired
          </Badge>
        );
      case "revoked":
        return (
          <Badge variant="destructive" className="gap-1">
            <Trash2 className="h-3 w-3" />
            Revoked
          </Badge>
        );
      default:
        return <Badge variant="secondary">{config?.status}</Badge>;
    }
  };

  const activeToken = config?.tokens.find((t) => t.isActive);

  const getCurlExample = () => {
    if (!config || !activeToken) return "";
    const cleanShop = config.client.storeUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "");
    if (config.apiType === "admin_graphql") {
      return `curl -X POST \\
  https://${cleanShop}/admin/api/2024-01/graphql.json \\
  -H "Content-Type: application/json" \\
  -H "X-Shopify-Access-Token: <TOKEN>" \\
  -d '{"query": "{ shop { name } }"}'`;
    }
    return `curl -X GET \\
  https://${cleanShop}/admin/api/2024-01/products.json \\
  -H "X-Shopify-Access-Token: <TOKEN>"`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium">Configuration not found</p>
        <Link href="/dashboard">
          <Button className="mt-4" variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{config.name}</h1>
            <p className="text-gray-500">
              {config.client.name} — {config.client.storeUrl}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <Button variant="destructive" size="sm" onClick={deleteConfig}>
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      <Tabs defaultValue="guide" className="space-y-4">
        <TabsList>
          <TabsTrigger value="guide" className="gap-1">
            <FileText className="h-4 w-4" />
            Setup Guide
          </TabsTrigger>
          <TabsTrigger value="scopes" className="gap-1">
            <KeyRound className="h-4 w-4" />
            Scopes
          </TabsTrigger>
          <TabsTrigger value="token" className="gap-1">
            <CheckCircle className="h-4 w-4" />
            Token Status
          </TabsTrigger>
          <TabsTrigger value="api" className="gap-1">
            <Terminal className="h-4 w-4" />
            API Test
          </TabsTrigger>
        </TabsList>

        <TabsContent value="guide" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dev Dashboard Setup Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.installGuide?.warnings && config.installGuide.warnings.length > 0 && (
                <div className="space-y-2">
                  {config.installGuide.warnings.map((warning, i) => (
                    <Alert key={i} variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{warning}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <h3 className="font-semibold">Step-by-Step Instructions</h3>
                <ol className="space-y-2">
                  {config.installGuide?.steps?.map((step, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="font-mono text-gray-500 min-w-[24px]">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  )) || (
                    <li className="text-gray-500">
                      Guide not generated yet. Generate it below.
                    </li>
                  )}
                </ol>
              </div>

              {!config.installGuide && (
                <Button
                  onClick={async () => {
                    const res = await fetch(`/api/configs/${configId}/guide`, {
                      method: "POST",
                    });
                    if (res.ok) {
                      toast.success("Guide generated");
                      fetchConfig();
                    }
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Setup Guide
                </Button>
              )}

              {config.installGuide?.oauthUrl && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="font-semibold">OAuth Authorization URL</h3>
                    <div className="flex gap-2">
                      <code className="flex-1 bg-gray-100 p-2 rounded text-xs break-all">
                        {config.installGuide.oauthUrl}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(config.installGuide!.oauthUrl, "OAuth URL")
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      onClick={startOAuth}
                      disabled={oauthLoading}
                      className="gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {oauthLoading ? "Starting..." : "Start OAuth Flow"}
                    </Button>
                  </div>
                </>
              )}

              {config.installGuide?.devDashboardSettings && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="font-semibold">Dev Dashboard Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">App Name:</span>
                        <p className="font-medium">
                          {config.installGuide.devDashboardSettings.appName}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">App URL:</span>
                        <p className="font-medium">
                          {config.installGuide.devDashboardSettings.appUrl}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-gray-500">Redirect URLs:</span>
                        <ul className="list-disc list-inside">
                          {config.installGuide.devDashboardSettings.redirectUrls.map(
                            (url, i) => (
                              <li key={i} className="font-mono text-xs">
                                {url}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scopes">
          <Card>
            <CardHeader>
              <CardTitle>Selected Scopes ({config.scopes.flatMap((s: string) => s.split(",")).length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {config.scopes.flatMap((s: string) => s.split(",")).map((scope) => (
                  <Badge
                    key={scope}
                    variant={scope.includes("write_") ? "destructive" : "secondary"}
                  >
                    {scope}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="token">
          <Card>
            <CardHeader>
              <CardTitle>Token Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeToken ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Shop Domain:</span>
                      <p className="font-medium">{activeToken.shopDomain}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Installed:</span>
                      <p className="font-medium">
                        {new Date(activeToken.installedAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <p>
                        {activeToken.isActive ? (
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        ) : (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Expires:</span>
                      <p className="font-medium">
                        {activeToken.expiresAt
                          ? new Date(activeToken.expiresAt).toLocaleString()
                          : "Never (offline token)"}
                      </p>
                    </div>
                    {activeToken.needsRefresh && (
                      <div>
                        <span className="text-gray-500">Auto Refresh:</span>
                        <p>
                          <Badge variant="secondary">Required every ~24h</Badge>
                        </p>
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <span className="text-gray-500">Granted Scopes:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {activeToken.grantedScopes.map((scope) => (
                          <Badge key={scope} variant="outline" className="text-xs">
                            {scope}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {activeToken.needsRefresh && (
                      <Button onClick={refreshToken} className="gap-1">
                        <RefreshCw className="h-4 w-4" />
                        Refresh Token
                      </Button>
                    )}
                    <Button variant="destructive" onClick={revokeToken} className="gap-1">
                      <Trash2 className="h-4 w-4" />
                      Revoke Token
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <KeyRound className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No active token</p>
                  <p className="text-sm mb-4">
                    Complete the OAuth flow or manually add a token
                  </p>
                  <Button onClick={startOAuth} disabled={oauthLoading}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {oauthLoading ? "Starting..." : "Start OAuth Flow"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeToken ? (
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      The token is not exposed in the UI for security. Copy this cURL and replace
                      &lt;TOKEN&gt; with the actual token from your Dev Dashboard or token vault.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">cURL Example</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(getCurlExample(), "cURL")}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{getCurlExample()}</code>
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Terminal className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No token available</p>
                  <p className="text-sm">Complete OAuth to get a token and see API examples</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
