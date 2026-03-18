export interface Player {
  file: string;
  name: string;
  nickname: string; // pipe-separated: "Priyanshu|bot|another"
  uid: string;
  date?: string;
  note?: string;        // public note — everyone
  friendNote?: string;  // friends + admin only
  privateNote?: string; // admin only
}

/** Split a pipe-separated nickname string into an array, filtering blanks */
export function splitNicknames(nickname: string): string[] {
  return (nickname || "").split("|").map((n) => n.trim()).filter(Boolean);
}

/** Join an array of nicknames back to pipe-separated string */
export function joinNicknames(nicks: string[]): string {
  return nicks.filter(Boolean).join("|");
}

export interface Category {
  id: string;
  label: string;
  uids: string[];
}

export interface CategoriesData {
  starred: string[];
  custom: Category[];
}

export type SortField = "date" | "name" | "uid";
export type SortOrder = "asc" | "desc";

export interface SortConfig {
  field: SortField;
  order: SortOrder;
}