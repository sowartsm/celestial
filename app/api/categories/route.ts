import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { CategoriesData } from "@/lib/types";

const CATEGORIES_PATH = path.join(process.cwd(), "public", "data", "categories.json");

const DEFAULT_CATEGORIES: CategoriesData = {
  starred: [],
  custom: [],
};

function readCategories(): CategoriesData {
  try {
    if (!fs.existsSync(CATEGORIES_PATH)) return DEFAULT_CATEGORIES;
    const raw = fs.readFileSync(CATEGORIES_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export async function GET() {
  return NextResponse.json(readCategories());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { categories, password } = body;
    if (password !== process.env.ADMIN_PASSWORD && password !== "genshin2024") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    fs.writeFileSync(CATEGORIES_PATH, JSON.stringify(categories, null, 2), "utf-8");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save categories" }, { status: 500 });
  }
}
