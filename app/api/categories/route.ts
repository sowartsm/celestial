import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { CategoriesData } from "@/lib/types";

export const dynamic = "force-dynamic";

const DEFAULT_CATEGORIES: CategoriesData = { starred: [], custom: [] };

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("categories")
      .select("starred, custom")
      .eq("id", "main")
      .single();

    if (error || !data) return NextResponse.json(DEFAULT_CATEGORIES);

    return NextResponse.json({
      starred: data.starred || [],
      custom: data.custom || [],
    });
  } catch {
    return NextResponse.json(DEFAULT_CATEGORIES);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { categories, password } = body;

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabaseAdmin
      .from("categories")
      .upsert(
        { id: "main", starred: categories.starred, custom: categories.custom },
        { onConflict: "id" }
      );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save categories" }, { status: 500 });
  }
}