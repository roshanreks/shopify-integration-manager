export interface SetupGuide {
  steps: string[];
  devDashboardSettings: {
    appName: string;
    appUrl: string;
    redirectUrls: string[];
    requiredScopes: string[];
  };
  oauthUrl: string;
  warnings: string[];
}

export function generateSetupGuide(
  storeUrl: string,
  scopes: string[],
  configName: string,
  appClientId: string,
  redirectUri: string
): SetupGuide {
  const warnings: string[] = [];

  if (scopes.includes("read_all_orders") || scopes.some((s) => s.includes("read_all_orders"))) {
    warnings.push("read_all_orders requires Shopify Plus or additional data access approval.");
  }
  if (scopes.some((s) => s.includes("write_"))) {
    warnings.push("Write scopes allow data modification. Ensure client understands risks.");
  }
  if (scopes.some((s) => s.includes("gift_cards"))) {
    warnings.push("Gift card scopes may require additional merchant verification.");
  }
  if (scopes.some((s) => s.includes("users"))) {
    warnings.push("Staff/user scopes require additional permissions and may be restricted.");
  }

  const cleanStoreUrl = storeUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const expandedScopes = scopes.flatMap((s) => s.split(","));

  return {
    steps: [
      `1. Go to partners.shopify.com and log in to your Shopify Partners account`,
      `2. Click Apps → Create app → "Create app manually"`,
      `3. Name: "${configName}"`,
      `4. Go to Configuration → App URL: Set your app URL (e.g., ${process.env.HOST || "https://your-integration-manager.com"})`,
      `5. Add Allowed redirection URL: ${redirectUri}`,
      `6. Go to API Access → Configure Admin API integration`,
      `7. ENABLE these exact scopes: ${expandedScopes.join(", ")}`,
      `8. Save → Install app on store: ${cleanStoreUrl}`,
      `9. Reveal the Admin API access token ONCE (you cannot see it again)`,
      `10. Paste that token into this dashboard or use the OAuth flow below`,
    ],
    devDashboardSettings: {
      appName: configName,
      appUrl: process.env.HOST || "https://your-integration-manager.com",
      redirectUrls: [redirectUri],
      requiredScopes: expandedScopes,
    },
    oauthUrl: `https://${cleanStoreUrl}/admin/oauth/authorize?client_id=${appClientId}&scope=${expandedScopes.join(",")}&redirect_uri=${encodeURIComponent(redirectUri)}&state=GENERATED_STATE`,
    warnings,
  };
}
