export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { scopePresets } from "@/lib/scopes";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { useCase } = body;

  const preset = scopePresets.find((p) =>
    p.label.toLowerCase().includes(useCase.toLowerCase())
  );

  if (!preset) {
    return NextResponse.json({
      recommended: [],
      message: "No exact preset found. Please select scopes manually.",
    });
  }

  return NextResponse.json({
    recommended: preset.scopes,
    label: preset.label,
    message: `Recommended preset: ${preset.label}`,
  });
}
