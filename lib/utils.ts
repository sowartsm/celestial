import type { Player, CategoriesData, SortConfig } from "./types";
export { splitNicknames, joinNicknames } from "./types";

/**
 * Parse a date from the Genshin screenshot filename format:
 * "Genshin Impact Screenshot 2023.11.24 - 22.37.50.jpg"
 * Returns a Date object or null.
 */
export function parseDateFromFilename(filename: string): Date | null {
  // Match: YYYY.MM.DD - HH.MM.SS
  const match = filename.match(/(\d{4})\.(\d{2})\.(\d{2})\s*-\s*(\d{2})\.(\d{2})\.(\d{2})/);
  if (!match) return null;
  const [, year, month, day, hour, minute, second] = match;
  return new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    parseInt(second)
  );
}

export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Parse raw CSV rows into Player objects with parsed dates.
 */
export function parsePlayers(rows: Record<string, string>[]): Player[] {
  return rows
    .filter((row) => row.uid && row.uid.trim())
    .map((row) => {
      const date = parseDateFromFilename(row.file || "");
      return {
        file: row.file?.trim() || "",
        name: row.name?.trim() || "",
        nickname: row.nickname?.trim() || "",
        uid: row.uid?.trim() || "",
        date: date ? date.toISOString() : undefined,
        note: row.note?.trim() || "",
        friendNote: row.friendNote?.trim() || "",
        privateNote: row.privateNote?.trim() || "",
      };
    });
}

/**
 * Sort players by the given config.
 */
export function sortPlayers(players: Player[], sort: SortConfig): Player[] {
  const sorted = [...players];
  sorted.sort((a, b) => {
    let cmp = 0;
    if (sort.field === "date") {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      cmp = da - db;
    } else if (sort.field === "name") {
      cmp = (a.name || "").localeCompare(b.name || "");
    } else if (sort.field === "uid") {
      cmp = parseInt(a.uid || "0") - parseInt(b.uid || "0");
    }
    return sort.order === "asc" ? cmp : -cmp;
  });
  return sorted;
}

/**
 * Convert Player array to CSV string.
 */
export function playersToCSV(players: Player[]): string {
  const header = "file,name,nickname,uid,note,friendNote,privateNote";
  const rows = players.map((p) => {
    const escape = (v: string) => {
      const s = v || "";
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };
    return [escape(p.file), escape(p.name), escape(p.nickname), escape(p.uid), escape(p.note || ""), escape(p.friendNote || ""), escape(p.privateNote || "")].join(",");
  });
  return [header, ...rows].join("\n");
}

/**
 * Filter players by active category.
 */
export function filterByCategory(
  players: Player[],
  activeCategory: string,
  categories: CategoriesData
): Player[] {
  if (activeCategory === "all") return players;
  if (activeCategory === "dated") return players.filter((p) => !!p.date);
  if (activeCategory === "undated") return players.filter((p) => !p.date);
  if (activeCategory === "starred") return players.filter((p) => categories.starred.includes(p.uid));
  const custom = categories.custom.find((c) => c.id === activeCategory);
  if (custom) return players.filter((p) => custom.uids.includes(p.uid));
  return players;
}