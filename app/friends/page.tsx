"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import type { Player, CategoriesData, SortConfig } from "@/lib/types";
import { filterByCategory, sortPlayers, splitNicknames } from "@/lib/utils";
import PlayerCard from "@/components/PlayerCard";
import CategoryBar from "@/components/CategoryBar";
import SortControls from "@/components/SortControls";

const FRIENDS_PASSWORD = "meowl2077";

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
          <h1 className="font-display text-2xl tracking-widest mb-1" style={{ color: "var(--lav-300)" }}>Friends Access</h1>
          <p className="text-xs tracking-widest uppercase" style={{ color: "rgba(196,181,253,0.35)" }}>Traveler Registry</p>
          <div className="divider-gold w-24 mx-auto mt-4" />
        </div>
        <input type="password" value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && attempt()}
          placeholder="Enter password"
          className="edit-input text-center mb-4 py-3"
          style={{ borderColor: error ? "rgba(248,113,113,0.6)" : undefined, fontSize: "1rem" }} />
        {error && <p className="text-xs mb-3" style={{ color: "rgba(248,113,113,0.8)" }}>Incorrect password</p>}
        <button className="btn-gold w-full py-3" onClick={attempt}>Enter</button>
        <div className="mt-6">
          <a href="/" className="text-xs" style={{ color: "rgba(196,181,253,0.35)" }}>← Public</a>
        </div>
      </div>
    </div>
  );
}

// ─── Search Box ───────────────────────────────────────────────────────────────
function SearchBox({ value, onValueChange, inputRef }: {
  value: string;
  onValueChange: (v: string) => void;
  inputRef?: React.RefObject<HTMLInputElement>;
}) {
  return (
    <div className="relative flex items-center w-full max-w-md mx-auto">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
        strokeWidth={1.5} stroke="currentColor"
        className="absolute left-4 w-4 h-4 pointer-events-none"
        style={{ color: "rgba(196,181,253,0.4)" }}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
      <input ref={inputRef} type="text" value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder="Search name, UID, nickname, tag, origin..."
        className="search-input w-full rounded-xl py-3"
        style={{ fontSize: "0.95rem", paddingLeft: "2.5rem", paddingRight: "2.5rem" }} />
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

// ─── Main Friends Page ────────────────────────────────────────────────────────
export default function FriendsPage() {
  const [authed, setAuthed] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [categories, setCategories] = useState<CategoriesData>({ starred: [], custom: [] });
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("dated");
  const [sort, setSort] = useState<SortConfig>({ field: "date", order: "asc" });
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeOriginFilter, setActiveOriginFilter] = useState<string | null>(null);
  const [activeRelFilter, setActiveRelFilter] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Keyboard shortcut: Ctrl+E to focus search, Escape to clear
  useEffect(() => {
    if (!authed) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "e") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape") {
        if (search) setSearch("");
        else (e.target as HTMLElement)?.blur?.();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [authed, search]);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    players.forEach(p => (p.tags || "").split("|").filter(Boolean).forEach(t => s.add(t)));
    return Array.from(s).sort();
  }, [players]);

  const allOrigins = useMemo(() => {
    const s = new Set<string>();
    players.forEach(p => { if (p.origin) s.add(p.origin); });
    return Array.from(s).sort();
  }, [players]);

  const allRelationships = useMemo(() => {
    const s = new Set<string>();
    players.forEach(p => { if (p.relationship) s.add(p.relationship); });
    return Array.from(s).sort();
  }, [players]);

  const displayPlayers = useMemo(() => {
    let filtered = players;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((p) => {
        const nicks = splitNicknames(p.nickname).map(n => n.toLowerCase());
        const tags = (p.tags || "").split("|").map(t => t.trim().toLowerCase());
        return (
          p.uid === q ||
          p.uid.startsWith(q) ||
          p.name.toLowerCase().includes(q) ||
          nicks.some(n => n.includes(q)) ||
          tags.some(t => t.includes(q)) ||
          (p.origin || "").toLowerCase().includes(q) ||
          (p.relationship || "").toLowerCase().includes(q)
        );
      });
    } else {
      filtered = filterByCategory(filtered, activeCategory, categories);
    }

    if (activeTag) {
      filtered = filtered.filter(p =>
        (p.tags || "").split("|").map(t => t.trim()).includes(activeTag)
      );
    }
    if (activeOriginFilter) {
      filtered = filtered.filter(p =>
        (p.origin || "").toLowerCase() === activeOriginFilter.toLowerCase()
      );
    }
    if (activeRelFilter) {
      filtered = filtered.filter(p =>
        (p.relationship || "").toLowerCase() === activeRelFilter.toLowerCase()
      );
    }

    return sortPlayers(filtered, sort);
  }, [players, search, activeCategory, categories, sort, activeTag, activeOriginFilter, activeRelFilter]);

  const playerCounts = useMemo(() => {
    const counts: Record<string, number> = { all: players.length };
    counts["dated"]   = players.filter(p => !!p.date).length;
    counts["undated"] = players.filter(p => !p.date).length;
    counts["starred"] = players.filter(p => categories.starred.includes(p.uid)).length;
    categories.custom.forEach(c => {
      counts[c.id] = players.filter(p => c.uids.includes(p.uid)).length;
    });
    return counts;
  }, [players, categories]);

  const hasActiveFilter = activeTag || activeOriginFilter || activeRelFilter;

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
          Celestial Archive
        </h1>
        <p className="text-xs tracking-widest uppercase" style={{ color: "rgba(196,181,253,0.4)" }}>Friends Access ✦</p>
        <div className="divider-gold w-32 sm:w-48 mx-auto mt-4" />
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-4 pb-20">
        {/* Search */}
        <section className="mb-5">
          <SearchBox value={search} onValueChange={setSearch} inputRef={searchInputRef} />
          {search && (
            <p className="text-sm text-center mt-2" style={{ color: "rgba(196,181,253,0.4)" }}>
              {displayPlayers.length === 0 ? "No traveler found"
                : `${displayPlayers.length} result${displayPlayers.length !== 1 ? "s" : ""}`}
            </p>
          )}
        </section>

        {/* Category bar + sort */}
        {!search && (
          <div className="mb-5 flex flex-col gap-4">
            <CategoryBar categories={categories} active={activeCategory}
              onChange={(c) => { setActiveCategory(c); }}
              playerCounts={playerCounts} />
            <div className="flex justify-center">
              <SortControls sort={sort} onChange={setSort} />
            </div>
          </div>
        )}

        {/* Filter strip */}
        {(allTags.length > 0 || allOrigins.length > 0 || allRelationships.length > 0) && (
          <div className="flex flex-wrap gap-2 mb-5">
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
            {hasActiveFilter && (
              <button onClick={() => { setActiveTag(null); setActiveOriginFilter(null); setActiveRelFilter(null); }}
                className="text-xs px-2 py-1 rounded-full"
                style={{ color: "rgba(196,181,253,0.35)", border: "1px solid rgba(196,181,253,0.1)" }}>
                ✕ clear all
              </button>
            )}
          </div>
        )}

        {/* Count */}
        {!loading && (
          <p className="text-xs mb-4" style={{ color: "rgba(196,181,253,0.35)" }}>
            {displayPlayers.length} entr{displayPlayers.length !== 1 ? "ies" : "y"} shown
            {hasActiveFilter && <span style={{ color: "rgba(196,181,253,0.25)" }}> · filtered</span>}
          </p>
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