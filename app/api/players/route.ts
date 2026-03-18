import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import Papa from "papaparse";
import { parsePlayers } from "@/lib/utils";

export const dynamic = "force-dynamic";

const CSV_PATH = path.join(process.cwd(), "public", "data", "players.csv");

export async function GET() {
  try {
    if (!fs.existsSync(CSV_PATH)) {
      return NextResponse.json({ players: [] });
    }
    const content = fs.readFileSync(CSV_PATH, "utf-8");
    const result = Papa.parse(content, { header: true, skipEmptyLines: true });
    const players = parsePlayers(result.data as Record<string, string>[]);
    return NextResponse.json({ players });
  } catch (e) {
    return NextResponse.json({ error: "Failed to read CSV" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Admin: write entire player array back as CSV
  try {
    const { players, password } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD && password !== "genshin2024") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { playersToCSV } = await import("@/lib/utils");
    const csv = playersToCSV(players);
    fs.writeFileSync(CSV_PATH, csv, "utf-8");
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to write CSV" }, { status: 500 });
  }
}