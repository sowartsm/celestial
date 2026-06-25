"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import type { Player, CategoriesData, SortConfig, Category } from "@/lib/types";
import { splitNicknames, joinNicknames } from "@/lib/types";
import { filterByCategory, sortPlayers, parseDateFromFilename, formatDate } from "@/lib/utils";
import CategoryBar from "@/components/CategoryBar";
import SortControls from "@/components/SortControls";
import { PlayerModal } from "@/components/PlayerCard";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "larry78";

const toTitleCase = (str: string) =>
  str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

// ─── Star Button ──────────────────────────────────────────────────────────────
function StarBtn({ isStarred, onToggle }: { isStarred: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`star-btn ${isStarred ? "active" : ""}`}
      title={isStarred ? "Remove from starred" : "Add to starred"}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
        fill={isStarred ? "currentColor" : "none"} stroke="currentColor"
        strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    </button>
  );
}

// ─── Relationship Badge ───────────────────────────────────────────────────────
function RelBadge({ rel }: { rel?: string }) {
  if (!rel) return null;
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full inline-block"
      style={{
        color: "rgba(167,139,250,0.9)",
        background: "rgba(167,139,250,0.1)",
        border: "1px solid rgba(167,139,250,0.3)",
        fontFamily: "'Cinzel', serif",
        letterSpacing: "0.05em",
        fontSize: "0.65rem",
        whiteSpace: "nowrap",
      }}
    >
      {rel.toUpperCase()}
    </span>
  );
}

