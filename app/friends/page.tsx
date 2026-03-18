"use client";

import { useState, useEffect, useMemo } from "react";
import type { Player, CategoriesData, SortConfig } from "@/lib/types";
import { filterByCategory, sortPlayers, splitNicknames } from "@/lib/utils";
import PlayerCard from "@/components/PlayerCard";
import CategoryBar from "@/components/CategoryBar";
import SortControls from "@/components/SortControls";

const FRIENDS_PASSWORD = "meowl2077"; // change via env FRIENDS_PASSWORD

// ─── Login Gate ───────────────────────────────────────────────────────────────
function LoginGate({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);

  const attempt = () => {
    const correct = process.env.NEXT_PUBLIC_FRIENDS_PASSWORD || FRIENDS_PASSWORD;
    if (pw === correct) {
      sessionStorage.setItem("friends_auth", "1");
      onLogin();
    } else {
      setError(true);
      setTimeout(() => setError(false), 1500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-gold rounded-2xl p-10 w-full max-w-sm text-center"
        style={{ border: "1px solid rgba(125,211,252,0.25)" }}>
        <div className="mb-6">
          <div className="divider-gold w-24 mx-auto mb-4" />
          <h1 className="font-display text-2xl tracking-widest mb-1"
            style={{ color: "var(--lav-300)" }}>Friends Access</h1>
          <p className="text-xs tracking-widest uppercase"
            style={{ color: "rgba(196,181,253,0.35)" }}>Traveler Registry</p>
          <div className="divider-gold w-24 mx-auto mt-4" />
        </div>
        <input type="password" value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && attempt()}
          placeholder="Enter password"
          className="edit-input text-center mb-4 py-3"
          style={{ borderColor: error ? "rgba(248,113,113,0.6)" : undefined, fontSize: "1rem" }} />
        {error && (
          <p className="text-xs mb-3" style={{ color: "rgba(248,113,113,0.8)" }}>
            Incorrect password
          </p>
        )}
        <button className="btn-gold w-full py-3" onClick={attempt}>Enter</button>
        <div className="mt-6 flex gap-4 justify-center">
          <a href="/" className="text-xs" style={{ color: "rgba(196,181,253,0.35)" }}>
            ← Public
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Friends Search Box ───────────────────────────────────────────────────────
function FriendsSearchBox({ value, mode, onValueChange, onModeChange }: {
  value: string; mode: "uid" | "name";
  onValueChange: (v: string) => void; onModeChange: (m: "uid" | "name") => void;
}) {
  return (
    <div className="flex flex-col gap-2 w-full max-w-sm">
      <div className="flex gap-1.5 justify-center">
        {(["uid", "name"] as const).map((m) => (
          <button key={m} onClick={() => { onModeChange(m); onValueChange(""); }}
            className={`cat-pill text-xs ${mode === m ? "cat-pill-active" : "cat-pill-inactive"}`}>
            {m === "uid" ? "# UID" : "✦ Name"}
          </button>
        ))}
      </div>
      <div className="relative flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
          strokeWidth={1.5} stroke="currentColor"
          className="absolute left-3 w-4 h-4 pointer-events-none"
          style={{ color: "rgba(196,181,253,0.4)" }}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          inputMode={mode === "uid" ? "numeric" : "text"}
          value={value}
          onChange={(e) => onValueChange(mode === "uid" ? e.target.value.replace(/\D/g, "") : e.target.value)}
          placeholder={mode === "uid" ? "Enter full UID..." : "Search by name or nickname..."}
          className="search-input w-full rounded-xl pl-9 pr-9 py-3"
          style={{ fontSize: "1rem", letterSpacing: mode === "uid" ? "0.12em" : "0.02em", textAlign: "left" }}
        />
        {value && (
          <button className="absolute right-3" style={{ color: "rgba(196,181,253,0.4)" }}
            onClick={() => onValueChange("")}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Friends Page ────────────────────────────────────────────────────────
export default function FriendsPage() {
  const [authed, setAuthed] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [categories, setCategories] = useState<CategoriesData>({ starred: [], custom: [] });
  const [search, setSearch] = useState("");
  const [searchMode, setSearchMode] = useState<"uid" | "name">("uid");
  const [activeCategory, setActiveCategory] = useState("dated");
  const [sort, setSort] = useState<SortConfig>({ field: "date", order: "asc" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem("friends_auth") === "1") setAuthed(true);
  }, []);

  useEffect(() => {
    if (!authed) return;
    Promise.all([
      fetch("/api/players", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/categories", { cache: "no-store" }).then((r) => r.json()),
    ]).then(([pData, cData]) => {
      setPlayers(pData.players || []);
      setCategories(cData || { starred: [], custom: [] });
      setLoading(false);
    });
  }, [authed]);

  const displayPlayers = useMemo(() => {
    if (!search.trim()) {
      return sortPlayers(filterByCategory(players, activeCategory, categories), sort);
    }
    const q = search.trim().toLowerCase();
    if (searchMode === "uid") {
      return sortPlayers(players.filter((p) => p.uid === q), sort);
    }
    return sortPlayers(players.filter((p) => {
      const nicks = splitNicknames(p.nickname).map((n) => n.toLowerCase());
      return p.name.toLowerCase().includes(q) || nicks.some((n) => n.includes(q));
    }), sort);
  }, [players, search, searchMode, activeCategory, categories, sort]);

  const playerCounts = useMemo(() => {
    const counts: Record<string, number> = { all: players.length };
    counts["dated"]   = players.filter((p) => !!p.date).length;
    counts["undated"] = players.filter((p) => !p.date).length;
    counts["starred"] = players.filter((p) => categories.starred.includes(p.uid)).length;
    categories.custom.forEach((c) => {
      counts[c.id] = players.filter((p) => c.uids.includes(p.uid)).length;
    });
    return counts;
  }, [players, categories]);

  if (!authed) return <LoginGate onLogin={() => setAuthed(true)} />;

  return (
    <div className="min-h-screen relative z-10">
      {/* Header */}
      <header className="pt-8 pb-5 px-4 text-center">
        <div className="inline-flex items-center gap-3 mb-3">
          <div className="divider-gold w-10 sm:w-16" />
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
            className="w-5 h-5" style={{ color: "var(--gold-500)" }}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <div className="divider-gold w-10 sm:w-16" />
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-widest mb-1"
          style={{ color: "transparent", background: "linear-gradient(135deg, var(--lav-300), var(--rose-300))", backgroundClip: "text", WebkitBackgroundClip: "text" }}>
          Celestial Archive</h1>
        <p className="text-xs tracking-widest uppercase"
          style={{ color: "rgba(196,181,253,0.4)" }}>Friends Access ✦</p>
        <div className="divider-gold w-32 sm:w-48 mx-auto mt-4" />
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-4 pb-20">
        {/* Search */}
        <section className="mb-6 flex flex-col items-center gap-3">
          <FriendsSearchBox
            value={search} mode={searchMode}
            onValueChange={setSearch}
            onModeChange={(m) => { setSearchMode(m); setSearch(""); }}
          />
          {search && (
            <p className="text-sm" style={{ color: "rgba(196,181,253,0.4)" }}>
              {displayPlayers.length === 0 ? "No traveler found"
                : `${displayPlayers.length} result${displayPlayers.length !== 1 ? "s" : ""}`}
            </p>
          )}
        </section>

        {/* Category bar + sort — only when not searching */}
        {!search && (
          <div className="mb-6 flex flex-col gap-4">
            <CategoryBar categories={categories} active={activeCategory}
              onChange={setActiveCategory} playerCounts={playerCounts} />
            <div className="flex justify-center">
              <SortControls sort={sort} onChange={setSort} />
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-gold rounded-xl p-5 animate-shimmer"
                style={{ animationDelay: `${i * 60}ms`, minHeight: 110 }} />
            ))}
          </div>
        ) : displayPlayers.length === 0 ? (
          <p className="text-center text-sm mt-16"
            style={{ color: "rgba(196,181,253,0.2)", fontFamily: "'Cinzel', serif", letterSpacing: "0.1em" }}>
            {search ? "No traveler found" : "No entries in this category"}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayPlayers.map((p, i) => (
              <PlayerCard
                key={p.uid + p.file}
                player={p}
                index={i}
                showNoteDot
                viewLevel="friend"
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center pb-8 mt-auto">
        <div className="divider-gold w-32 mx-auto mb-4" />
        <div className="flex gap-4 justify-center">
          <a href="/" className="text-xs" style={{ color: "rgba(196,181,253,0.2)" }}>Public</a>
          <span style={{ color: "rgba(200,169,110,0.1)" }}>·</span>
          <a href="/admin" className="text-xs" style={{ color: "rgba(196,181,253,0.2)" }}>Admin</a>
        </div>
      </footer>
    </div>
  );
}