export interface ScopeItem {
  label: string;
  value: string;
  type: "read" | "write";
}

export interface ScopeGroup {
  title: string;
  scopes: ScopeItem[];
}

export const scopeGroups: ScopeGroup[] = [
  {
    title: "Products & Inventory",
    scopes: [
      { label: "Read Products", value: "read_products", type: "read" },
      { label: "Write Products", value: "write_products", type: "write" },
      { label: "Read Inventory", value: "read_inventory", type: "read" },
      { label: "Write Inventory", value: "write_inventory", type: "write" },
      { label: "Read Product Listings", value: "read_product_listings", type: "read" },
      { label: "Read Collections", value: "read_custom_collections,read_smart_collections", type: "read" },
      { label: "Write Collections", value: "write_custom_collections,write_smart_collections", type: "write" },
      { label: "Read Locations", value: "read_locations", type: "read" },
    ],
  },
  {
    title: "Orders & Revenue",
    scopes: [
      { label: "Read Orders", value: "read_orders", type: "read" },
      { label: "Write Orders", value: "write_orders", type: "write" },
      { label: "Read Draft Orders", value: "read_draft_orders", type: "read" },
      { label: "Write Draft Orders", value: "write_draft_orders", type: "write" },
      { label: "Read Transactions", value: "read_transactions", type: "read" },
      { label: "Read Fulfillments", value: "read_fulfillments", type: "read" },
      { label: "Write Fulfillments", value: "write_fulfillments", type: "write" },
      { label: "Read All Orders (GDPR-sensitive)", value: "read_all_orders", type: "read" },
      { label: "Read Assigned Fulfillment Orders", value: "read_assigned_fulfillment_orders", type: "read" },
      { label: "Write Assigned Fulfillment Orders", value: "write_assigned_fulfillment_orders", type: "write" },
      { label: "Read Merchant Managed Fulfillment Orders", value: "read_merchant_managed_fulfillment_orders", type: "read" },
      { label: "Write Merchant Managed Fulfillment Orders", value: "write_merchant_managed_fulfillment_orders", type: "write" },
      { label: "Read Third-Party Fulfillment Orders", value: "read_third_party_fulfillment_orders", type: "read" },
      { label: "Write Third-Party Fulfillment Orders", value: "write_third_party_fulfillment_orders", type: "write" },
    ],
  },
  {
    title: "Customers",
    scopes: [
      { label: "Read Customers", value: "read_customers", type: "read" },
      { label: "Write Customers", value: "write_customers", type: "write" },
      { label: "Read Customer Events", value: "read_customer_events", type: "read" },
      { label: "Read Customer Merge", value: "read_customer_merge", type: "read" },
      { label: "Write Customer Merge", value: "write_customer_merge", type: "write" },
    ],
  },
  {
    title: "Analytics & Reports",
    scopes: [
      { label: "Read Analytics", value: "read_analytics", type: "read" },
      { label: "Read Reports", value: "read_reports", type: "read" },
      { label: "Write Reports", value: "write_reports", type: "write" },
    ],
  },
  {
    title: "Storefront & Content",
    scopes: [
      { label: "Read Themes", value: "read_themes", type: "read" },
      { label: "Write Themes", value: "write_themes", type: "write" },
      { label: "Read Content", value: "read_content", type: "read" },
      { label: "Write Content", value: "write_content", type: "write" },
      { label: "Read Pages", value: "read_pages", type: "read" },
      { label: "Write Pages", value: "write_pages", type: "write" },
      { label: "Read Blogs", value: "read_blogs", type: "read" },
      { label: "Write Blogs", value: "write_blogs", type: "write" },
    ],
  },
  {
    title: "Discounts & Marketing",
    scopes: [
      { label: "Read Price Rules", value: "read_price_rules", type: "read" },
      { label: "Write Price Rules", value: "write_price_rules", type: "write" },
      { label: "Read Discounts", value: "read_discounts", type: "read" },
      { label: "Write Discounts", value: "write_discounts", type: "write" },
      { label: "Read Gift Cards", value: "read_gift_cards", type: "read" },
      { label: "Write Gift Cards", value: "write_gift_cards", type: "write" },
      { label: "Read Marketing Events", value: "read_marketing_events", type: "read" },
      { label: "Write Marketing Events", value: "write_marketing_events", type: "write" },
    ],
  },
  {
    title: "Shipping & Configuration",
    scopes: [
      { label: "Read Shipping", value: "read_shipping", type: "read" },
      { label: "Write Shipping", value: "write_shipping", type: "write" },
      { label: "Read Shop Settings", value: "read_shop", type: "read" },
      { label: "Read Markets", value: "read_markets", type: "read" },
      { label: "Write Markets", value: "write_markets", type: "write" },
    ],
  },
  {
    title: "Metafields & Metadata",
    scopes: [
      { label: "Read Metafields", value: "read_metafields", type: "read" },
      { label: "Write Metafields", value: "write_metafields", type: "write" },
      { label: "Read Metaobjects", value: "read_metaobjects", type: "read" },
      { label: "Write Metaobjects", value: "write_metaobjects", type: "write" },
      { label: "Read Metaobject Definitions", value: "read_metaobject_definitions", type: "read" },
      { label: "Write Metaobject Definitions", value: "write_metaobject_definitions", type: "write" },
    ],
  },
  {
    title: "Advanced / Sensitive",
    scopes: [
      { label: "Read Script Tags", value: "read_script_tags", type: "read" },
      { label: "Write Script Tags", value: "write_script_tags", type: "write" },
      { label: "Read Legal Policies", value: "read_legal_policies", type: "read" },
      { label: "Write Legal Policies", value: "write_legal_policies", type: "write" },
      { label: "Read Online Store Pages", value: "read_online_store_pages", type: "read" },
      { label: "Write Online Store Pages", value: "write_online_store_pages", type: "write" },
      { label: "Read Users (Staff)", value: "read_users", type: "read" },
      { label: "Write Users (Staff)", value: "write_users", type: "write" },
      { label: "Read Apps", value: "read_apps", type: "read" },
    ],
  },
];

export const scopePresets: { label: string; scopes: string[] }[] = [
  {
    label: "Product Sync",
    scopes: [
      "read_products",
      "write_products",
      "read_inventory",
      "write_inventory",
      "read_custom_collections,read_smart_collections",
      "write_custom_collections,write_smart_collections",
      "read_locations",
      "read_metafields",
      "write_metafields",
    ],
  },
  {
    label: "Order Manager",
    scopes: [
      "read_orders",
      "write_orders",
      "read_draft_orders",
      "write_draft_orders",
      "read_transactions",
      "read_fulfillments",
      "write_fulfillments",
      "read_customers",
      "write_customers",
      "read_shipping",
    ],
  },
  {
    label: "Analytics Only",
    scopes: ["read_analytics", "read_reports", "read_orders", "read_customers", "read_products"],
  },
  {
    label: "Full Access",
    scopes: scopeGroups.flatMap((g) => g.scopes.map((s) => s.value)),
  },
  {
    label: "Read-Only Everything",
    scopes: scopeGroups
      .flatMap((g) => g.scopes.filter((s) => s.type === "read").map((s) => s.value)),
  },
];

export function getAllScopes(): string[] {
  return scopeGroups.flatMap((g) => g.scopes.map((s) => s.value));
}

export function expandScopes(scopes: string[]): string[] {
  // Some scope values contain comma-separated scopes
  return scopes.flatMap((s) => s.split(","));
}
