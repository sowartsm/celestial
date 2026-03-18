"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { Player, CategoriesData, SortConfig, Category } from "@/lib/types";
import { splitNicknames, joinNicknames } from "@/lib/types";
import { filterByCategory, sortPlayers, parseDateFromFilename, formatDate } from "@/lib/utils";
import CategoryBar from "@/components/CategoryBar";
import SortControls from "@/components/SortControls";
import { PlayerModal } from "@/components/PlayerCard";

// Star button inline
function StarBtn({ isStarred, onToggle }: { isStarred: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className={`star-btn ${isStarred ? "active" : ""}`}
      title={isStarred ? "Remove from starred" : "Add to starred"}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
        fill={isStarred ? "currentColor" : "none"} stroke="currentColor"
        strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    </button>
  );
}

const ADMIN_PASSWORD =
  process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "larry78";
  
// ─── Login Gate ───────────────────────────────────────────────────────────────
function LoginGate({ onLogin }: { onLogin: (pw: string) => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);

  const attempt = () => {
    if (pw === ADMIN_PASSWORD) {
      onLogin(pw);
    } else {
      setError(true);
      setTimeout(() => setError(false), 1500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div
        className="glass-gold rounded-2xl p-10 w-full max-w-sm text-center"
        style={{ border: "1px solid rgba(200,169,110,0.3)" }}
      >
        <div className="mb-6">
          <div className="divider-gold w-24 mx-auto mb-4" />
          <h1 className="font-display text-2xl tracking-widest mb-1" style={{ color: "var(--lav-300)" }}>
            Admin Access
          </h1>
          <p className="text-xs tracking-widest uppercase" style={{ color: "rgba(196,181,253,0.35)" }}>
            Restricted Area
          </p>
          <div className="divider-gold w-24 mx-auto mt-4" />
        </div>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && attempt()}
          placeholder="Enter password"
          className="edit-input text-center mb-4 py-3"
          style={{ borderColor: error ? "rgba(248,113,113,0.6)" : undefined, fontSize: "1rem" }}
        />
        {error && (
          <p className="text-xs mb-3" style={{ color: "rgba(248,113,113,0.8)" }}>
            Incorrect password
          </p>
        )}
        <button className="btn-gold w-full py-3" onClick={attempt}>Enter</button>
        <div className="mt-6">
          <a href="/" className="text-xs" style={{ color: "rgba(196,181,253,0.35)" }}>
            ← Back to Registry
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Search (UID + Name combined) ──────────────────────────────────────
function AdminSearchBox({
  value,
  onValueChange,
}: {
  value: string;
  onValueChange: (v: string) => void;
}) {
  return (
    <div className="relative flex items-center w-full max-w-md">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
        strokeWidth={1.5} stroke="currentColor"
        className="absolute left-4 w-4 h-4 pointer-events-none"
        style={{ color: "rgba(196,181,253,0.4)" }}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder="Search UID / name..."
        className="search-input w-full rounded-xl py-3"
        style={{ fontSize: "1rem", letterSpacing: "0.02em", paddingLeft: "2.5rem", paddingRight: "2.5rem", textAlign: "left" }}
      />
      {value && (
        <button className="absolute right-4" style={{ color: "rgba(196,181,253,0.4)" }}
          onClick={() => onValueChange("")}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

function NicknameEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const nicks = splitNicknames(value);
  const [input, setInput] = useState("");

  const add = () => {
    const trimmed = input.trim();
    if (!trimmed || nicks.includes(trimmed)) return;
    onChange(joinNicknames([...nicks, trimmed]));
    setInput("");
  };

  const remove = (n: string) => onChange(joinNicknames(nicks.filter((x) => x !== n)));

  return (
    <div>
      {/* Existing tags */}
      <div className="flex flex-wrap gap-1 mb-1.5">
        {nicks.map((n) => (
          <span key={n} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
            style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.25)", color: "rgba(200,169,110,0.8)" }}>
            {n}
            <button onClick={() => remove(n)} style={{ color: "rgba(248,113,113,0.7)", lineHeight: 1, fontSize: "0.9rem" }}>×</button>
          </span>
        ))}
      </div>
      {/* Input to add new */}
      <div className="flex gap-1">
        <input
          className="edit-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Add nickname…"
          style={{ fontSize: "0.82rem" }}
        />
        <button className="btn-ghost text-xs px-2 flex-shrink-0" onClick={add}>+</button>
      </div>
    </div>
  );
}
function EditableRow({
  player,
  onSave,
  onDelete,
  onCancel,
  isNew = false,
}: {
  player: Player;
  onSave: (p: Player) => void;
  onDelete?: () => void;
  onCancel?: () => void;
  isNew?: boolean;
}) {
  const [draft, setDraft] = useState<Player>({ ...player });
  const set = (k: keyof Player, v: string) => setDraft((d) => ({ ...d, [k]: v }));

  const [dateVal, setDateVal] = useState(() => {
    if (!player.date) return "";
    const d = new Date(player.date);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  });
  const [timeVal, setTimeVal] = useState(() => {
    if (!player.date) return "";
    const d = new Date(player.date);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });

  const buildFilename = (date: string, time: string) => {
    if (!date) return "";
    const [year, month, day] = date.split("-");
    const [hour, minute] = (time || "00:00").split(":");
    return `Genshin Impact Screenshot ${year}.${month}.${day} - ${hour}.${minute}.00.jpg`;
  };

  const buildIso = (date: string, time: string) => {
    if (!date) return undefined;
    const d = new Date(`${date}T${time || "00:00"}`);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  };

  const handleDateChange = (v: string) => {
    setDateVal(v);
    setDraft((d) => ({ ...d, date: buildIso(v, timeVal), file: buildFilename(v, timeVal) }));
  };

  const handleTimeChange = (v: string) => {
    setTimeVal(v);
    setDraft((d) => ({ ...d, date: buildIso(dateVal, v), file: buildFilename(dateVal, v) }));
  };

  const handleNameChange = (v: string) => {
    setDraft((d) => ({ ...d, name: v }));
  };

  return (
    <>
      <tr style={{ background: "rgba(200,169,110,0.04)" }}>
        <td>
          <div className="flex gap-1 mb-1.5">
            <input
              type="date"
              className="edit-input"
              value={dateVal}
              onChange={(e) => handleDateChange(e.target.value)}
              style={{ colorScheme: "dark", fontSize: "0.82rem", flex: 1 }}
            />
            <input
              type="time"
              className="edit-input"
              value={timeVal}
              onChange={(e) => handleTimeChange(e.target.value)}
              style={{ colorScheme: "dark", fontSize: "0.82rem", width: 90 }}
            />
          </div>
          {draft.file && (
            <p style={{
              color: "rgba(196,181,253,0.4)",
              fontSize: "0.65rem",
              fontFamily: "'JetBrains Mono', monospace",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 240,
            }} title={draft.file}>
              {draft.file}
            </p>
          )}
        </td>
        <td>
          <input className="edit-input" value={draft.name}
            onChange={(e) => handleNameChange(e.target.value)} placeholder="Name" />
        </td>
        <td>
          <NicknameEditor value={draft.nickname} onChange={(v) => set("nickname", v)} />
        </td>
        <td>
          <input className="edit-input" value={draft.uid}
            onChange={(e) => set("uid", e.target.value.replace(/\D/g, ""))}
            placeholder="UID" style={{ fontFamily: "'JetBrains Mono', monospace" }} />
        </td>
        <td>
          <div className="flex gap-2 flex-wrap">
            <button className="btn-gold text-xs px-3 py-1.5" onClick={() => onSave(draft)}>
              {isNew ? "Add" : "Save"}
            </button>
            {onCancel && (
              <button className="btn-ghost text-xs px-3 py-1.5" onClick={onCancel}>Cancel</button>
            )}
            {onDelete && (
              <button className="btn-danger text-xs px-3 py-1.5" onClick={onDelete}>Delete</button>
            )}
          </div>
        </td>
      </tr>
      {/* Note rows */}
      <tr style={{ background: "rgba(200,169,110,0.02)" }}>
        <td colSpan={6} style={{ paddingTop: "0.25rem", paddingBottom: "0.25rem" }}>
          <div className="flex items-start gap-2">
            <span className="text-xs mt-2 flex-shrink-0" style={{ color: "rgba(94,234,212,0.5)", fontFamily: "'Cinzel', serif", letterSpacing: "0.08em", minWidth: 85 }}>
              Public Note
            </span>
            <textarea className="note-textarea flex-1" value={draft.note || ""}
              onChange={(e) => set("note", e.target.value)}
              placeholder="Visible to everyone..." rows={2} />
          </div>
        </td>
      </tr>
      <tr style={{ background: "rgba(200,169,110,0.02)" }}>
        <td colSpan={6} style={{ paddingTop: "0.25rem", paddingBottom: "0.25rem" }}>
          <div className="flex items-start gap-2">
            <span className="text-xs mt-2 flex-shrink-0" style={{ color: "rgba(125,211,252,0.5)", fontFamily: "'Cinzel', serif", letterSpacing: "0.08em", minWidth: 85 }}>
              Friends Note
            </span>
            <textarea className="note-textarea flex-1" value={draft.friendNote || ""}
              onChange={(e) => set("friendNote", e.target.value)}
              placeholder="Visible to friends + admin..." rows={2}
              style={{ borderColor: "rgba(125,211,252,0.3)" }} />
          </div>
        </td>
      </tr>
      <tr style={{ background: "rgba(200,169,110,0.02)" }}>
        <td colSpan={6} style={{ paddingTop: "0.25rem", paddingBottom: "0.75rem" }}>
          <div className="flex items-start gap-2">
            <span className="text-xs mt-2 flex-shrink-0" style={{ color: "rgba(248,113,113,0.5)", fontFamily: "'Cinzel', serif", letterSpacing: "0.08em", minWidth: 85 }}>
              Private Note
            </span>
            <textarea className="note-textarea flex-1" value={draft.privateNote || ""}
              onChange={(e) => set("privateNote", e.target.value)}
              placeholder="Admin only — never shown publicly..." rows={2}
              style={{ borderColor: "rgba(248,113,113,0.3)" }} />
          </div>
        </td>
      </tr>
    </>
  );
}

// ─── Category Manager ─────────────────────────────────────────────────────────
function CategoryManager({
  categories,
  players,
  onChange,
}: {
  categories: CategoriesData;
  players: Player[];
  onChange: (c: CategoriesData) => void;
}) {
  const [newLabel, setNewLabel] = useState("");
  const [addUidInput, setAddUidInput] = useState<Record<string, string>>({});

  const addCategory = () => {
    if (!newLabel.trim()) return;
    const id = newLabel.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const newCat: Category = { id, label: newLabel.trim(), uids: [] };
    onChange({ ...categories, custom: [...categories.custom, newCat] });
    setNewLabel("");
  };

  const deleteCategory = (id: string) => {
    onChange({ ...categories, custom: categories.custom.filter((c) => c.id !== id) });
  };

  const addUidToCategory = (catId: string) => {
    const uid = (addUidInput[catId] || "").trim();
    if (!uid || !players.find((p) => p.uid === uid)) return;
    const newCustom = categories.custom.map((c) =>
      c.id === catId ? { ...c, uids: Array.from(new Set([...c.uids, uid])) } : c
    );
    onChange({ ...categories, custom: newCustom });
    setAddUidInput((prev) => ({ ...prev, [catId]: "" }));
  };

  const removeUidFromCategory = (catId: string, uid: string) => {
    const newCustom = categories.custom.map((c) =>
      c.id === catId ? { ...c, uids: c.uids.filter((u) => u !== uid) } : c
    );
    onChange({ ...categories, custom: newCustom });
  };

  return (
    <div className="space-y-4">
      {categories.custom.map((cat) => (
        <div key={cat.id} className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm tracking-wider" style={{ color: "var(--lav-400)" }}>
              {cat.label}
              <span className="ml-2 text-xs font-body" style={{ color: "rgba(196,181,253,0.4)" }}>
                {cat.uids.length} UIDs
              </span>
            </h3>
            <button className="btn-danger text-xs" onClick={() => deleteCategory(cat.id)}>
              Delete Category
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {cat.uids.map((uid) => {
              const player = players.find((p) => p.uid === uid);
              return (
                <span key={uid}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(45,212,191,0.08)", border: "1px solid rgba(45,212,191,0.2)", color: "var(--teal-400)" }}>
                  {player ? `${player.name} (${uid})` : uid}
                  <button onClick={() => removeUidFromCategory(cat.id, uid)}
                    style={{ color: "rgba(248,113,113,0.6)", lineHeight: 1 }}>×</button>
                </span>
              );
            })}
            {cat.uids.length === 0 && (
              <span className="text-xs" style={{ color: "rgba(196,181,253,0.3)" }}>No UIDs added yet</span>
            )}
          </div>
          <div className="flex gap-2">
            <input className="edit-input" style={{ maxWidth: 200 }}
              value={addUidInput[cat.id] || ""}
              onChange={(e) => setAddUidInput((prev) => ({ ...prev, [cat.id]: e.target.value.replace(/\D/g, "") }))}
              placeholder="Add UID..."
              onKeyDown={(e) => e.key === "Enter" && addUidToCategory(cat.id)} />
            <button className="btn-ghost text-xs" onClick={() => addUidToCategory(cat.id)}>+ Add</button>
          </div>
        </div>
      ))}
      <div className="flex gap-2 items-center">
        <input className="edit-input" style={{ maxWidth: 200 }} value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)} placeholder="New category name..."
          onKeyDown={(e) => e.key === "Enter" && addCategory()} />
        <button className="btn-gold text-xs" onClick={addCategory}>+ Create Category</button>
      </div>
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [categories, setCategories] = useState<CategoriesData>({ starred: [], custom: [] });
  const [search, setSearch] = useState("");
  const [searchNotes, setSearchNotes] = useState(false);
  const [activeCategory, setActiveCategory] = useState("dated");
  const [sort, setSort] = useState<SortConfig>({ field: "date", order: "asc" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  // Use stable row index into the master players array for edit/delete identity
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [previewPlayer, setPreviewPlayer] = useState<Player | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [activeTab, setActiveTab] = useState<"players" | "categories" | "log">("players");
  const [changelog, setChangelog] = useState<any[]>([]);
  const [logLoading, setLogLoading] = useState(false);

  const isLoggedIn = !!password;

  const loadData = useCallback(async () => {
    setLoading(true);
    const [pData, cData] = await Promise.all([
      fetch("/api/players").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]);
    setPlayers(pData.players || []);
    setCategories(cData || { starred: [], custom: [] });
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isLoggedIn) loadData();
  }, [isLoggedIn, loadData]);

  const saveAll = async (updatedPlayers: Player[], updatedCats?: CategoriesData) => {
    setSaving(true);
    const cats = updatedCats ?? categories;
    await Promise.all([
      fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ players: updatedPlayers, password }),
      }),
      fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: cats, password }),
      }),
    ]);
    setSaving(false);
    setSavedMsg("Saved!");
    setTimeout(() => setSavedMsg(""), 2000);
  };

  const logChange = async (action: "add" | "edit" | "delete", uid: string, name: string, before?: Partial<Player>, after?: Partial<Player>) => {
    try {
      await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entry: { action, uid, name, before, after }, password }),
      });
    } catch {}
  };

  const loadLog = async () => {
    setLogLoading(true);
    const data = await fetch("/api/log", { cache: "no-store" }).then((r) => r.json());
    setChangelog(data || []);
    setLogLoading(false);
  };
  // We compute this once so edit/delete always hit exactly one row.
  const displayPlayersWithIndex = useMemo(() => {
    // Build a list of [masterIndex, player] so we can map display rows back to source
    const indexed = players.map((p, i) => ({ p, masterIndex: i }));

    let filtered: typeof indexed;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = indexed.filter(({ p }) => {
        const nicks = (p.nickname || "").split("|").map((n) => n.trim().toLowerCase());
        return (
          p.uid.startsWith(q) ||
          p.name.toLowerCase().includes(q) ||
          nicks.some((n) => n.includes(q)) ||
          (searchNotes && (p.note || "").toLowerCase().includes(q)) ||
          (searchNotes && (p.friendNote || "").toLowerCase().includes(q)) ||
          (searchNotes && (p.privateNote || "").toLowerCase().includes(q))
        );
      });
    } else {
      const categoryFiltered = filterByCategory(players, activeCategory, categories);
      // Re-attach master indices after category filter
      filtered = categoryFiltered.map((p) => {
        const masterIndex = indexed.findIndex(({ p: op }) => op === p);
        return { p, masterIndex };
      });
    }

    // Sort while keeping master indices intact
    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sort.field === "date") {
        const da = a.p.date ? new Date(a.p.date).getTime() : 0;
        const db = b.p.date ? new Date(b.p.date).getTime() : 0;
        cmp = da - db;
      } else if (sort.field === "name") {
        cmp = (a.p.name || "").localeCompare(b.p.name || "");
      } else if (sort.field === "uid") {
        cmp = parseInt(a.p.uid || "0") - parseInt(b.p.uid || "0");
      }
      return sort.order === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [players, search, activeCategory, categories, sort]);

  const playerCounts = useMemo(() => {
    const counts: Record<string, number> = { all: players.length };
    counts["dated"] = players.filter((p) => !!p.date).length;
    counts["undated"] = players.filter((p) => !p.date).length;
    counts["starred"] = players.filter((p) => categories.starred.includes(p.uid)).length;
    categories.custom.forEach((c) => {
      counts[c.id] = players.filter((p) => c.uids.includes(p.uid)).length;
    });
    return counts;
  }, [players, categories]);

  // Update exactly the row at masterIndex
  const updatePlayer = (masterIndex: number, updated: Player) => {
    const before = players[masterIndex];
    const newPlayers = players.map((p, i) => (i === masterIndex ? updated : p));
    setPlayers(newPlayers);
    setEditingIndex(null);
    saveAll(newPlayers);
    logChange("edit", updated.uid, updated.name, before, updated);
  };

  // Delete exactly one row by masterIndex — safe even with duplicate UIDs
  const deletePlayer = (masterIndex: number, uid: string) => {
    if (!confirm(`Delete entry for UID ${uid}?`)) return;
    const before = players[masterIndex];
    const newPlayers = players.filter((_, i) => i !== masterIndex);
    setPlayers(newPlayers);
    setEditingIndex(null);
    saveAll(newPlayers);
    logChange("delete", uid, before.name, before);
  };

  const addPlayer = (p: Player) => {
    if (!p.uid) return;
    if (players.some((x) => x.uid === p.uid)) {
      setSavedMsg(`⚠ UID ${p.uid} already exists`);
      setTimeout(() => setSavedMsg(""), 3000);
      return;
    }
    const newPlayers = [...players, p];
    setPlayers(newPlayers);
    setAddingNew(false);
    saveAll(newPlayers);
    logChange("add", p.uid, p.name, undefined, p);
  };

  const handleCategoriesChange = (newCats: CategoriesData) => {
    setCategories(newCats);
    saveAll(players, newCats);
  };

  const toggleStar = (uid: string) => {
    const newStarred = categories.starred.includes(uid)
      ? categories.starred.filter((s) => s !== uid)
      : [...categories.starred, uid];
    handleCategoriesChange({ ...categories, starred: newStarred });
  };

  if (!isLoggedIn) return <LoginGate onLogin={setPassword} />;

  const blankPlayer: Player = { file: "", name: "", nickname: "", uid: "" };

  return (
    <div className="min-h-screen relative z-10">
      {/* Header */}
      <header className="pt-6 pb-5 px-4 sm:pt-10 sm:pb-6 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-display text-xl sm:text-2xl tracking-widest" style={{ color: "var(--lav-300)" }}>
              Admin Panel
            </h1>
            <p className="text-xs tracking-widest uppercase mt-0.5" style={{ color: "rgba(196,181,253,0.35)" }}>
              Celestial Archive · Management
            </p>
          </div>
          <div className="flex items-center gap-3">
            {savedMsg && (
              <span className="text-xs px-3 py-1 rounded-full" style={
                savedMsg.startsWith("⚠")
                  ? { background: "rgba(248,113,113,0.1)", color: "rgb(248,113,113)", border: "1px solid rgba(248,113,113,0.3)" }
                  : { background: "rgba(167,139,250,0.1)", color: "var(--teal-400)", border: "1px solid rgba(167,139,250,0.3)" }
              }>
                {savedMsg}
              </span>
            )}
            {saving && (
              <span className="text-xs animate-shimmer" style={{ color: "rgba(196,181,253,0.5)" }}>
                Saving...
              </span>
            )}
            <a href="/" className="btn-ghost text-xs">← Public View</a>
          </div>
        </div>
        <div className="divider-gold max-w-7xl mx-auto mt-4" />
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 pb-20">
        {/* Tabs */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <button onClick={() => setActiveTab("players")}
            className={`cat-pill capitalize ${activeTab === "players" ? "cat-pill-active" : "cat-pill-inactive"}`}>
            Players ({players.length})
          </button>
          <button onClick={() => setActiveTab("categories")}
            className={`cat-pill capitalize ${activeTab === "categories" ? "cat-pill-active" : "cat-pill-inactive"}`}>
            Categories
          </button>
          <button onClick={() => { setActiveTab("log"); loadLog(); }}
            className={`cat-pill capitalize ${activeTab === "log" ? "cat-pill-active" : "cat-pill-inactive"}`}>
            Change Log
          </button>
        </div>

        {/* ── PLAYERS TAB ── */}
        {activeTab === "players" && (
          <>
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-5 items-start sm:items-end justify-between flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <AdminSearchBox value={search} onValueChange={setSearch} />
                {search && (
                  <button
                    onClick={() => setSearchNotes((v) => !v)}
                    className={`cat-pill text-xs ${searchNotes ? "cat-pill-active" : "cat-pill-inactive"}`}
                    title={searchNotes ? "Excluding notes from search" : "Click to also search notes"}
                  >
                    {searchNotes ? "✦ Notes" : "Notes"}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <SortControls sort={sort} onChange={setSort} />
                {!addingNew && (
                  <button className="btn-gold text-xs" onClick={() => setAddingNew(true)}>+ Add Entry</button>
                )}
              </div>
            </div>

            {/* Category bar */}
            {!search && (
              <div className="mb-5">
                <CategoryBar categories={categories} active={activeCategory}
                  onChange={setActiveCategory} playerCounts={playerCounts} />
              </div>
            )}

            <p className="text-xs mb-4" style={{ color: "rgba(196,181,253,0.4)" }}>
              {displayPlayersWithIndex.length} entr{displayPlayersWithIndex.length !== 1 ? "ies" : "y"} shown
              {search && <span style={{ color: "rgba(196,181,253,0.3)" }}> · searching</span>}
            </p>

            {/* ── MOBILE (< md) ── */}
            <div className="md:hidden space-y-3">
              {addingNew && (
                <div className="glass rounded-xl overflow-hidden">
                  <table className="admin-table w-full"><tbody>
                    <EditableRow player={blankPlayer} onSave={addPlayer} onCancel={() => setAddingNew(false)} isNew />
                  </tbody></table>
                </div>
              )}
              {loading ? (
                <div className="text-center py-10 animate-shimmer text-sm" style={{ color: "rgba(196,181,253,0.4)" }}>Loading...</div>
              ) : displayPlayersWithIndex.length === 0 ? (
                <div className="text-center py-10 text-sm" style={{ color: "rgba(196,181,253,0.3)" }}>No entries found</div>
              ) : (
                displayPlayersWithIndex.map(({ p, masterIndex }) =>
                  editingIndex === masterIndex ? (
                    <div key={masterIndex} className="glass rounded-xl overflow-hidden">
                      <table className="admin-table w-full"><tbody>
                        <EditableRow player={p}
                          onSave={(updated) => updatePlayer(masterIndex, updated)}
                          onDelete={() => deletePlayer(masterIndex, p.uid)}
                          onCancel={() => setEditingIndex(null)} />
                      </tbody></table>
                    </div>
                  ) : (
                    <div key={masterIndex}
                      className={`glass-gold rounded-xl p-4 ${(p.note?.trim() || p.friendNote?.trim() || p.privateNote?.trim()) ? "cursor-pointer" : ""}`}
                      onClick={() => (p.note?.trim() || p.friendNote?.trim() || p.privateNote?.trim()) && setPreviewPlayer(p)}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-display text-base font-semibold" style={{ color: "var(--lav-300)" }}>{p.name}</span>
                            {p.note?.trim() && <div className="note-dot" style={{ background: "var(--teal-400)" }} />}
                            {!p.note?.trim() && p.friendNote?.trim() && <div className="note-dot" style={{ background: "#7dd3fc" }} />}
                            {!p.note?.trim() && !p.friendNote?.trim() && p.privateNote?.trim() && <div className="note-dot" style={{ background: "rgba(248,113,113,0.9)" }} />}
                            {categories.starred.includes(p.uid) && <span style={{ color: "var(--lav-400)", fontSize: "0.8rem" }}>★</span>}
                          </div>
                          {splitNicknames(p.nickname).length > 0 && <p className="text-sm mt-0.5" style={{ color: "rgba(196,181,253,0.5)", fontStyle: "italic" }}>{splitNicknames(p.nickname).join(", ")}</p>}
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          <StarBtn isStarred={categories.starred.includes(p.uid)} onToggle={() => toggleStar(p.uid)} />
                        </div>
                      </div>
                      <div className="divider-gold my-2.5" />
                      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                        <span className="uid-badge">UID {p.uid}</span>
                        {p.date && <span className="text-xs" style={{ color: "rgba(94,234,212,0.55)" }}>{formatDate(p.date)}</span>}
                      </div>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button className="btn-ghost text-xs px-3 py-1.5 flex-1" onClick={() => setEditingIndex(masterIndex)}>Edit</button>
                        <button className="btn-danger text-xs px-3 py-1.5 flex-1" onClick={() => deletePlayer(masterIndex, p.uid)}>Delete</button>
                      </div>
                    </div>
                  )
                )
              )}
            </div>

            {/* ── DESKTOP TABLE (≥ md) ── */}
            <div className="hidden md:block glass rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="admin-table w-full">
                  <thead>
                    <tr>
                      <th style={{ width: "28%" }}>File / Date</th>
                      <th style={{ width: "18%" }}>Name</th>
                      <th style={{ width: "13%" }}>Nickname</th>
                      <th style={{ width: "13%" }}>UID</th>
                      <th style={{ width: "5%", textAlign: "center" }}>★</th>
                      <th style={{ width: "23%" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {addingNew && (
                      <EditableRow player={blankPlayer} onSave={addPlayer} onCancel={() => setAddingNew(false)} isNew />
                    )}
                    {loading ? (
                      <tr><td colSpan={6} className="text-center py-10">
                        <span className="animate-shimmer text-xs" style={{ color: "rgba(196,181,253,0.4)" }}>Loading...</span>
                      </td></tr>
                    ) : displayPlayersWithIndex.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-10 text-xs" style={{ color: "rgba(196,181,253,0.3)" }}>No entries found</td></tr>
                    ) : (
                      displayPlayersWithIndex.map(({ p, masterIndex }) =>
                        editingIndex === masterIndex ? (
                          <EditableRow key={masterIndex} player={p}
                            onSave={(updated) => updatePlayer(masterIndex, updated)}
                            onDelete={() => deletePlayer(masterIndex, p.uid)}
                            onCancel={() => setEditingIndex(null)} />
                        ) : (
                          <tr key={masterIndex}
                            onClick={() => (p.note?.trim() || p.friendNote?.trim() || p.privateNote?.trim()) && setPreviewPlayer(p)}
                            style={{ cursor: (p.note?.trim() || p.friendNote?.trim() || p.privateNote?.trim()) ? "pointer" : "default" }}>
                            <td>
                              <p style={{ color: "rgba(196,181,253,0.5)", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.file}>{p.file}</p>
                              {p.date && <p className="text-xs mt-0.5" style={{ color: "rgba(94,234,212,0.6)" }}>{formatDate(p.date)}</p>}
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <span style={{ color: "var(--lav-300)", fontWeight: 500 }}>{p.name}</span>
                                {p.note?.trim() && <div className="note-dot" style={{ background: "var(--teal-400)" }} />}
                                {!p.note?.trim() && p.friendNote?.trim() && <div className="note-dot" style={{ background: "#7dd3fc" }} />}
                                {!p.note?.trim() && !p.friendNote?.trim() && p.privateNote?.trim() && <div className="note-dot" style={{ background: "rgba(248,113,113,0.9)" }} />}
                              </div>
                            </td>
                            <td>
                              {(() => {
                                const nicks = splitNicknames(p.nickname);
                                return nicks.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {nicks.map((n) => (
                                      <span key={n} className="text-xs px-1.5 py-0.5 rounded"
                                        style={{ background: "rgba(200,169,110,0.08)", color: "rgba(200,169,110,0.55)", fontStyle: "italic" }}>{n}</span>
                                    ))}
                                  </div>
                                ) : <span style={{ opacity: 0.3 }}>—</span>;
                              })()}
                            </td>
                            <td><span className="uid-badge">{p.uid}</span></td>
                            <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                              <StarBtn isStarred={categories.starred.includes(p.uid)} onToggle={() => toggleStar(p.uid)} />
                            </td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <div className="flex gap-2">
                                <button className="btn-ghost text-xs px-3 py-1" onClick={() => setEditingIndex(masterIndex)}>Edit</button>
                                <button className="btn-danger text-xs px-3 py-1" onClick={() => deletePlayer(masterIndex, p.uid)}>Del</button>
                              </div>
                            </td>
                          </tr>
                        )
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}


        {/* ── CATEGORIES TAB ── */}
        {activeTab === "categories" && (
          <div className="max-w-2xl">
            <div className="mb-6">
              <p className="text-sm mb-1" style={{ color: "rgba(196,181,253,0.6)" }}>Starred</p>
              <p className="text-xs" style={{ color: "rgba(196,181,253,0.3)" }}>
                {categories.starred.length} traveler{categories.starred.length !== 1 ? "s" : ""} starred.
                Toggle stars from the public page or search results.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {categories.starred.map((uid) => {
                  const player = players.find((p) => p.uid === uid);
                  return (
                    <span key={uid}
                      className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5"
                      style={{ background: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.2)", color: "var(--lav-400)" }}>
                      ★ {player ? `${player.name} (${uid})` : uid}
                      <button
                        onClick={() => {
                          const newCats = { ...categories, starred: categories.starred.filter((s) => s !== uid) };
                          handleCategoriesChange(newCats);
                        }}
                        style={{ color: "rgba(248,113,113,0.6)", lineHeight: 1 }}>×</button>
                    </span>
                  );
                })}
                {categories.starred.length === 0 && (
                  <span className="text-xs" style={{ color: "rgba(196,181,253,0.25)" }}>None starred yet</span>
                )}
              </div>
            </div>
            <div className="divider-gold mb-6" />
            <p className="text-sm mb-4" style={{ color: "rgba(196,181,253,0.6)" }}>Custom Categories</p>
            <CategoryManager categories={categories} players={players} onChange={handleCategoriesChange} />
          </div>
        )}

        {/* ── LOG TAB ── */}
        {activeTab === "log" && (
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <p className="text-sm" style={{ color: "rgba(196,181,253,0.5)" }}>
                Last {changelog.length} changes · auto-saved on every add / edit / delete
              </p>
              <button className="btn-ghost text-xs" onClick={loadLog}>↻ Refresh</button>
            </div>

            {logLoading ? (
              <div className="text-center py-10 animate-shimmer text-sm" style={{ color: "rgba(196,181,253,0.4)" }}>
                Loading...
              </div>
            ) : changelog.length === 0 ? (
              <div className="text-center py-16 text-sm" style={{ color: "rgba(196,181,253,0.25)", fontFamily: "'Cinzel', serif", letterSpacing: "0.08em" }}>
                No changes recorded yet
              </div>
            ) : (
              <div className="space-y-2">
                {changelog.map((entry: any) => {
                  const actionColor = entry.action === "add"
                    ? "rgba(45,212,191,0.7)"
                    : entry.action === "delete"
                    ? "rgba(248,113,113,0.7)"
                    : "rgba(200,169,110,0.6)";
                  const actionBg = entry.action === "add"
                    ? "rgba(45,212,191,0.06)"
                    : entry.action === "delete"
                    ? "rgba(248,113,113,0.06)"
                    : "rgba(200,169,110,0.04)";

                  return (
                    <div key={entry.id} className="glass rounded-xl px-4 py-3 flex items-start gap-4 flex-wrap"
                      style={{ background: actionBg, border: `1px solid ${actionColor.replace("0.7", "0.15")}` }}>

                      {/* Action badge */}
                      <span className="flex-shrink-0 text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                        style={{ color: actionColor, background: actionColor.replace("0.7", "0.1"), fontFamily: "'Cinzel', serif", minWidth: 52, textAlign: "center" }}>
                        {entry.action}
                      </span>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span style={{ color: "var(--lav-300)", fontWeight: 600, fontSize: "0.95rem" }}>
                            {entry.name || "Unknown"}
                          </span>
                          <span className="uid-badge" style={{ fontSize: "0.78rem" }}>
                            UID {entry.uid}
                          </span>
                        </div>

                        {/* Edit diff */}
                        {entry.action === "edit" && entry.before && entry.after && (
                          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                            {(["name", "nickname", "uid", "note", "privateNote", "file"] as const).map((field) => {
                              const before = (entry.before as any)[field];
                              const after = (entry.after as any)[field];
                              if (before === after || (!before && !after)) return null;
                              return (
                                <span key={field} className="text-xs" style={{ color: "rgba(200,169,110,0.45)" }}>
                                  <span style={{ opacity: 0.6 }}>{field}:</span>{" "}
                                  <span style={{ color: "rgba(248,113,113,0.7)", textDecoration: "line-through" }}>
                                    {String(before || "—").slice(0, 30)}
                                  </span>
                                  {" → "}
                                  <span style={{ color: "rgba(45,212,191,0.7)" }}>
                                    {String(after || "—").slice(0, 30)}
                                  </span>
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Timestamp + restore */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-xs" style={{ color: "rgba(196,181,253,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                        {entry.action === "delete" && entry.before && (
                          <button
                            className="btn-ghost text-xs px-2 py-1"
                            style={{ borderColor: "rgba(45,212,191,0.3)", color: "rgba(45,212,191,0.6)" }}
                            onClick={async () => {
                              if (!confirm(`Restore ${entry.name} (UID ${entry.uid})?`)) return;
                              const restoredPlayer = entry.before as Player;
                              const newPlayers = [...players, restoredPlayer];
                              setPlayers(newPlayers);
                              await saveAll(newPlayers);
                              await logChange("add", restoredPlayer.uid, restoredPlayer.name, undefined, restoredPlayer);
                              await loadLog();
                            }}>
                            ↩ Restore
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Player preview modal */}
      {previewPlayer && (
        <PlayerModal player={previewPlayer} onClose={() => setPreviewPlayer(null)} viewLevel="admin" />
      )}
    </div>
  );
}