// ─── Login Gate ───────────────────────────────────────────────────────────────
function LoginGate({ onLogin }: { onLogin: (pw: string) => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const attempt = () => {
    if (pw === ADMIN_PASSWORD) { onLogin(pw); }
    else { setError(true); setTimeout(() => setError(false), 1500); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-gold rounded-2xl p-10 w-full max-w-sm text-center"
        style={{ border: "1px solid rgba(200,169,110,0.3)" }}>
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
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && attempt()}
          placeholder="Enter password" className="edit-input text-center mb-4 py-3"
          style={{ borderColor: error ? "rgba(248,113,113,0.6)" : undefined, fontSize: "1rem" }} />
        {error && <p className="text-xs mb-3" style={{ color: "rgba(248,113,113,0.8)" }}>Incorrect password</p>}
        <button className="btn-gold w-full py-3" onClick={attempt}>Enter</button>
        <div className="mt-6">
          <a href="/" className="text-xs" style={{ color: "rgba(196,181,253,0.35)" }}>← Back to Registry</a>
        </div>
      </div>
    </div>
  );
}

// ─── Search Box ───────────────────────────────────────────────────────────────
function AdminSearchBox({ value, onValueChange, inputRef }: { value: string; onValueChange: (v: string) => void; inputRef?: React.RefObject<HTMLInputElement> }) {
  return (
    <div className="relative flex items-center w-full max-w-md">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
        strokeWidth={1.5} stroke="currentColor"
        className="absolute left-4 w-4 h-4 pointer-events-none"
        style={{ color: "rgba(196,181,253,0.4)" }}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
      <input ref={inputRef} type="text" value={value} onChange={(e) => onValueChange(e.target.value)}
        placeholder="Search UID / name..."
        className="search-input w-full rounded-xl py-3"
        style={{ fontSize: "1rem", letterSpacing: "0.02em", paddingLeft: "2.5rem", paddingRight: "2.5rem", textAlign: "left" }} />
      {value && (
        <button className="absolute right-4" style={{ color: "rgba(196,181,253,0.4)" }} onClick={() => onValueChange("")}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ─── Nickname Editor ──────────────────────────────────────────────────────────
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
      <div className="flex flex-wrap gap-1 mb-1.5">
        {nicks.map((n) => (
          <span key={n} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
            style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.25)", color: "rgba(200,169,110,0.8)" }}>
            {n}
            <button onClick={() => remove(n)} style={{ color: "rgba(248,113,113,0.7)", lineHeight: 1, fontSize: "0.9rem" }}>×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        <input className="edit-input" value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Add nickname…" style={{ fontSize: "0.82rem" }} />
        <button className="btn-ghost text-xs px-2 flex-shrink-0" onClick={add}>+</button>
      </div>
    </div>
  );
}

// ─── Tag Editor ──────────────────────────────────────────────────────────────
function TagEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const tags = (value || "").split("|").map(t => t.trim()).filter(Boolean);
  const [input, setInput] = useState("");
  const add = () => {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed || tags.includes(trimmed)) return;
    onChange([...tags, trimmed].join("|"));
    setInput("");
  };
  const remove = (t: string) => onChange(tags.filter(x => x !== t).join("|"));
  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-1.5">
        {tags.map((t) => (
          <span key={t} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
            style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)", color: "rgba(167,139,250,0.8)" }}>
            {t}
            <button onClick={() => remove(t)} style={{ color: "rgba(248,113,113,0.7)", lineHeight: 1, fontSize: "0.9rem" }}>×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        <input className="edit-input" value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Add tag… (male, whale, active…)" style={{ fontSize: "0.82rem" }} />
        <button className="btn-ghost text-xs px-2 flex-shrink-0" onClick={add}>+</button>
      </div>
    </div>
  );
}

// ─── Editable Row ─────────────────────────────────────────────────────────────
function EditableRow({
  player, onSave, onDelete, onCancel, isNew = false, selectMode = false, allRelationships = [],
}: {
  player: Player; onSave: (p: Player) => void;
  onDelete?: () => void; onCancel?: () => void; isNew?: boolean; selectMode?: boolean; allRelationships?: string[];
}) {
  const [draft, setDraft] = useState<Player>({ ...player });
  const set = <K extends keyof Player>(k: K, v: Player[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const [dateVal, setDateVal] = useState(() => {
    if (!player.date) return "";
    const d = new Date(player.date);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
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

  return (
    <>
      <tr style={{ background: "rgba(200,169,110,0.04)" }}>
        <td colSpan={selectMode ? 9 : 8} style={{ padding: "0.75rem 1rem" }}>
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
            {/* Field label helper */}

            {/* Date/Time + filename */}
            <div style={{ minWidth: 140 }}>
              <p style={{ fontSize: "0.65rem", color: "rgba(167,139,250,0.45)", fontFamily: "'Cinzel', serif", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: "0.3rem" }}>Date / Time</p>
              <input type="date" className="edit-input mb-1.5" value={dateVal}
                onChange={(e) => handleDateChange(e.target.value)}
                style={{ colorScheme: "dark", fontSize: "0.82rem", width: "100%" }} />
              <input type="time" className="edit-input" value={timeVal}
                onChange={(e) => handleTimeChange(e.target.value)}
                style={{ colorScheme: "dark", fontSize: "0.82rem", width: "100%" }} />
              {draft.file && (
                <p style={{ color: "rgba(196,181,253,0.4)", fontSize: "0.65rem", fontFamily: "'JetBrains Mono', monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: "0.35rem" }} title={draft.file}>
                  {draft.file}
                </p>
              )}
            </div>

            {/* Name + Game ID */}
            <div>
              <p style={{ fontSize: "0.65rem", color: "rgba(167,139,250,0.45)", fontFamily: "'Cinzel', serif", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: "0.3rem" }}>Name</p>
              <input className="edit-input mb-1.5" value={draft.name}
                onChange={(e) => set("name", e.target.value)} placeholder="Name" />
              <input className="edit-input" value={draft.gameId || ""}
                onChange={(e) => set("gameId", e.target.value)} placeholder="Game ID (if different)"
                style={{ fontSize: "0.78rem", opacity: 0.7 }} />
            </div>

            {/* Nicknames */}
            <div>
              <p style={{ fontSize: "0.65rem", color: "rgba(167,139,250,0.45)", fontFamily: "'Cinzel', serif", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: "0.3rem" }}>Nicknames</p>
              <NicknameEditor value={draft.nickname} onChange={(v) => set("nickname", v)} />
            </div>

            {/* UID */}
            <div>
              <p style={{ fontSize: "0.65rem", color: "rgba(167,139,250,0.45)", fontFamily: "'Cinzel', serif", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: "0.3rem" }}>UID</p>
              <input className="edit-input" value={draft.uid}
                onChange={(e) => set("uid", e.target.value.replace(/\D/g, ""))}
                placeholder="UID" style={{ fontFamily: "'JetBrains Mono', monospace" }} />
            </div>

            {/* Origin */}
            <div>
              <p style={{ fontSize: "0.65rem", color: "rgba(167,139,250,0.45)", fontFamily: "'Cinzel', serif", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: "0.3rem" }}>Origin</p>
              <input className="edit-input" value={draft.origin || ""}
                onChange={(e) => set("origin", e.target.value)}
                onBlur={(e) => e.target.value && set("origin", toTitleCase(e.target.value))}
                placeholder="Origin / country"
                style={{ fontSize: "0.85rem" }} />
            </div>

            {/* Relationship - dropdown of existing values + freeform new */}
            <div>
              <p style={{ fontSize: "0.65rem", color: "rgba(167,139,250,0.45)", fontFamily: "'Cinzel', serif", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: "0.3rem" }}>Relationship</p>
              <select
                className="edit-input mb-1.5"
                value={allRelationships.includes(draft.relationship || "") ? draft.relationship : (draft.relationship ? "__custom__" : "")}
                onChange={(e) => {
                  if (e.target.value === "__custom__") return;
                  set("relationship", (e.target.value || undefined) as any);
                }}
                style={{ fontSize: "0.85rem", cursor: "pointer" }}
              >
                <option value="">— none —</option>
                {allRelationships.map(r => <option key={r} value={r}>{r}</option>)}
                {draft.relationship && !allRelationships.includes(draft.relationship) && (
                  <option value="__custom__">{draft.relationship} (custom)</option>
                )}
              </select>
              <input className="edit-input" value={draft.relationship || ""}
                onChange={(e) => set("relationship", (e.target.value || undefined) as any)}
                placeholder="or type new…"
                style={{ fontSize: "0.78rem", opacity: 0.7 }} />
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap items-start content-start">
              <p style={{ fontSize: "0.65rem", color: "rgba(167,139,250,0.45)", fontFamily: "'Cinzel', serif", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: "0.3rem", width: "100%" }}>Actions</p>
              <button className="btn-gold text-xs px-3 py-1.5" onClick={() => onSave(draft)}>
                {isNew ? "Add" : "Save"}
              </button>
              {onCancel && <button className="btn-ghost text-xs px-3 py-1.5" onClick={onCancel}>Cancel</button>}
              {onDelete && <button className="btn-danger text-xs px-3 py-1.5" onClick={onDelete}>Delete</button>}
            </div>
          </div>
        </td>
      </tr>
      {/* Tags row */}
      <tr style={{ background: "rgba(167,139,250,0.02)" }}>
        <td colSpan={selectMode ? 9 : 8} style={{ paddingTop: "0.25rem", paddingBottom: "0.25rem" }}>
          <div className="flex items-start gap-2">
            <span className="text-xs mt-2 flex-shrink-0"
              style={{ color: "rgba(167,139,250,0.5)", fontFamily: "'Cinzel', serif", letterSpacing: "0.08em", minWidth: 95 }}>
              Tags
            </span>
            <TagEditor value={draft.tags || ""} onChange={(v) => set("tags", v)} />
          </div>
        </td>
      </tr>
      {/* Notes rows */}
      {(["note", "friendNote", "privateNote"] as const).map((field) => {
        const colors: Record<string, { label: string; color: string; border: string }> = {
          note: { label: "Public Note", color: "rgba(94,234,212,0.5)", border: "rgba(94,234,212,0.2)" },
          friendNote: { label: "Friends Note", color: "rgba(125,211,252,0.5)", border: "rgba(125,211,252,0.3)" },
          privateNote: { label: "Private Note", color: "rgba(248,113,113,0.5)", border: "rgba(248,113,113,0.3)" },
        };
        const c = colors[field];
        return (
          <tr key={field} style={{ background: "rgba(200,169,110,0.02)" }}>
            <td colSpan={selectMode ? 9 : 8} style={{ paddingTop: "0.25rem", paddingBottom: field === "privateNote" ? "0.75rem" : "0.25rem" }}>
              <div className="flex items-start gap-2">
                <span className="text-xs mt-2 flex-shrink-0"
                  style={{ color: c.color, fontFamily: "'Cinzel', serif", letterSpacing: "0.08em", minWidth: 95 }}>
                  {c.label}
                </span>
                <textarea className="note-textarea flex-1" value={draft[field] || ""}
                  onChange={(e) => set(field, e.target.value)}
                  placeholder={field === "note" ? "Visible to everyone..." : field === "friendNote" ? "Visible to friends + admin..." : "Admin only — never shown publicly..."}
                  rows={2} style={{ borderColor: c.border }} />
              </div>
            </td>
          </tr>
        );
      })}
    </>
  );
}

// ─── Bulk Action Bar ──────────────────────────────────────────────────────────
function BulkActionBar({
  count, categories, players, selectedUids, allTags, allRelationships, allOrigins,
  onMoveToCategory, onStar, onClear, onApplyTag, onApplyRelationship, onApplyOrigin,
}: {
  count: number;
  categories: CategoriesData;
  players: Player[];
  selectedUids: Set<string>;
  allTags: string[];
  allRelationships: string[];
  allOrigins: string[];
  onMoveToCategory: (catId: string) => void;
  onStar: () => void;
  onClear: () => void;
  onApplyTag: (tag: string) => void;
  onApplyRelationship: (rel: string) => void;
  onApplyOrigin: (origin: string) => void;
}) {
  const [moveTarget, setMoveTarget] = useState("");
  const [newValueInput, setNewValueInput] = useState("");

  if (count === 0) return null;

  const allOptions = [
    { id: "starred", label: "★ Starred", group: "category" as const },
    ...categories.custom.map((c) => ({ id: c.id, label: c.label, group: "category" as const })),
    ...allTags.map((t) => ({ id: `tag:${t}`, label: `# ${t}`, group: "tag" as const })),
    ...allRelationships.map((r) => ({ id: `rel:${r}`, label: `◆ ${r}`, group: "relationship" as const })),
    ...allOrigins.map((o) => ({ id: `origin:${o}`, label: `@ ${o}`, group: "origin" as const })),
  ];

  const applyMoveTarget = (target: string) => {
    if (target.startsWith("tag:")) {
      onApplyTag(target.slice(4));
    } else if (target.startsWith("rel:")) {
      onApplyRelationship(target.slice(4));
    } else if (target.startsWith("origin:")) {
      onApplyOrigin(target.slice(7));
    } else {
      onMoveToCategory(target);
    }
  };

  const applyNewValue = (kind: "tag" | "relationship" | "origin") => {
    const v = newValueInput.trim();
    if (!v) return;
    if (kind === "tag") onApplyTag(v.toLowerCase());
    else if (kind === "relationship") onApplyRelationship(v.toLowerCase());
    else onApplyOrigin(v);
    setNewValueInput("");
  };

  return (
    <div
      className="fixed bottom-6 left-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl flex-wrap"
      style={{
        transform: "translateX(-50%)",
        background: "rgba(18,15,28,0.95)",
        border: "1px solid rgba(167,139,250,0.3)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        backdropFilter: "blur(12px)",
      }}
    >
      <span className="text-xs font-bold" style={{ color: "var(--lav-300)", fontFamily: "'Cinzel', serif", letterSpacing: "0.08em" }}>
        {count} selected
      </span>
      <div className="w-px h-4" style={{ background: "rgba(196,181,253,0.2)" }} />
      <button className="btn-ghost text-xs px-3 py-1.5" onClick={onStar}>
        ★ Toggle Star
      </button>
      <div className="flex items-center gap-1.5">
        <select
          className="edit-input text-xs"
          value={moveTarget}
          onChange={(e) => setMoveTarget(e.target.value)}
          style={{ fontSize: "0.78rem", minWidth: 150 }}
        >
          <option value="">Move to / Tag as…</option>
          {allOptions.length === 0 && <option disabled>— nothing yet —</option>}
          {allOptions.map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
        {moveTarget && (
          <button
            className="btn-gold text-xs px-3 py-1.5"
            onClick={() => { applyMoveTarget(moveTarget); setMoveTarget(""); }}
          >
            Apply
          </button>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <input className="edit-input text-xs" placeholder="new tag/relationship…"
          value={newValueInput}
          onChange={(e) => setNewValueInput(e.target.value)}
          style={{ fontSize: "0.78rem", maxWidth: 140 }} />
        {newValueInput.trim() && (
          <>
            <button className="btn-ghost text-xs px-2 py-1.5" onClick={() => applyNewValue("tag")}>as # Tag</button>
            <button className="btn-ghost text-xs px-2 py-1.5" onClick={() => applyNewValue("relationship")}>as ◆ Rel</button>
            <button className="btn-ghost text-xs px-2 py-1.5" onClick={() => applyNewValue("origin")}>as @ Origin</button>
          </>
        )}
      </div>
      <div className="w-px h-4" style={{ background: "rgba(196,181,253,0.2)" }} />
      <button onClick={onClear} style={{ color: "rgba(196,181,253,0.4)", fontSize: "0.75rem" }}>
        ✕ Clear
      </button>
    </div>
  );
}

// ─── Category Manager ─────────────────────────────────────────────────────────
function CategoryManager({
  categories, players, onChange,
}: {
  categories: CategoriesData; players: Player[]; onChange: (c: CategoriesData) => void;
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

  const deleteCategory = (id: string) =>
    onChange({ ...categories, custom: categories.custom.filter((c) => c.id !== id) });

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
            <button className="btn-danger text-xs" onClick={() => deleteCategory(cat.id)}>Delete</button>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {cat.uids.map((uid) => {
              const player = players.find((p) => p.uid === uid);
              return (
                <span key={uid} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
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
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeOriginFilter, setActiveOriginFilter] = useState<string | null>(null);
  const [activeRelFilter, setActiveRelFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<SortConfig>({ field: "date", order: "asc" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [previewPlayer, setPreviewPlayer] = useState<Player | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [activeTab, setActiveTab] = useState<"players" | "categories" | "log">("players");
  const [changelog, setChangelog] = useState<any[]>([]);
  const [logLoading, setLogLoading] = useState(false);

  // Bulk selection
  const [selectedUids, setSelectedUids] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [tagMode, setTagMode] = useState(false);
  const [taggingTarget, setTaggingTarget] = useState<"tags" | "relationship">("tags");
  const [activeTagging, setActiveTagging] = useState<string>("");
  const [newTagInput, setNewTagInput] = useState("");

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

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn) return;

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT";

      // Ctrl/Cmd + E → focus search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "e") {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // Ctrl/Cmd + S → toggle select mode
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        setSelectMode((prev) => {
          if (prev) { setSelectedUids(new Set()); return false; }
          return true;
        });
        return;
      }

      // Ctrl/Cmd + T → toggle tag mode
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "t") {
        e.preventDefault();
        setTagMode((prev) => {
          if (prev) {
            setTaggingTarget("tags");
            setActiveTagging("");
            setNewTagInput("");
            return false;
          }
          return true;
        });
        return;
      }

      // Escape → exit select/tag mode or clear search/blur
      if (e.key === "Escape") {
        if (tagMode) { exitTagMode(); return; }
        if (selectMode) { exitSelectMode(); return; }
        if (isTyping) { (target as HTMLInputElement).blur(); return; }
        if (search) { setSearch(""); return; }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isLoggedIn, tagMode, selectMode, search]);

  const savePlayer = async (action: "insert" | "update" | "delete", player: Player) => {
    const res = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, player, password }),
    });
    if (!res.ok) throw new Error("Save failed");
  };

  const saveCategories = async (cats: CategoriesData) => {
    setSaving(true);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categories: cats, password }),
    });
    setSaving(false);
    if (res.ok) {
      setSavedMsg("Saved!");
    } else {
      setSavedMsg("⚠ Save failed");
    }
    setTimeout(() => setSavedMsg(""), 2000);
  };

  const logChange = async (
    action: "add" | "edit" | "delete",
    uid: string, name: string,
    before?: Partial<Player>, after?: Partial<Player>
  ) => {
    try {
      await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entry: { action, uid, name, before, after }, password }),
      });
    } catch { }
  };

  const loadLog = async () => {
    setLogLoading(true);
    const data = await fetch("/api/log", { cache: "no-store" }).then((r) => r.json());
    setChangelog(data || []);
    setLogLoading(false);
  };

  // ── Filtering + Sorting ─────────────────────────────────────────────────────
  const displayPlayersWithIndex = useMemo(() => {
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
          (p.gameId || "").toLowerCase().includes(q) ||
          (p.origin || "").toLowerCase().includes(q) ||
          (searchNotes && (p.note || "").toLowerCase().includes(q)) ||
          (searchNotes && (p.friendNote || "").toLowerCase().includes(q)) ||
          (searchNotes && (p.privateNote || "").toLowerCase().includes(q))
        );
      });
    } else {
      const categoryFiltered = filterByCategory(players, activeCategory, categories);
      filtered = categoryFiltered.map((p) => ({
        p,
        masterIndex: indexed.findIndex(({ p: op }) => op === p),
      }));
    }

    // Tag filter
    if (activeTag) {
      filtered = filtered.filter(({ p }) =>
        (p.tags || "").split("|").map(t => t.trim()).includes(activeTag)
      );
    }

    // Origin filter (case-insensitive)
    if (activeOriginFilter) {
      filtered = filtered.filter(({ p }) =>
        (p.origin || "").toLowerCase() === activeOriginFilter.toLowerCase()
      );
    }

    // Relationship filter (case-insensitive)
    if (activeRelFilter) {
      filtered = filtered.filter(({ p }) =>
        (p.relationship || "").toLowerCase() === activeRelFilter.toLowerCase()
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sort.field === "date") {
        const da = a.p.date ? new Date(a.p.date).getTime() : null;
        const db = b.p.date ? new Date(b.p.date).getTime() : null;
        // Nulls always go to the bottom regardless of sort direction
        if (da === null && db === null) cmp = 0;
        else if (da === null) return 1;
        else if (db === null) return -1;
        else cmp = da - db;
      } else if (sort.field === "name") {
        cmp = (a.p.name || "").localeCompare(b.p.name || "");
      } else if (sort.field === "uid") {
        cmp = parseInt(a.p.uid || "0") - parseInt(b.p.uid || "0");
      }
      return sort.order === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [players, search, activeCategory, activeTag, activeOriginFilter, activeRelFilter, categories, sort, searchNotes]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    players.forEach(p => {
      (p.tags || "").split("|").map(t => t.trim()).filter(Boolean).forEach(t => tagSet.add(t));
    });
    return Array.from(tagSet).sort();
  }, [players]);

  const allRelationships = useMemo(() => {
    const relSet = new Set<string>();
    players.forEach(p => {
      if (p.relationship) relSet.add(p.relationship);
    });
    return Array.from(relSet).sort();
  }, [players]);

  const allOrigins = useMemo(() => {
    const originSet = new Set<string>();
    players.forEach(p => {
      if (p.origin) originSet.add(p.origin);
    });
    return Array.from(originSet).sort();
  }, [players]);

  const playerCounts = useMemo(() => {
    const counts: Record<string, number> = { all: players.length };
    counts["undated"] = players.filter((p) => !p.date).length;
    counts["starred"] = players.filter((p) => categories.starred.includes(p.uid)).length;
    // Relationship-based counts
    counts["friends"] = players.filter((p) =>
      p.relationship && ["old-friend", "new-friend", "coop-friend"].includes(p.relationship)
    ).length;
    categories.custom.forEach((c) => {
      counts[c.id] = players.filter((p) => c.uids.includes(p.uid)).length;
    });
    return counts;
  }, [players, categories]);

  // ── Player CRUD ─────────────────────────────────────────────────────────────
  const updatePlayer = async (masterIndex: number, updated: Player) => {
    const before = players[masterIndex];
    setPlayers((prev) => prev.map((p, i) => (i === masterIndex ? updated : p)));
    setEditingIndex(null);
    setSaving(true);
    try {
      await savePlayer("update", updated);
      logChange("edit", updated.uid, updated.name, before, updated);
      setSavedMsg("Saved!");
    } catch {
      setSavedMsg("⚠ Save failed");
    }
    setSaving(false);
    setTimeout(() => setSavedMsg(""), 2000);
  };

  const deletePlayer = async (masterIndex: number, uid: string) => {
    if (!confirm(`Delete entry for UID ${uid}?`)) return;
    const before = players[masterIndex];
    setPlayers((prev) => prev.filter((_, i) => i !== masterIndex));
    setEditingIndex(null);
    setSelectedUids((prev) => { const s = new Set(prev); s.delete(uid); return s; });
    setSaving(true);
    try {
      await savePlayer("delete", before);
      logChange("delete", uid, before.name, before);
      setSavedMsg("Deleted!");
    } catch {
      setSavedMsg("⚠ Delete failed");
    }
    setSaving(false);
    setTimeout(() => setSavedMsg(""), 2000);
  };

  const addPlayer = async (p: Player) => {
    if (!p.uid) return;
    if (players.some((x) => x.uid === p.uid)) {
      setSavedMsg(`⚠ UID ${p.uid} already exists`);
      setTimeout(() => setSavedMsg(""), 3000);
      return;
    }
    setPlayers((prev) => [...prev, p]);
    setAddingNew(false);
    setSaving(true);
    try {
      await savePlayer("insert", p);
      logChange("add", p.uid, p.name, undefined, p);
      setSavedMsg("Added!");
    } catch {
      setSavedMsg("⚠ Add failed");
    }
    setSaving(false);
    setTimeout(() => setSavedMsg(""), 2000);
  };

  // ── Categories ──────────────────────────────────────────────────────────────
  const handleCategoriesChange = (newCats: CategoriesData) => {
    setCategories(newCats);
    saveCategories(newCats);
  };

  const toggleStar = (uid: string) => {
    const newStarred = categories.starred.includes(uid)
      ? categories.starred.filter((s) => s !== uid)
      : [...categories.starred, uid];
    handleCategoriesChange({ ...categories, starred: newStarred });
  };

  // ── Bulk operations ─────────────────────────────────────────────────────────
  const toggleSelect = (uid: string) => {
    if (!selectMode) return;
    setSelectedUids((prev) => {
      const s = new Set(prev);
      s.has(uid) ? s.delete(uid) : s.add(uid);
      return s;
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedUids(new Set());
  };

  const exitTagMode = () => {
    setTagMode(false);
    setTaggingTarget("tags");
    setActiveTagging("");
    setNewTagInput("");
  };

  const toggleTagOnPlayer = async (masterIndex: number, value: string, target: "tags" | "relationship") => {
    const p = players[masterIndex];
    let updated: Player;

    if (target === "relationship") {
      // Single-value field: toggle on/off, only one relationship at a time
      const hasIt = p.relationship === value;
      updated = { ...p, relationship: hasIt ? undefined : (value as any) };
    } else {
      const current = (p.tags || "").split("|").map(t => t.trim()).filter(Boolean);
      const hasTag = current.includes(value);
      updated = {
        ...p,
        tags: hasTag ? current.filter(t => t !== value).join("|") : [...current, value].join("|"),
      };
    }

    setPlayers(prev => prev.map((pl, i) => i === masterIndex ? updated : pl));
    try {
      await savePlayer("update", updated);
    } catch {
      setPlayers(prev => prev.map((pl, i) => i === masterIndex ? p : pl));
      setSavedMsg("⚠ Tag save failed");
      setTimeout(() => setSavedMsg(""), 2000);
    }
  };

  const toggleSelectAll = () => {
    if (selectedUids.size === displayPlayersWithIndex.length) {
      setSelectedUids(new Set());
    } else {
      setSelectedUids(new Set(displayPlayersWithIndex.map(({ p }) => p.uid)));
    }
  };

  const bulkMoveToCategory = (catId: string) => {
    const uids = Array.from(selectedUids);
    let newCats = { ...categories };

    if (catId === "starred") {
      const newStarred = Array.from(new Set([...categories.starred, ...uids]));
      newCats = { ...newCats, starred: newStarred };
    } else {
      const newCustom = categories.custom.map((c) =>
        c.id === catId
          ? { ...c, uids: Array.from(new Set([...c.uids, ...uids])) }
          : c
      );
      newCats = { ...newCats, custom: newCustom };
    }

    handleCategoriesChange(newCats);
    setSelectedUids(new Set());
  };

  const bulkToggleStar = () => {
    const uids = Array.from(selectedUids);
    // If all are starred, unstar; otherwise star all
    const allStarred = uids.every((uid) => categories.starred.includes(uid));
    const newStarred = allStarred
      ? categories.starred.filter((s) => !uids.includes(s))
      : Array.from(new Set([...categories.starred, ...uids]));
    handleCategoriesChange({ ...categories, starred: newStarred });
    setSelectedUids(new Set());
  };

  const bulkApplyTag = async (tag: string) => {
    const indices = players
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => selectedUids.has(p.uid));

    setSaving(true);
    for (const { p, i } of indices) {
      const current = (p.tags || "").split("|").map(t => t.trim()).filter(Boolean);
      if (current.includes(tag)) continue; // already has it
      const updated: Player = { ...p, tags: [...current, tag].join("|") };
      setPlayers(prev => prev.map((pl, idx) => idx === i ? updated : pl));
      try {
        await savePlayer("update", updated);
      } catch {
        setPlayers(prev => prev.map((pl, idx) => idx === i ? p : pl));
      }
    }
    setSaving(false);
    setSavedMsg(`Tagged ${indices.length} as # ${tag}`);
    setTimeout(() => setSavedMsg(""), 2000);
    exitSelectMode();
  };

  const bulkApplyRelationship = async (rel: string) => {
    const indices = players
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => selectedUids.has(p.uid));

    setSaving(true);
    for (const { p, i } of indices) {
      const updated: Player = { ...p, relationship: rel as any };
      setPlayers(prev => prev.map((pl, idx) => idx === i ? updated : pl));
      try {
        await savePlayer("update", updated);
      } catch {
        setPlayers(prev => prev.map((pl, idx) => idx === i ? p : pl));
      }
    }
    setSaving(false);
    setSavedMsg(`Set ${indices.length} to ◆ ${rel}`);
    setTimeout(() => setSavedMsg(""), 2000);
    exitSelectMode();
  };

  const bulkApplyOrigin = async (origin: string) => {
    const indices = players
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => selectedUids.has(p.uid));

    setSaving(true);
    for (const { p, i } of indices) {
      const updated: Player = { ...p, origin };
      setPlayers(prev => prev.map((pl, idx) => idx === i ? updated : pl));
      try {
        await savePlayer("update", updated);
      } catch {
        setPlayers(prev => prev.map((pl, idx) => idx === i ? p : pl));
      }
    }
    setSaving(false);
    setSavedMsg(`Set ${indices.length} origin to @ ${origin}`);
    setTimeout(() => setSavedMsg(""), 2000);
    exitSelectMode();
  };

  if (!isLoggedIn) return <LoginGate onLogin={setPassword} />;

  const blankPlayer: Player = { file: "", name: "", nickname: "", uid: "" };
  const allSelected =
    displayPlayersWithIndex.length > 0 &&
    selectedUids.size === displayPlayersWithIndex.length;

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
              <span className="text-xs animate-shimmer" style={{ color: "rgba(196,181,253,0.5)" }}>Saving...</span>
            )}
            <a href="/" className="btn-ghost text-xs">← Public View</a>
          </div>
        </div>
        <div className="divider-gold max-w-7xl mx-auto mt-4" />
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 pb-32">
        {/* Tabs */}
        <div className="flex gap-3 mb-6 flex-wrap">
          {(["players", "categories", "log"] as const).map((tab) => (
            <button key={tab}
              onClick={() => { setActiveTab(tab); if (tab === "log") loadLog(); }}
              className={`cat-pill capitalize ${activeTab === tab ? "cat-pill-active" : "cat-pill-inactive"}`}>
              {tab === "players" ? `Players (${players.length})` : tab === "categories" ? "Categories" : "Change Log"}
            </button>
          ))}
        </div>

        {/* ── PLAYERS TAB ── */}
        {activeTab === "players" && (
          <>
            <div className="flex flex-col sm:flex-row gap-4 mb-5 items-start sm:items-end justify-between flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <AdminSearchBox value={search} onValueChange={(v) => { setSearch(v); setSelectedUids(new Set()); }} inputRef={searchInputRef} />
                {search && (
                  <button onClick={() => setSearchNotes((v) => !v)}
                    className={`cat-pill text-xs ${searchNotes ? "cat-pill-active" : "cat-pill-inactive"}`}
                    title={searchNotes ? "Excluding notes from search" : "Click to also search notes"}>
                    {searchNotes ? "✦ Notes" : "Notes"}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <SortControls sort={sort} onChange={setSort} />
                {!addingNew && (
                  <button className="btn-gold text-xs" onClick={() => setAddingNew(true)}>+ Add Entry</button>
                )}
                <button
                  className={`cat-pill text-xs ${selectMode ? "cat-pill-active" : "cat-pill-inactive"}`}
                  onClick={() => selectMode ? exitSelectMode() : setSelectMode(true)}>
                  {selectMode ? `✕ Cancel (${selectedUids.size})` : "Select"}
                </button>
                <button
                  className={`cat-pill text-xs ${tagMode ? "cat-pill-active" : "cat-pill-inactive"}`}
                  onClick={() => tagMode ? exitTagMode() : setTagMode(true)}>
                  # Tag
                </button>
              </div>
            </div>

            {/* Tag mode banner */}
            {tagMode && (
              <div className="mb-4 rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap"
                style={{ background: "rgba(167,139,250,0.08)", border: "2px solid rgba(167,139,250,0.4)" }}>
                <div className="flex gap-1.5">
                  <button
                    className={`cat-pill text-xs ${taggingTarget === "tags" ? "cat-pill-active" : "cat-pill-inactive"}`}
                    onClick={() => { setTaggingTarget("tags"); setActiveTagging(""); }}>
                    Tags
                  </button>
                  <button
                    className={`cat-pill text-xs ${taggingTarget === "relationship" ? "cat-pill-active" : "cat-pill-inactive"}`}
                    onClick={() => { setTaggingTarget("relationship"); setActiveTagging(""); }}>
                    Relationship
                  </button>
                </div>
                <span className="text-xs flex-shrink-0" style={{ color: "rgba(167,139,250,0.7)", fontFamily: "'Cinzel', serif", letterSpacing: "0.06em" }}>as:</span>
                <select
                  className="edit-input text-xs"
                  value={activeTagging}
                  onChange={(e) => {
                    if (e.target.value === "__new__") return;
                    setActiveTagging(e.target.value);
                  }}
                  style={{ fontSize: "0.8rem", minWidth: 120 }}>
                  <option value="">— pick —</option>
                  {(taggingTarget === "tags" ? allTags : allRelationships).map(t => <option key={t} value={t}>{t}</option>)}
                  <option value="__new__" disabled>────────</option>
                </select>
                <div className="flex gap-1 items-center">
                  <input className="edit-input text-xs" placeholder={taggingTarget === "tags" ? "or type new tag…" : "or type new relationship…"}
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newTagInput.trim()) {
                        setActiveTagging(newTagInput.trim().toLowerCase());
                        setNewTagInput("");
                      }
                    }}
                    style={{ fontSize: "0.78rem", maxWidth: 160 }} />
                  {newTagInput.trim() && (
                    <button className="btn-ghost text-xs px-2 py-1"
                      onClick={() => { setActiveTagging(newTagInput.trim().toLowerCase()); setNewTagInput(""); }}>
                      Use
                    </button>
                  )}
                </div>
                {activeTagging && (
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(167,139,250,0.2)", border: "1px solid rgba(167,139,250,0.4)", color: "rgba(167,139,250,0.9)" }}>
                    # {activeTagging}
                  </span>
                )}
                <p className="text-xs w-full mt-0.5" style={{ color: "rgba(167,139,250,0.5)" }}>
                  {activeTagging ? "Tap any player to toggle this tag on/off — saves instantly" : "Pick a tag above, then tap players to assign it"}
                </p>
                <button className="btn-ghost text-xs ml-auto flex-shrink-0" onClick={exitTagMode}>✕ Done</button>
              </div>
            )}

            {!search && (
              <div className="mb-5">
                <CategoryBar categories={categories} active={activeCategory}
                  onChange={(cat) => { setActiveCategory(cat); setSelectedUids(new Set()); }}
                  playerCounts={playerCounts} />
                {(allTags.length > 0 || allOrigins.length > 0 || allRelationships.length > 0) && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {/* Tags */}
                    {allTags.map(tag => (
                      <button key={"t-"+tag}
                        onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                        className="text-xs px-2.5 py-1 rounded-full transition-all"
                        style={{
                          background: activeTag === tag ? "rgba(167,139,250,0.2)" : "rgba(167,139,250,0.05)",
                          border: `1px solid ${activeTag === tag ? "rgba(167,139,250,0.5)" : "rgba(167,139,250,0.15)"}`,
                          color: activeTag === tag ? "rgba(167,139,250,0.9)" : "rgba(167,139,250,0.45)",
                          cursor: "pointer",
                        }}>
                        # {tag}
                      </button>
                    ))}
                    {/* Origins */}
                    {allOrigins.map(origin => (
                      <button key={"o-"+origin}
                        onClick={() => setActiveOriginFilter(activeOriginFilter === origin ? null : origin)}
                        className="text-xs px-2.5 py-1 rounded-full transition-all"
                        style={{
                          background: activeOriginFilter === origin ? "rgba(45,212,191,0.2)" : "rgba(45,212,191,0.05)",
                          border: `1px solid ${activeOriginFilter === origin ? "rgba(45,212,191,0.5)" : "rgba(45,212,191,0.15)"}`,
                          color: activeOriginFilter === origin ? "rgba(45,212,191,0.9)" : "rgba(45,212,191,0.45)",
                          cursor: "pointer",
                        }}>
                        @ {origin}
                      </button>
                    ))}
                    {/* Relationships */}
                    {allRelationships.map(rel => (
                      <button key={"r-"+rel}
                        onClick={() => setActiveRelFilter(activeRelFilter === rel ? null : rel)}
                        className="text-xs px-2.5 py-1 rounded-full transition-all"
                        style={{
                          background: activeRelFilter === rel ? "rgba(200,169,110,0.2)" : "rgba(200,169,110,0.05)",
                          border: `1px solid ${activeRelFilter === rel ? "rgba(200,169,110,0.5)" : "rgba(200,169,110,0.15)"}`,
                          color: activeRelFilter === rel ? "rgba(200,169,110,0.9)" : "rgba(200,169,110,0.45)",
                          cursor: "pointer",
                        }}>
                        ◆ {rel}
                      </button>
                    ))}
                    {/* Clear all */}
                    {(activeTag || activeOriginFilter || activeRelFilter) && (
                      <button onClick={() => { setActiveTag(null); setActiveOriginFilter(null); setActiveRelFilter(null); }}
                        className="text-xs px-2 py-1 rounded-full"
                        style={{ color: "rgba(196,181,253,0.35)", border: "1px solid rgba(196,181,253,0.1)" }}>
                        ✕ clear all
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <p className="text-xs mb-4" style={{ color: "rgba(196,181,253,0.4)" }}>
              {displayPlayersWithIndex.length} entr{displayPlayersWithIndex.length !== 1 ? "ies" : "y"} shown
              {search && <span style={{ color: "rgba(196,181,253,0.3)" }}> · searching</span>}
              {selectedUids.size > 0 && (
                <span style={{ color: "var(--lav-400)" }}> · {selectedUids.size} selected</span>
              )}
            </p>

            {/* ── MOBILE ── */}
            <div className="md:hidden space-y-3">
              {addingNew && (
                <div className="glass rounded-xl overflow-hidden">
                  <table className="admin-table w-full"><tbody>
                    <EditableRow player={blankPlayer} onSave={addPlayer} onCancel={() => setAddingNew(false)} isNew selectMode={selectMode} allRelationships={allRelationships} />
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
                          onCancel={() => setEditingIndex(null)} selectMode={selectMode} allRelationships={allRelationships} />
                      </tbody></table>
                    </div>
                  ) : (
                    <div key={masterIndex}
                      className="glass-gold rounded-xl p-4"
                      style={{ borderColor: selectedUids.has(p.uid) ? "rgba(167,139,250,0.4)" : undefined }}
                      onClick={() => selectMode && toggleSelect(p.uid)}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {selectMode && (
                              <input type="checkbox" checked={selectedUids.has(p.uid)}
                                onChange={() => toggleSelect(p.uid)}
                                onClick={(e) => e.stopPropagation()}
                                style={{ accentColor: "var(--lav-400)", cursor: "pointer" }} />
                            )}
                            <span className="font-display text-base font-semibold" style={{ color: "var(--lav-300)" }}>{p.name}</span>
                            {categories.starred.includes(p.uid) && <span style={{ color: "var(--lav-400)", fontSize: "0.8rem" }}>★</span>}
                          </div>
                          <div className="flex flex-wrap gap-x-3 mt-0.5">
                            {p.gameId && <p className="text-xs" style={{ color: "rgba(196,181,253,0.4)" }}>ID: {p.gameId}</p>}
                            {p.origin && <p className="text-xs" style={{ color: "rgba(196,181,253,0.4)" }}>{p.origin}</p>}
                          </div>
                          {p.relationship && <div className="mt-1"><RelBadge rel={p.relationship} /></div>}
                          {p.tags && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {p.tags.split("|").filter(Boolean).map(t => (
                                <span key={t} className="text-xs px-2 py-0.5 rounded-full"
                                  style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", color: "rgba(167,139,250,0.6)" }}>
                                  # {t}
                                </span>
                              ))}
                            </div>
                          )}
                          {splitNicknames(p.nickname).length > 0 && (
                            <p className="text-sm mt-0.5" style={{ color: "rgba(196,181,253,0.5)", fontStyle: "italic" }}>
                              {splitNicknames(p.nickname).join(", ")}
                            </p>
                          )}
                          {/* Inline notes */}
                          {(p.note?.trim() || p.friendNote?.trim() || p.privateNote?.trim()) && (
                            <div className="mt-2 space-y-1">
                              {p.note?.trim() && (
                                <p className="text-xs" style={{ color: "rgba(94,234,212,0.7)" }}>
                                  <span style={{ opacity: 0.5, fontFamily: "'Cinzel', serif", fontSize: "0.6rem", marginRight: 5 }}>PUBLIC</span>
                                  {p.note}
                                </p>
                              )}
                              {p.friendNote?.trim() && (
                                <p className="text-xs" style={{ color: "rgba(125,211,252,0.7)" }}>
                                  <span style={{ opacity: 0.5, fontFamily: "'Cinzel', serif", fontSize: "0.6rem", marginRight: 5 }}>FRIENDS</span>
                                  {p.friendNote}
                                </p>
                              )}
                              {p.privateNote?.trim() && (
                                <p className="text-xs" style={{ color: "rgba(248,113,113,0.7)" }}>
                                  <span style={{ opacity: 0.5, fontFamily: "'Cinzel', serif", fontSize: "0.6rem", marginRight: 5 }}>PRIVATE</span>
                                  {p.privateNote}
                                </p>
                              )}
                            </div>
                          )}
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

            {/* ── DESKTOP TABLE ── */}
            <div className="hidden md:block glass rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="admin-table w-full">
                  <thead>
                    <tr>
                      {selectMode && (
                        <th style={{ width: "3%" }}>
                          <input type="checkbox" checked={allSelected} onChange={toggleSelectAll}
                            style={{ accentColor: "var(--lav-400)", cursor: "pointer" }} />
                        </th>
                      )}
                      <th style={{ width: "18%" }}>File / Date</th>
                      <th style={{ width: "13%" }}>Name</th>
                      <th style={{ width: "10%" }}>Nickname</th>
                      <th style={{ width: "8%" }}>UID</th>
                      <th style={{ width: "7%" }}>Origin</th>
                      <th style={{ width: "11%" }}>Relationship</th>
                      <th style={{ width: "4%", textAlign: "center" }}>★</th>
                      <th style={{ width: "23%" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {addingNew && (
                      <EditableRow player={blankPlayer} onSave={addPlayer} onCancel={() => setAddingNew(false)} isNew selectMode={selectMode} allRelationships={allRelationships} />
                    )}
                    {loading ? (
                      <tr><td colSpan={9} className="text-center py-10">
                        <span className="animate-shimmer text-xs" style={{ color: "rgba(196,181,253,0.4)" }}>Loading...</span>
                      </td></tr>
                    ) : displayPlayersWithIndex.length === 0 ? (
                      <tr><td colSpan={9} className="text-center py-10 text-xs" style={{ color: "rgba(196,181,253,0.3)" }}>No entries found</td></tr>
                    ) : (
                      displayPlayersWithIndex.map(({ p, masterIndex }) =>
                        editingIndex === masterIndex ? (
                          <EditableRow key={masterIndex} player={p}
                            onSave={(updated) => updatePlayer(masterIndex, updated)}
                            onDelete={() => deletePlayer(masterIndex, p.uid)}
                            onCancel={() => setEditingIndex(null)} selectMode={selectMode} allRelationships={allRelationships} />
                        ) : (
                          <>
                          {(() => {
                            const hasActiveTag = activeTagging && (
                              taggingTarget === "relationship"
                                ? p.relationship === activeTagging
                                : (p.tags || "").split("|").map(t => t.trim()).includes(activeTagging)
                            );
                            return (
                          <tr key={masterIndex}
                            style={{
                              cursor: (selectMode || (tagMode && activeTagging)) ? "pointer" : "default",
                              background: selectedUids.has(p.uid)
                                ? "rgba(167,139,250,0.06)"
                                : (tagMode && hasActiveTag)
                                  ? "rgba(167,139,250,0.07)"
                                  : undefined,
                              borderLeft: selectedUids.has(p.uid)
                                ? "2px solid rgba(167,139,250,0.4)"
                                : (tagMode && hasActiveTag)
                                  ? "2px solid rgba(167,139,250,0.5)"
                                  : undefined,
                              opacity: tagMode && activeTagging && !hasActiveTag ? 0.55 : 1,
                              transition: "opacity 0.15s, background 0.15s",
                            }}
                            onClick={() => {
                              if (selectMode) toggleSelect(p.uid);
                              else if (tagMode && activeTagging) toggleTagOnPlayer(masterIndex, activeTagging, taggingTarget);
                            }}>
                            {/* Checkbox — only in select mode */}
                            {selectMode && (
                              <td onClick={(e) => e.stopPropagation()}>
                                <input type="checkbox" checked={selectedUids.has(p.uid)}
                                  onChange={() => toggleSelect(p.uid)}
                                  style={{ accentColor: "var(--lav-400)", cursor: "pointer" }} />
                              </td>
                            )}
                            {/* File / Date */}
                            <td>
                              <p style={{ color: "rgba(196,181,253,0.5)", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.file}>{p.file}</p>
                              {p.date && <p className="text-xs mt-0.5" style={{ color: "rgba(94,234,212,0.6)" }}>{formatDate(p.date)}</p>}
                            </td>
                            {/* Name + Game ID + Tags */}
                            <td>
                              <div className="flex items-center gap-2 flex-wrap">
                                {tagMode && activeTagging && taggingTarget === "tags" && (
                                  <div style={{
                                    width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                                    background: hasActiveTag ? "rgba(167,139,250,0.8)" : "transparent",
                                    border: `1.5px solid ${hasActiveTag ? "rgba(167,139,250,0.8)" : "rgba(167,139,250,0.3)"}`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                  }}>
                                    {hasActiveTag && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                                  </div>
                                )}
                                <span style={{ color: "var(--lav-300)", fontWeight: 500 }}>{p.name}</span>
                                {!tagMode && p.tags && p.tags.split("|").filter(Boolean).map(t => (
                                  <span key={t} className="text-xs px-1.5 py-0.5 rounded-full"
                                    style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", color: "rgba(167,139,250,0.6)", fontSize: "0.65rem" }}>
                                    {t}
                                  </span>
                                ))}
                                {tagMode && p.tags && p.tags.split("|").filter(Boolean).filter(t => t !== activeTagging).map(t => (
                                  <span key={t} className="text-xs px-1.5 py-0.5 rounded-full"
                                    style={{ background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.15)", color: "rgba(167,139,250,0.4)", fontSize: "0.65rem" }}>
                                    {t}
                                  </span>
                                ))}
                              </div>
                              {p.gameId && (
                                <p className="text-xs mt-0.5" style={{ color: "rgba(196,181,253,0.35)", fontStyle: "italic" }}>{p.gameId}</p>
                              )}
                            </td>
                            {/* Nicknames */}
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
                            {/* UID */}
                            <td><span className="uid-badge">{p.uid}</span></td>
                            {/* Origin */}
                            <td>
                              {p.origin
                                ? <span className="text-xs" style={{ color: "rgba(196,181,253,0.5)" }}>{p.origin}</span>
                                : <span style={{ opacity: 0.3 }}>—</span>}
                            </td>
                            {/* Relationship */}
                            <td>
                              {tagMode && taggingTarget === "relationship" ? (
                                <div className="flex items-center gap-2">
                                  <div style={{
                                    width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                                    background: hasActiveTag ? "rgba(167,139,250,0.8)" : "transparent",
                                    border: `1.5px solid ${hasActiveTag ? "rgba(167,139,250,0.8)" : "rgba(167,139,250,0.3)"}`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                  }}>
                                    {hasActiveTag && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                                  </div>
                                  {p.relationship && (
                                    <span style={{
                                      fontSize: "0.65rem",
                                      color: hasActiveTag ? "rgba(167,139,250,0.9)" : "rgba(167,139,250,0.4)",
                                      fontFamily: "'Cinzel', serif",
                                      letterSpacing: "0.05em",
                                      whiteSpace: "nowrap",
                                    }}>
                                      {p.relationship.toUpperCase()}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <RelBadge rel={p.relationship} />
                              )}
                            </td>
                            {/* Star */}
                            <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                              <StarBtn isStarred={categories.starred.includes(p.uid)} onToggle={() => toggleStar(p.uid)} />
                            </td>
                            {/* Actions */}
                            <td onClick={(e) => e.stopPropagation()}>
                              <div className="flex gap-2">
                                <button className="btn-ghost text-xs px-3 py-1" onClick={() => { setEditingIndex(masterIndex); setSelectedUids(new Set()); }}>Edit</button>
                                <button className="btn-danger text-xs px-3 py-1" onClick={() => deletePlayer(masterIndex, p.uid)}>Del</button>
                              </div>
                            </td>
                          </tr>
                          );
                          })()}
                          {/* Inline notes row */}
                          {(p.note?.trim() || p.friendNote?.trim() || p.privateNote?.trim()) && (
                            <tr key={masterIndex + "-notes"} style={{ background: "rgba(0,0,0,0.15)" }}>
                              <td colSpan={selectMode ? 9 : 8} style={{ paddingTop: "0.4rem", paddingBottom: "0.6rem" }}>
                                <div className="flex flex-wrap gap-x-6 gap-y-1 px-1">
                                  {p.note?.trim() && (
                                    <span className="text-xs" style={{ color: "rgba(94,234,212,0.7)" }}>
                                      <span style={{ opacity: 0.5, fontFamily: "'Cinzel', serif", letterSpacing: "0.06em", fontSize: "0.6rem", marginRight: 6 }}>PUBLIC</span>
                                      {p.note}
                                    </span>
                                  )}
                                  {p.friendNote?.trim() && (
                                    <span className="text-xs" style={{ color: "rgba(125,211,252,0.7)" }}>
                                      <span style={{ opacity: 0.5, fontFamily: "'Cinzel', serif", letterSpacing: "0.06em", fontSize: "0.6rem", marginRight: 6 }}>FRIENDS</span>
                                      {p.friendNote}
                                    </span>
                                  )}
                                  {p.privateNote?.trim() && (
                                    <span className="text-xs" style={{ color: "rgba(248,113,113,0.7)" }}>
                                      <span style={{ opacity: 0.5, fontFamily: "'Cinzel', serif", letterSpacing: "0.06em", fontSize: "0.6rem", marginRight: 6 }}>PRIVATE</span>
                                      {p.privateNote}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                          </>
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
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {categories.starred.map((uid) => {
                  const player = players.find((p) => p.uid === uid);
                  return (
                    <span key={uid} className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5"
                      style={{ background: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.2)", color: "var(--lav-400)" }}>
                      ★ {player ? `${player.name} (${uid})` : uid}
                      <button onClick={() => handleCategoriesChange({ ...categories, starred: categories.starred.filter((s) => s !== uid) })}
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
              <div className="text-center py-10 animate-shimmer text-sm" style={{ color: "rgba(196,181,253,0.4)" }}>Loading...</div>
            ) : changelog.length === 0 ? (
              <div className="text-center py-16 text-sm" style={{ color: "rgba(196,181,253,0.25)", fontFamily: "'Cinzel', serif", letterSpacing: "0.08em" }}>No changes recorded yet</div>
            ) : (
              <div className="space-y-2">
                {changelog.map((entry: any) => {
                  const actionColor = entry.action === "add" ? "rgba(45,212,191,0.7)" : entry.action === "delete" ? "rgba(248,113,113,0.7)" : "rgba(200,169,110,0.6)";
                  const actionBg = entry.action === "add" ? "rgba(45,212,191,0.06)" : entry.action === "delete" ? "rgba(248,113,113,0.06)" : "rgba(200,169,110,0.04)";
                  return (
                    <div key={entry.id} className="glass rounded-xl px-4 py-3 flex items-start gap-4 flex-wrap"
                      style={{ background: actionBg, border: `1px solid ${actionColor.replace("0.7", "0.15")}` }}>
                      <span className="flex-shrink-0 text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                        style={{ color: actionColor, background: actionColor.replace("0.7", "0.1"), fontFamily: "'Cinzel', serif", minWidth: 52, textAlign: "center" }}>
                        {entry.action}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span style={{ color: "var(--lav-300)", fontWeight: 600, fontSize: "0.95rem" }}>{entry.name || "Unknown"}</span>
                          <span className="uid-badge" style={{ fontSize: "0.78rem" }}>UID {entry.uid}</span>
                        </div>
                        {entry.action === "edit" && entry.before && entry.after && (
                          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                            {(["name", "nickname", "uid", "note", "privateNote", "file", "tags", "origin", "gameId"] as const).map((field) => {
                              const before = (entry.before as any)[field];
                              const after = (entry.after as any)[field];
                              if (before === after || (!before && !after)) return null;
                              return (
                                <span key={field} className="text-xs" style={{ color: "rgba(200,169,110,0.45)" }}>
                                  <span style={{ opacity: 0.6 }}>{field}:</span>{" "}
                                  <span style={{ color: "rgba(248,113,113,0.7)", textDecoration: "line-through" }}>{String(before || "—").slice(0, 30)}</span>
                                  {" → "}
                                  <span style={{ color: "rgba(45,212,191,0.7)" }}>{String(after || "—").slice(0, 30)}</span>
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-xs" style={{ color: "rgba(196,181,253,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                        {entry.action === "delete" && entry.before && (
                          <button className="btn-ghost text-xs px-2 py-1"
                            style={{ borderColor: "rgba(45,212,191,0.3)", color: "rgba(45,212,191,0.6)" }}
                            onClick={async () => {
                              if (!confirm(`Restore ${entry.name} (UID ${entry.uid})?`)) return;
                              const restoredPlayer = entry.before as Player;
                              setPlayers((prev) => [...prev, restoredPlayer]);
                              setSaving(true);
                              try {
                                await savePlayer("insert", restoredPlayer);
                                await logChange("add", restoredPlayer.uid, restoredPlayer.name, undefined, restoredPlayer);
                                await loadLog();
                                setSavedMsg("Restored!");
                              } catch { setSavedMsg("⚠ Restore failed"); }
                              setSaving(false);
                              setTimeout(() => setSavedMsg(""), 2000);
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

      {/* Bulk action bar */}
      <BulkActionBar
        count={selectedUids.size}
        categories={categories}
        players={players}
        selectedUids={selectedUids}
        allTags={allTags}
        allRelationships={allRelationships}
        allOrigins={allOrigins}
        onMoveToCategory={bulkMoveToCategory}
        onStar={bulkToggleStar}
        onClear={exitSelectMode}
        onApplyTag={bulkApplyTag}
        onApplyRelationship={bulkApplyRelationship}
        onApplyOrigin={bulkApplyOrigin}
      />

      {previewPlayer && (
        <PlayerModal player={previewPlayer} onClose={() => setPreviewPlayer(null)} viewLevel="admin" />
      )}
    </div>
  );
}