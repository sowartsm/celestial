"use client";

import { useState } from "react";
import type { Player } from "@/lib/types";
import { splitNicknames, formatDate } from "@/lib/utils";

export type ViewLevel = "public" | "friend" | "admin";

interface PlayerCardProps {
  player: Player;
  index?: number;
  isStarred?: boolean;
  onToggleStar?: (uid: string) => void;
  showNoteDot?: boolean;
  viewLevel?: ViewLevel;
}

function NoteDot({ color }: { color: "green" | "blue" | "red" }) {
  const colors = {
    green: { bg: "var(--teal-400)", shadow: "rgba(45,212,191,0.5)" },
    blue:  { bg: "#7dd3fc",         shadow: "rgba(125,211,252,0.5)" },
    red:   { bg: "rgba(248,113,113,0.9)", shadow: "rgba(248,113,113,0.5)" },
  };
  const c = colors[color];
  return (
    <div title={color === "green" ? "Has a public note" : color === "blue" ? "Has a friend note" : "Has a private note"}
      style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: c.bg, boxShadow: `0 0 5px ${c.shadow}` }} />
  );
}

function TagChip({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: "0.65rem", padding: "0.1rem 0.5rem", borderRadius: "9999px",
      background: `${color}14`, border: `1px solid ${color}33`, color: `${color}bb`,
      whiteSpace: "nowrap",
    }}>{label}</span>
  );
}

