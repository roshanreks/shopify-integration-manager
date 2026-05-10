"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Check, ChevronDown, ChevronUp, KeyRound } from "lucide-react";
import toast from "react-hot-toast";

interface ScopeItem {
  label: string;
  value: string;
  type: "read" | "write";
}

interface ScopeGroup {
  title: string;
  scopes: ScopeItem[];
}

interface Client {
  id: string;
  name: string;
  storeUrl: string;
}

export default function NewConfigPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get("clientId");

  const [clients, setClients] = useState<Client[]>([]);
  const [scopeGroups, setScopeGroups] = useState<ScopeGroup[]>([]);
  const [presets, setPresets] = useState<{ label: string; scopes: string[] }[]>([]);
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [clientId, setClientId] = useState(preselectedClientId || "");
  const [configName, setConfigName] = useState("");
  const [apiType, setApiType] = useState("admin_graphql");
  const [oauthFlow, setOauthFlow] = useState("authorization_code");
  const [shopifyClientId, setShopifyClientId] = useState("");
  const [shopifyClientSecret, setShopifyClientSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/scopes").then((r) => r.json()),
    ])
      .then(([clientsData, scopesData]) => {
        setClients(clientsData);
        setScopeGroups(scopesData.groups);
        setPresets(scopesData.presets);
        // Expand first group by default
        if (scopesData.groups.length > 0) {
          setExpandedGroups({ [scopesData.groups[0].title]: true });
        }
        setInitialLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load data");
        setInitialLoading(false);
      });
  }, []);

  const toggleScope = (value: string) => {
    setSelectedScopes((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

  const selectAllInGroup = (group: ScopeGroup, type: "read" | "write") => {
    const groupScopes = group.scopes.filter((s) => s.type === type).map((s) => s.value);
    const allSelected = groupScopes.every((s) => selectedScopes.includes(s));

    if (allSelected) {
      setSelectedScopes((prev) => prev.filter((s) => !groupScopes.includes(s)));
    } else {
      setSelectedScopes((prev) => Array.from(new Set([...prev, ...groupScopes])));
    }
  };

  const applyPreset = (presetLabel: string) => {
    const preset = presets.find((p) => p.label === presetLabel);
    if (preset) {
      setSelectedScopes(preset.scopes);
      toast.success(`Applied preset: ${preset.label}`);
    }
  };

  const hasWriteScopes = selectedScopes.some((s) =>
    scopeGroups.some((g) => g.scopes.some((scope) => scope.value === s && scope.type === "write"))
  );

  const expandedScopes = selectedScopes.flatMap((s) => s.split(","));

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      toast.error("Please select a client");
      return;
    }
    if (!configName) {
      toast.error("Please enter a config name");
      return;
    }
    if (selectedScopes.length === 0) {
      toast.error("Please select at least one scope");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: configName,
          clientId,
          scopes: selectedScopes,
          apiType,
          oauthFlow,
          shopifyClientId: shopifyClientId || undefined,
          shopifyClientSecret: shopifyClientSecret || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success("Configuration created");
        router.push(`/dashboard/configs/${data.id}`);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create config");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">New API Configuration</h1>
        <p className="text-gray-500 mt-1">
          Select scopes and configure OAuth settings for a client store
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client *</Label>
                <Select value={clientId} onValueChange={(v) => setClientId(v || "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} ({client.storeUrl})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Config Name *</Label>
                <Input
                  id="name"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  placeholder="Product Sync - Read Only"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="apiType">API Type</Label>
                <Select value={apiType} onValueChange={(v) => setApiType(v || "admin_graphql")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin_graphql">Admin GraphQL</SelectItem>
                    <SelectItem value="admin_rest">Admin REST</SelectItem>
                    <SelectItem value="storefront">Storefront</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="oauthFlow">OAuth Flow</Label>
                <Select value={oauthFlow} onValueChange={(v) => setOauthFlow(v || "authorization_code")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="authorization_code">Authorization Code</SelectItem>
                    <SelectItem value="client_credentials">Client Credentials</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {oauthFlow === "client_credentials" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shopifyClientId">Shopify Client ID</Label>
                  <Input
                    id="shopifyClientId"
                    value={shopifyClientId}
                    onChange={(e) => setShopifyClientId(e.target.value)}
                    placeholder="From Dev Dashboard"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shopifyClientSecret">Shopify Client Secret</Label>
                  <Input
                    id="shopifyClientSecret"
                    type="password"
                    value={shopifyClientSecret}
                    onChange={(e) => setShopifyClientSecret(e.target.value)}
                    placeholder="From Dev Dashboard"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scope Presets */}
        <Card>
          <CardHeader>
            <CardTitle>Recommended Presets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(preset.label)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Scope Selection */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Permission Scopes</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {expandedScopes.length} scope{expandedScopes.length !== 1 ? "s" : ""} selected
              </p>
            </div>
            {hasWriteScopes && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Write Scopes Selected
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {hasWriteScopes && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Write scopes allow data modification. Ensure your client understands the risks
                  before proceeding.
                </AlertDescription>
              </Alert>
            )}

            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {scopeGroups.map((group) => {
                  const isExpanded = expandedGroups[group.title];
                  const readScopes = group.scopes.filter((s) => s.type === "read");
                  const writeScopes = group.scopes.filter((s) => s.type === "write");
                  const allReadSelected = readScopes.every((s) => selectedScopes.includes(s.value));
                  const allWriteSelected = writeScopes.every((s) =>
                    selectedScopes.includes(s.value)
                  );

                  return (
                    <div key={group.title} className="border rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.title)}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <span className="font-semibold text-gray-900">{group.title}</span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="p-4 space-y-3">
                          <div className="flex gap-2">
                            {readScopes.length > 0 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => selectAllInGroup(group, "read")}
                              >
                                {allReadSelected ? "Deselect" : "Select"} All Read
                              </Button>
                            )}
                            {writeScopes.length > 0 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => selectAllInGroup(group, "write")}
                              >
                                {allWriteSelected ? "Deselect" : "Select"} All Write
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {group.scopes.map((scope) => (
                              <div
                                key={scope.value}
                                className="flex items-start space-x-2 p-2 rounded hover:bg-gray-50"
                              >
                                <Checkbox
                                  id={scope.value}
                                  checked={selectedScopes.includes(scope.value)}
                                  onCheckedChange={() => toggleScope(scope.value)}
                                />
                                <div className="grid gap-1 leading-none">
                                  <Label
                                    htmlFor={scope.value}
                                    className="text-sm font-medium cursor-pointer"
                                  >
                                    {scope.label}
                                  </Label>
                                  <code className="text-xs text-gray-500">
                                    {scope.value}
                                  </code>
                                </div>
                                <Badge
                                  variant={scope.type === "write" ? "destructive" : "secondary"}
                                  className="ml-auto text-[10px] h-5"
                                >
                                  {scope.type}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="gap-2">
            <KeyRound className="h-4 w-4" />
            {loading ? "Creating..." : "Create Configuration"}
          </Button>
        </div>
      </form>
    </div>
  );
}
