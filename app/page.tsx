"use client";

import { useState, useEffect } from "react";
import type { Player } from "@/lib/types";
import SearchBox from "@/components/SearchBox";
import PlayerCard from "@/components/PlayerCard";

function LoginModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="note-modal modal-backdrop" onClick={onClose}>
      <div className="note-modal-box" style={{ maxWidth: 300, textAlign: "center" }}
        onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4"
          style={{ color: "rgba(196,181,253,0.35)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(196,181,253,0.8)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(196,181,253,0.35)")}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <p style={{ fontSize: "1.3rem", marginBottom: "0.25rem" }}>✨</p>
        <p className="font-display text-sm tracking-widest mb-1"
          style={{ color: "rgba(196,181,253,0.5)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
          Portal
        </p>
        <div className="divider-gold mb-5" />
        <div className="flex flex-col gap-3">
          <a href="/friends"
            className="btn-ghost w-full py-2.5 text-sm text-center block"
            style={{ borderRadius: "9999px" }}>
            ✦ Friends
          </a>
          <a href="/admin"
            className="btn-gold w-full py-2.5 text-sm text-center block">
            ⚙ Admin
          </a>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState("");
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    fetch("/api/players", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setPlayers(d.players || []));
  }, []);

  const result = search ? players.filter((p) => p.uid === search) : [];

  return (
    <div className="min-h-screen relative z-10 flex flex-col items-center">

      {/* Floating orb decorations */}
      <div className="fixed pointer-events-none" style={{
        top: "8%", left: "6%", width: 180, height: 180,
        background: "radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)",
        borderRadius: "50%", animation: "floatSlow 8s ease infinite"
      }} />
      <div className="fixed pointer-events-none" style={{
        bottom: "12%", right: "5%", width: 140, height: 140,
        background: "radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 70%)",
        borderRadius: "50%", animation: "floatSlow 10s ease infinite reverse"
      }} />

      {/* Header */}
      <header className="pt-14 pb-8 px-4 text-center w-full">
        {/* Top ornament */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div style={{ height: 1, width: 60, background: "linear-gradient(90deg, transparent, rgba(196,181,253,0.4))" }} />
          <span style={{ color: "rgba(240,189,179,0.8)", fontSize: "1.1rem", animation: "twinkle 3s ease infinite" }}>✦</span>
          <div style={{ height: 1, width: 60, background: "linear-gradient(90deg, rgba(196,181,253,0.4), transparent)" }} />
        </div>

        {/* Title — double click for secret login */}
        <h1
          className="font-display font-bold tracking-widest mb-2 select-none"
          style={{
            fontSize: "clamp(1.6rem, 5vw, 3rem)",
            color: "transparent",
            background: "linear-gradient(135deg, var(--lav-300) 0%, var(--rose-300) 50%, var(--lav-300) 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            cursor: "default",
            letterSpacing: "0.08em",
          }}
          onDoubleClick={() => setShowLogin(true)}
        >
          Celestial Archive
        </h1>

        <p style={{ color: "rgba(196,181,253,0.35)", fontSize: "0.78rem", letterSpacing: "0.3em", textTransform: "uppercase" }}>
          Genshin Impact · UID Lookup
        </p>

        {/* Bottom ornament */}
        <div className="flex items-center justify-center gap-2 mt-5">
          <div style={{ height: 1, width: 40, background: "linear-gradient(90deg, transparent, rgba(240,189,179,0.3))" }} />
          <span style={{ color: "rgba(240,189,179,0.4)", fontSize: "0.7rem" }}>✦ ✦ ✦</span>
          <div style={{ height: 1, width: 40, background: "linear-gradient(90deg, rgba(240,189,179,0.3), transparent)" }} />
        </div>
      </header>

      <main className="w-full max-w-md px-4 pb-20">
        {/* Search */}
        <div className="mb-6 flex flex-col items-center gap-3">
          <SearchBox value={search} onChange={setSearch} onClear={() => setSearch("")} />
          {search && (
            <p className="text-sm" style={{ color: "rgba(196,181,253,0.4)" }}>
              {result.length === 0
                ? "✦ No traveler found"
                : `✦ ${result.length} traveler${result.length !== 1 ? "s" : ""} found`}
            </p>
          )}
        </div>

        {/* Results */}
        {search && result.length > 0 && (
          <div className="flex flex-col gap-3">
            {result.map((p, i) => (
              <PlayerCard key={p.uid + p.file} player={p} index={i} showNoteDot />
            ))}
          </div>
        )}

        {!search && (
          <p className="text-center mt-16" style={{
            color: "rgba(196,181,253,0.18)",
            fontFamily: "'Cinzel', serif",
            letterSpacing: "0.12em",
            fontSize: "0.85rem"
          }}>
            Enter a UID to find a traveler
          </p>
        )}
      </main>

      <footer className="text-center pb-10 mt-auto">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div style={{ height: 1, width: 40, background: "linear-gradient(90deg, transparent, rgba(196,181,253,0.2))" }} />
          <span style={{ color: "rgba(196,181,253,0.2)", fontSize: "0.65rem" }}>✦</span>
          <div style={{ height: 1, width: 40, background: "linear-gradient(90deg, rgba(196,181,253,0.2), transparent)" }} />
        </div>
        <p style={{ color: "rgba(196,181,253,0.12)", fontSize: "0.72rem", letterSpacing: "0.2em", textTransform: "uppercase" }}>
          May Celestia guide your journey
        </p>
      </footer>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}