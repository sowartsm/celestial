export type Relationship =
  | "old-friend"
  | "new-friend"
  | "coop-friend"
  | "coop-random"
  | "random";

export interface Player {
  file: string;
  name: string;
  nickname: string; // pipe-separated: "Priyanshu|bot|another"
  uid: string;
  date?: string;
  note?: string;         // public note — everyone
  friendNote?: string;   // friends + admin only
  privateNote?: string;  // admin only
  relationship?: Relationship;
  origin?: string;       // where they're from
  gameId?: string;       // in-game display name if different
  tags?: string;         // pipe-separated: "male|whale|active"
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

// Relationship display config
export const RELATIONSHIP_CONFIG: Record<
  Relationship,
  { label: string; color: string; bg: string; border: string }
> = {
  "old-friend": {
    label: "Old Friend",
    color: "rgba(200,169,110,0.9)",
    bg: "rgba(200,169,110,0.1)",
    border: "rgba(200,169,110,0.3)",
  },
  "new-friend": {
    label: "New Friend",
    color: "rgba(167,139,250,0.9)",
    bg: "rgba(167,139,250,0.1)",
    border: "rgba(167,139,250,0.3)",
  },
  "coop-friend": {
    label: "Co-op Friend",
    color: "rgba(45,212,191,0.9)",
    bg: "rgba(45,212,191,0.08)",
    border: "rgba(45,212,191,0.25)",
  },
  "coop-random": {
    label: "Co-op Random",
    color: "rgba(125,211,252,0.9)",
    bg: "rgba(125,211,252,0.08)",
    border: "rgba(125,211,252,0.2)",
  },
  random: {
    label: "Random",
    color: "rgba(196,181,253,0.5)",
    bg: "rgba(196,181,253,0.05)",
    border: "rgba(196,181,253,0.15)",
  },
};