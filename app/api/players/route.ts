import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { parseDateFromFilename } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const uid = req.nextUrl.searchParams.get("uid");
    let query = supabase.from("nemesam").select("*");
    if (uid) query = query.eq("uid", uid);
    const { data, error } = await query;
    if (error) throw error;

    const players = (data || []).map((row: any) => ({
      ...row,
      date: parseDateFromFilename(row.file),
    }));

    return NextResponse.json({ players });
  } catch {
    return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, player, password } = await req.json();

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Strip derived fields not stored in Supabase
    const { date, ...playerData } = player;

    if (action === "insert") {
      const { error } = await supabaseAdmin.from("nemesam").insert(playerData);
      if (error) { console.error("Supabase insert error:", error); throw error; }
    } else if (action === "update") {
      const { error } = await supabaseAdmin
        .from("nemesam")
        .update(playerData)
        .eq("uid", player.uid);
      if (error) { console.error("Supabase update error:", error); throw error; }
    } else if (action === "delete") {
      const { error } = await supabaseAdmin
        .from("nemesam")
        .delete()
        .eq("uid", player.uid);
      if (error) { console.error("Supabase delete error:", error); throw error; }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to perform action" }, { status: 500 });
  }
}