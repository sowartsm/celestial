import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { Player } from "@/lib/types";

export const dynamic = "force-dynamic";

const LOG_PATH = path.join(process.cwd(), "public", "data", "changelog.json");
const MAX_ENTRIES = 300;

export interface LogEntry {
  id: string;
  timestamp: string;
  action: "add" | "edit" | "delete";
  uid: string;
  name: string;
  before?: Partial<Player>;
  after?: Partial<Player>;
}

function readLog(): LogEntry[] {
  try {
    if (!fs.existsSync(LOG_PATH)) return [];
    return JSON.parse(fs.readFileSync(LOG_PATH, "utf-8"));
  } catch {
    return [];
  }
}

function writeLog(entries: LogEntry[]) {
  fs.writeFileSync(LOG_PATH, JSON.stringify(entries, null, 2), "utf-8");
}

export async function GET() {
  return NextResponse.json(readLog());
}

export async function POST(req: NextRequest) {
  try {
    const { entry, password } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD && password !== "genshin2024") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const log = readLog();
    const newEntry: LogEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    const updated = [newEntry, ...log].slice(0, MAX_ENTRIES);
    writeLog(updated);
    return NextResponse.json({ success: true, entry: newEntry });
  } catch {
    return NextResponse.json({ error: "Failed to write log" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  // Restore a deleted player — returns the player object to re-add
  try {
    const { id, password } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD && password !== "genshin2024") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const log = readLog();
    const entry = log.find((e) => e.id === id);
    if (!entry || entry.action !== "delete") {
      return NextResponse.json({ error: "Entry not found or not a delete" }, { status: 404 });
    }
    return NextResponse.json({ player: entry.before });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}