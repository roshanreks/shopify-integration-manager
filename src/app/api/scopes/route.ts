export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { scopeGroups, scopePresets } from "@/lib/scopes";

export async function GET() {
  return NextResponse.json({
    groups: scopeGroups,
    presets: scopePresets,
  });
}