export function PlayerModal({
  player, onClose, viewLevel = "public",
}: {
  player: Player; onClose: () => void; viewLevel?: ViewLevel;
}) {
  const nicks = splitNicknames(player.nickname);
  const hasPublicNote  = !!player.note?.trim();
  const hasFriendNote  = !!player.friendNote?.trim();
  const hasPrivateNote = !!player.privateNote?.trim();
  const tags = (player.tags || "").split("|").filter(Boolean);
  const isFriendOrAdmin = viewLevel === "friend" || viewLevel === "admin";

  return (
    <div className="note-modal modal-backdrop" onClick={onClose}>
      <div className="note-modal-box" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4"
          style={{ color: "rgba(200,169,110,0.35)", transition: "color 0.2s" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(200,169,110,0.8)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(200,169,110,0.35)")}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <p className="font-display font-bold mb-1 pr-8"
          style={{ fontSize: "1.35rem", color: "var(--lav-200)", letterSpacing: "0.04em" }}>
          {player.name}
        </p>

        {isFriendOrAdmin && nicks.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {nicks.map((n) => (
              <span key={n} style={{
                background: "rgba(196,181,253,0.1)", border: "1px solid rgba(196,181,253,0.22)",
                color: "rgba(196,181,253,0.75)", fontSize: "0.82rem",
                fontStyle: "italic", padding: "0.15rem 0.6rem", borderRadius: "9999px"
              }}>{n}</span>
            ))}
          </div>
        )}

        {/* Origin + Relationship */}
        {isFriendOrAdmin && (player.origin || player.relationship || tags.length > 0) && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {player.origin && <TagChip label={`@ ${player.origin}`} color="#2dd4bf" />}
            {player.relationship && <TagChip label={`◆ ${player.relationship}`} color="#c8a96e" />}
            {tags.map(t => <TagChip key={t} label={`# ${t}`} color="#a78bfa" />)}
          </div>
        )}

        <div className="divider-gold mb-4" />

        <div className="flex items-center gap-5 mb-5">
          <span className="uid-badge" style={{ fontSize: "0.95rem" }}>UID {player.uid}</span>
          {player.date && (
            <span style={{ color: "rgba(94,234,212,0.6)", fontSize: "0.9rem" }}>
              {formatDate(player.date)}
            </span>
          )}
        </div>

        {hasPublicNote && (
          <div className="rounded-xl p-4 mb-3" style={{
            background: "rgba(45,212,191,0.04)", border: "1px solid rgba(45,212,191,0.14)",
            borderLeft: "3px solid rgba(45,212,191,0.35)"
          }}>
            <p style={{ color: "rgba(94,234,212,0.45)", fontSize: "0.72rem", fontFamily: "'Cinzel', serif", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "0.5rem" }}>Note</p>
            <p style={{ color: "rgba(220,210,255,0.88)", fontSize: "0.97rem", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{player.note}</p>
          </div>
        )}

        {(viewLevel === "friend" || viewLevel === "admin") && hasFriendNote && (
          <div className="rounded-xl p-4 mb-3" style={{
            background: "rgba(125,211,252,0.04)", border: "1px solid rgba(125,211,252,0.14)",
            borderLeft: "3px solid rgba(125,211,252,0.35)"
          }}>
            <p style={{ color: "rgba(125,211,252,0.5)", fontSize: "0.72rem", fontFamily: "'Cinzel', serif", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "0.5rem" }}>Friends Note</p>
            <p style={{ color: "rgba(220,210,255,0.88)", fontSize: "0.97rem", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{player.friendNote}</p>
          </div>
        )}

        {viewLevel === "admin" && hasPrivateNote && (
          <div className="rounded-xl p-4" style={{
            background: "rgba(248,113,113,0.04)", border: "1px solid rgba(248,113,113,0.14)",
            borderLeft: "3px solid rgba(248,113,113,0.35)"
          }}>
            <p style={{ color: "rgba(248,113,113,0.5)", fontSize: "0.72rem", fontFamily: "'Cinzel', serif", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "0.5rem" }}>Private Note</p>
            <p style={{ color: "rgba(220,210,255,0.88)", fontSize: "0.97rem", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{player.privateNote}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PlayerCard({
  player, index = 0, isStarred = false, onToggleStar,
  showNoteDot = false, viewLevel = "public",
}: PlayerCardProps) {
  const [showModal, setShowModal] = useState(false);
  const hasPublicNote  = !!player.note?.trim();
  const hasFriendNote  = !!player.friendNote?.trim();
  const hasPrivateNote = !!player.privateNote?.trim();
  const tags = (player.tags || "").split("|").filter(Boolean);
  const isFriendOrAdmin = viewLevel === "friend" || viewLevel === "admin";
  const isAdmin = viewLevel === "admin";

  let dotColor: "green" | "blue" | "red" | null = null;
  if (hasPublicNote && (showNoteDot || isFriendOrAdmin)) dotColor = "green";
  else if (!hasPublicNote && hasFriendNote && isFriendOrAdmin) dotColor = "blue";
  else if (!hasPublicNote && !hasFriendNote && hasPrivateNote && isAdmin) dotColor = "red";

  const hasAnyVisibleNote = hasPublicNote
    || (isFriendOrAdmin && hasFriendNote)
    || (isAdmin && hasPrivateNote);
  const isClickable = hasAnyVisibleNote && (showNoteDot || isFriendOrAdmin);

  return (
    <>
      <div
        className={`player-card glass-gold rounded-xl p-5 animate-fade-in-up ${isClickable ? "cursor-pointer" : ""} ${dotColor === "green" ? "has-note" : ""}`}
        style={{ animationDelay: `${index * 40}ms`, animationFillMode: "both" }}
        onClick={isClickable ? () => setShowModal(true) : undefined}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <p className="font-display font-semibold truncate"
                style={{ fontSize: "1.05rem", color: "var(--lav-300)", letterSpacing: "0.02em" }}>
                {player.name || "Unknown"}
              </p>
              {dotColor && <NoteDot color={dotColor} />}
              {isFriendOrAdmin && player.relationship && (
                <span style={{
                  fontSize: "0.6rem", padding: "0.1rem 0.5rem", borderRadius: "9999px",
                  background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.25)",
                  color: "rgba(200,169,110,0.7)", fontFamily: "'Cinzel', serif", letterSpacing: "0.05em",
                  whiteSpace: "nowrap",
                }}>{player.relationship.toUpperCase()}</span>
              )}
            </div>
            {player.date && (
              <p style={{ color: "rgba(94,234,212,0.5)", fontSize: "0.82rem", marginTop: "0.1rem" }}>
                {formatDate(player.date)}
              </p>
            )}
            {/* Origin only — no tags on cards */}
            {isFriendOrAdmin && player.origin && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                <span style={{
                  fontSize: "0.65rem", padding: "0.1rem 0.5rem", borderRadius: "9999px",
                  background: "rgba(45,212,191,0.08)", border: "1px solid rgba(45,212,191,0.2)",
                  color: "rgba(45,212,191,0.6)", whiteSpace: "nowrap",
                }}>@ {player.origin}</span>
              </div>
            )}
          </div>

          {onToggleStar && (
            <button onClick={(e) => { e.stopPropagation(); onToggleStar(player.uid); }}
              className={`star-btn flex-shrink-0 ${isStarred ? "active" : ""}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                fill={isStarred ? "currentColor" : "none"} stroke="currentColor"
                strokeWidth={1.5} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </button>
          )}
        </div>

        <div className="divider-gold my-3" />

        <div className="flex items-center justify-between">
          <p className="uid-badge">UID {player.uid}</p>
          {dotColor === "green" && <span style={{ color: "rgba(45,212,191,0.45)", fontSize: "0.78rem", fontFamily: "'Cinzel', serif", letterSpacing: "0.05em" }}>note ✦</span>}
          {dotColor === "blue" && <span style={{ color: "rgba(125,211,252,0.45)", fontSize: "0.78rem", fontFamily: "'Cinzel', serif", letterSpacing: "0.05em" }}>note ✦</span>}
          {dotColor === "red" && <span style={{ color: "rgba(248,113,113,0.35)", fontSize: "0.78rem", fontFamily: "'Cinzel', serif", letterSpacing: "0.05em" }}>private ✦</span>}
        </div>
      </div>

      {showModal && (
        <PlayerModal player={player} onClose={() => setShowModal(false)} viewLevel={viewLevel} />
      )}
    </>
  );
}