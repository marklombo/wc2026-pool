import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── Supabase client ──────────────────────────────────────────────────────────
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ─── Teams & Tiers ────────────────────────────────────────────────────────────
const TIERS = {
  1: { label: "Tier 1 — Contenders", sublabel: "FIFA Ranked 1–12", color: "#FFD700",
    teams: ["France","Spain","Argentina","England","Portugal","Brazil","Netherlands","Morocco","Belgium","Germany","Croatia","Colombia"] },
  2: { label: "Tier 2 — Dark Horses", sublabel: "FIFA Ranked 13–24", color: "#C0C0C0",
    teams: ["Senegal","Mexico","USA","Uruguay","Japan","Austria","Ecuador","South Korea","Norway","Switzerland","Türkiye","Australia"] },
  3: { label: "Tier 3 — Wildcards", sublabel: "FIFA Ranked 25–36", color: "#CD7F32",
    teams: ["Iran","Denmark","Poland","Serbia","Sweden","Algeria","Ukraine","Scotland","Egypt","Ivory Coast","Bosnia and Herzegovina","Czechia"] },
  4: { label: "Tier 4 — Underdogs", sublabel: "FIFA Ranked 37–48", color: "#6BA3BE",
    teams: ["Canada","Nigeria","Ghana","Cameroon","Saudi Arabia","Qatar","New Zealand","Congo DR","South Africa","Cape Verde","Curaçao","Uzbekistan"] },
};

// ─── Scoring ──────────────────────────────────────────────────────────────────
// Group stage: Win=3, Draw=1, Loss=0 (pulled automatically from API)
// Knockout rounds, same for all tiers, each round worth 1 more than last:
// R32=4, R16=5, QF=6, SF=7, Runner-Up=8, Champion=9
// (Group stage max = 9pts over 3 games, so knockout progression feels meaningful)
const KNOCKOUT_PTS = {
  "Round of 32": 4,
  "Round of 16": 5,
  "Quarterfinal": 6,
  "Semifinal": 7,
  "Runner-Up": 8,
  "Champion": 9,
};

const FLAG = {
  France:"🇫🇷",Spain:"🇪🇸",Argentina:"🇦🇷",England:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",Portugal:"🇵🇹",
  Brazil:"🇧🇷",Netherlands:"🇳🇱",Morocco:"🇲🇦",Belgium:"🇧🇪",Germany:"🇩🇪",
  Croatia:"🇭🇷",Colombia:"🇨🇴",Senegal:"🇸🇳",Mexico:"🇲🇽",USA:"🇺🇸",
  Uruguay:"🇺🇾",Japan:"🇯🇵",Austria:"🇦🇹",Ecuador:"🇪🇨","South Korea":"🇰🇷",
  Norway:"🇳🇴",Switzerland:"🇨🇭","Türkiye":"🇹🇷",Australia:"🇦🇺",
  Iran:"🇮🇷",Denmark:"🇩🇰",Poland:"🇵🇱",Serbia:"🇷🇸",Sweden:"🇸🇪",
  Algeria:"🇩🇿",Ukraine:"🇺🇦",Scotland:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",Egypt:"🇪🇬","Ivory Coast":"🇨🇮",
  "Bosnia and Herzegovina":"🇧🇦",Czechia:"🇨🇿",Canada:"🇨🇦",Nigeria:"🇳🇬",
  Ghana:"🇬🇭",Cameroon:"🇨🇲","Saudi Arabia":"🇸🇦",Qatar:"🇶🇦",
  "New Zealand":"🇳🇿","Congo DR":"🇨🇩","South Africa":"🇿🇦",
  "Cape Verde":"🇨🇻","Curaçao":"🇨🇼",Uzbekistan:"🇺🇿",
};

// Map openfootball team names → our names
const TEAM_NAME_MAP = {
  "South Korea": "South Korea", "Korea Republic": "South Korea",
  "Ivory Coast": "Ivory Coast", "Côte d'Ivoire": "Ivory Coast",
  "USA": "USA", "United States": "USA",
  "Bosnia": "Bosnia and Herzegovina",
  "Bosnia-Herzegovina": "Bosnia and Herzegovina",
  "DR Congo": "Congo DR", "Congo DR": "Congo DR",
  "Czechia": "Czechia", "Czech Republic": "Czechia",
  "Türkiye": "Türkiye", "Turkey": "Türkiye",
  "Curaçao": "Curaçao",
};

function normalizeTeamName(name) {
  return TEAM_NAME_MAP[name] || name;
}

function getTeamTier(team) {
  return parseInt(Object.entries(TIERS).find(([, t]) => t.teams.includes(team))?.[0] ?? "1");
}

// ─── Compute pool points for one participant ──────────────────────────────────
function computeScore(teams, groupResults, knockoutStages) {
  return teams.map(team => {
    const gr = groupResults[team] || [];
    const gPts = gr.reduce((s, r) => s + (r === "W" ? 3 : r === "D" ? 1 : 0), 0);
    const ks = knockoutStages[team];
    const kPts = ks ? (KNOCKOUT_PTS[ks] || 0) : 0;
    return { team, gPts, kPts, total: gPts + kPts };
  });
}

// ─── Scoring reference table ──────────────────────────────────────────────────
function ScoringTable() {
  return (
    <div style={{ background: "#08121e", border: "1px solid #1a3050", borderRadius: 10, padding: "16px 20px", fontSize: 12, color: "#8ba3c4" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <div style={{ fontWeight: 700, color: "#e8eaf6", marginBottom: 8, fontSize: 13 }}>Group Stage</div>
          {[["Win", "3 pts"], ["Draw", "1 pt"], ["Loss", "0 pts"]].map(([r, p]) => (
            <div key={r} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span>{r}</span><span style={{ color: "#e8eaf6", fontWeight: 600 }}>{p}</span>
            </div>
          ))}
          <div style={{ marginTop: 8, fontSize: 11, color: "#3a5070" }}>3 games · max 9 pts · auto-updated</div>
        </div>
        <div>
          <div style={{ fontWeight: 700, color: "#e8eaf6", marginBottom: 8, fontSize: 13 }}>Knockout Rounds</div>
          {Object.entries(KNOCKOUT_PTS).map(([stage, pts]) => (
            <div key={stage} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span>{stage}</span><span style={{ color: "#e8eaf6", fontWeight: 600 }}>{pts} pts</span>
            </div>
          ))}
          <div style={{ marginTop: 8, fontSize: 11, color: "#3a5070" }}>Same for all tiers</div>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("standings");
  const [participants, setParticipants] = useState([]);
  const [groupResults, setGroupResults] = useState({});   // { team: ["W","D","L"] }
  const [knockoutStages, setKnockoutStages] = useState({}); // { team: "Round of 32" | ... }
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminPassInput, setAdminPassInput] = useState("");
  const [adminTab, setAdminTab] = useState("knockout");
  const [showScoring, setShowScoring] = useState(false);

  // Draft state
  const [draftName, setDraftName] = useState("");
  const [draftPicks, setDraftPicks] = useState({ 1: null, 2: null, 3: null, 4: null });
  const [draftDone, setDraftDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Load data from Supabase ─────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [{ data: parts }, { data: results }, { data: knockout }] = await Promise.all([
        supabase.from("participants").select("*").order("created_at"),
        supabase.from("group_results").select("*"),
        supabase.from("knockout_stages").select("*"),
      ]);

      setParticipants(parts || []);

      const grMap = {};
      (results || []).forEach(r => {
        if (!grMap[r.team]) grMap[r.team] = [];
        grMap[r.team][r.game_index] = r.result;
      });
      setGroupResults(grMap);

      const ksMap = {};
      (knockout || []).forEach(k => { ksMap[k.team] = k.stage; });
      setKnockoutStages(ksMap);
      setLastUpdated(new Date());
    } catch (e) {
      console.error("Load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch live scores from openfootball ──────────────────────────────────────
  const fetchLiveScores = useCallback(async () => {
    try {
      const res = await fetch("https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json");
      if (!res.ok) return;
      const data = await res.json();

      const newGroupResults = {};
      const newKnockout = {};

      const knockoutRoundMap = {
        "Round of 32": "Round of 32",
        "Round of 16": "Round of 16",
        "Quarterfinals": "Quarterfinal",
        "Quarterfinal": "Quarterfinal",
        "Semifinals": "Semifinal",
        "Semifinal": "Semifinal",
        "Final": null, // handled separately
      };

      // Track furthest stage per team
      const teamBestStage = {};

      (data.matches || []).forEach(match => {
        if (!match.score) return; // not played yet
        const { ft } = match.score;
        if (!ft || ft.length < 2) return;

        const t1 = normalizeTeamName(match.team1);
        const t2 = normalizeTeamName(match.team2);
        const [g1, g2] = ft;
        const round = match.round || "";

        const isGroup = round.toLowerCase().includes("matchday") || round.toLowerCase().includes("group");

        if (isGroup) {
          // Group stage results
          if (!newGroupResults[t1]) newGroupResults[t1] = [];
          if (!newGroupResults[t2]) newGroupResults[t2] = [];
          if (g1 > g2) {
            newGroupResults[t1].push("W");
            newGroupResults[t2].push("L");
          } else if (g1 < g2) {
            newGroupResults[t1].push("L");
            newGroupResults[t2].push("W");
          } else {
            newGroupResults[t1].push("D");
            newGroupResults[t2].push("D");
          }
        } else {
          // Knockout stage
          const mappedRound = knockoutRoundMap[round];
          const winner = g1 > g2 ? t1 : g1 < g2 ? t2 : null;
          const loser = g1 > g2 ? t2 : g1 < g2 ? t1 : null;

          if (round === "Final" && winner) {
            newKnockout[winner] = "Champion";
            newKnockout[loser] = "Runner-Up";
          } else if (mappedRound && winner) {
            // The winner advances (will be overwritten by later rounds)
            if (!teamBestStage[winner] || KNOCKOUT_PTS[mappedRound] > KNOCKOUT_PTS[teamBestStage[winner]]) {
              teamBestStage[winner] = mappedRound;
            }
            // The loser's best stage is this round
            if (!teamBestStage[loser] || KNOCKOUT_PTS[mappedRound] > KNOCKOUT_PTS[teamBestStage[loser]]) {
              teamBestStage[loser] = mappedRound;
            }
          }
        }
      });

      Object.assign(newKnockout, teamBestStage);

      // Upsert to Supabase
      const grRows = [];
      Object.entries(newGroupResults).forEach(([team, results]) => {
        results.forEach((result, game_index) => {
          grRows.push({ team, game_index, result });
        });
      });

      if (grRows.length) {
        await supabase.from("group_results").upsert(grRows, { onConflict: "team,game_index" });
      }

      const ksRows = Object.entries(newKnockout).map(([team, stage]) => ({ team, stage }));
      if (ksRows.length) {
        await supabase.from("knockout_stages").upsert(ksRows, { onConflict: "team" });
      }

      await loadData();
    } catch (e) {
      console.error("Live score fetch error:", e);
    }
  }, [loadData]);

  useEffect(() => {
    loadData();
    fetchLiveScores();
    // Refresh every 5 minutes
    const interval = setInterval(fetchLiveScores, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadData, fetchLiveScores]);

  // ── Real-time subscription ───────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase.channel("pool-updates")
      .on("postgres_changes", { event: "*", schema: "public" }, loadData)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [loadData]);

  // ── Computed standings ───────────────────────────────────────────────────────
  const scores = participants.map(p => {
    const breakdown = computeScore(p.teams, groupResults, knockoutStages);
    const total = breakdown.reduce((s, b) => s + b.total, 0);
    return { ...p, breakdown, total };
  }).sort((a, b) => b.total - a.total);

  const takenTeams = new Set(participants.flatMap(p => p.teams));

  // ── Submit draft ─────────────────────────────────────────────────────────────
  async function submitDraft() {
    const picks = Object.values(draftPicks);
    if (!draftName.trim() || picks.some(p => !p)) return;
    if (participants.find(p => p.name.toLowerCase() === draftName.trim().toLowerCase())) {
      alert("That name is already taken!"); return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("participants").insert({
      name: draftName.trim(),
      teams: picks,
    });
    if (error) { alert("Error saving picks: " + error.message); }
    else { setDraftDone(true); setDraftName(""); setDraftPicks({ 1: null, 2: null, 3: null, 4: null }); }
    setSubmitting(false);
  }

  // ── Admin: update knockout stage ─────────────────────────────────────────────
  async function setKnockout(team, stage) {
    if (stage) {
      await supabase.from("knockout_stages").upsert({ team, stage }, { onConflict: "team" });
    } else {
      await supabase.from("knockout_stages").delete().eq("team", team);
    }
    loadData();
  }

  // ── Admin: update group result ───────────────────────────────────────────────
  async function setGroupResult(team, gameIdx, val) {
    if (val) {
      await supabase.from("group_results").upsert({ team, game_index: gameIdx, result: val }, { onConflict: "team,game_index" });
    } else {
      await supabase.from("group_results").delete().eq("team", team).eq("game_index", gameIdx);
    }
    loadData();
  }

  function unlockAdmin() {
    if (adminPassInput === import.meta.env.VITE_ADMIN_PASSWORD || adminPassInput === "admin2026") {
      setAdminUnlocked(true);
    } else {
      alert("Wrong password.");
    }
  }

  function ResultBtn({ value, onChange }) {
    const cycle = { "": "W", W: "D", D: "L", L: "" };
    const colors = { "": "#1a3050", W: "#15803d", D: "#92400e", L: "#7f1d1d" };
    const textColors = { "": "#3a5070", W: "#4ade80", D: "#fbbf24", L: "#f87171" };
    const v = value || "";
    return (
      <button onClick={() => onChange(cycle[v])}
        style={{ width: 32, height: 26, borderRadius: 4, border: `1px solid ${colors[v]}`, background: colors[v] + "44", color: textColors[v], fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
        {v || "—"}
      </button>
    );
  }

  const rankBorder = i => i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : "#1e3a5f";

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#04090f", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFD700", fontFamily: "Georgia, serif", fontSize: 18 }}>
      Loading pool data...
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#04090f 0%,#091522 55%,#060e1a 100%)", color: "#e8eaf6", fontFamily: "'Georgia','Times New Roman',serif" }}>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1a3050", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(4,9,15,0.9)", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 100, gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24 }}>⚽</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1.5, color: "#FFD700" }}>WC 2026 POOL</div>
            <div style={{ fontSize: 10, color: "#3a5070", letterSpacing: 2 }}>USA · MEXICO · CANADA</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {lastUpdated && (
            <span style={{ fontSize: 11, color: "#3a5070" }}>
              Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button onClick={fetchLiveScores} style={{ background: "transparent", border: "1px solid #1a3050", borderRadius: 6, color: "#4a6080", fontSize: 11, padding: "4px 10px", cursor: "pointer" }}>↻ Refresh</button>
          <nav style={{ display: "flex", gap: 6 }}>
            {[["standings", "🏆 Standings"], ["draft", "✍️ Join"], ["admin", "⚙️ Admin"]].map(([v, label]) => (
              <button key={v} onClick={() => setView(v)} style={{ background: view === v ? "#FFD700" : "transparent", color: view === v ? "#04090f" : "#6b82a0", border: `1px solid ${view === v ? "#FFD700" : "#1a3050"}`, borderRadius: 6, padding: "6px 14px", fontSize: 13, cursor: "pointer", fontWeight: view === v ? 700 : 400 }}>
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "28px 16px" }}>

        {/* ── STANDINGS ── */}
        {view === "standings" && (
          <div>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: "#FFD700", margin: 0 }}>Leaderboard</h2>
                <p style={{ color: "#3a5070", marginTop: 4, fontSize: 13 }}>{participants.length} participant{participants.length !== 1 ? "s" : ""} · scores update automatically</p>
              </div>
              <button onClick={() => setShowScoring(s => !s)} style={{ background: "transparent", border: "1px solid #1a3050", borderRadius: 8, padding: "7px 14px", color: "#6b82a0", fontSize: 12, cursor: "pointer" }}>
                {showScoring ? "Hide" : "Show"} Scoring
              </button>
            </div>
            {showScoring && <div style={{ marginBottom: 20 }}><ScoringTable /></div>}

            {scores.length === 0 ? (
              <div style={{ textAlign: "center", padding: "56px 20px", border: "2px dashed #1a3050", borderRadius: 14, color: "#3a5070" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>⚽</div>
                <div style={{ fontSize: 18, marginBottom: 6 }}>No participants yet</div>
                <button onClick={() => setView("draft")} style={{ marginTop: 8, background: "#FFD700", color: "#04090f", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>Be the first →</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {scores.map((p, i) => (
                  <div key={p.id} style={{ background: i === 0 ? "linear-gradient(120deg,#171e0a,#1e2e10)" : "#0a1424", border: `1px solid ${rankBorder(i)}`, borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: i < 3 ? rankBorder(i) : "#0e1b2e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: i < 3 ? 18 : 13, fontWeight: 900, color: i < 3 ? "#04090f" : "#3a5070" }}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: i === 0 ? "#FFD700" : "#e8eaf6" }}>{p.name}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {p.breakdown.map(({ team, gPts, kPts, total }) => {
                          const tier = getTeamTier(team);
                          return (
                            <span key={team} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#0e1b2e", border: `1px solid ${TIERS[tier].color}44`, borderRadius: 6, padding: "3px 9px", fontSize: 12 }}>
                              <span>{FLAG[team] || "🏳️"}</span>
                              <span style={{ color: "#cdd5e0" }}>{team}</span>
                              {total > 0 && (
                                <span style={{ color: TIERS[tier].color, fontWeight: 700, fontSize: 11 }}>
                                  +{total}
                                  {gPts > 0 && kPts > 0 && <span style={{ color: "#4a6080", fontWeight: 400 }}> ({gPts}g+{kPts}k)</span>}
                                  {gPts > 0 && kPts === 0 && <span style={{ color: "#4a6080", fontWeight: 400 }}> (grp)</span>}
                                </span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 28, fontWeight: 900, color: i === 0 ? "#FFD700" : "#e8eaf6" }}>{p.total}</div>
                      <div style={{ fontSize: 10, color: "#3a5070", letterSpacing: 1 }}>PTS</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Team tracker */}
            {takenTeams.size > 0 && (
              <div style={{ marginTop: 36 }}>
                <h3 style={{ fontSize: 12, color: "#3a5070", letterSpacing: 2, marginBottom: 14 }}>TEAM TRACKER</h3>
                {[1, 2, 3, 4].map(tier => {
                  const active = TIERS[tier].teams.filter(t => takenTeams.has(t));
                  if (!active.length) return null;
                  return (
                    <div key={tier} style={{ marginBottom: 16 }}>
                      <div style={{ color: TIERS[tier].color, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{TIERS[tier].label}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 6 }}>
                        {active.map(t => {
                          const gr = groupResults[t] || [];
                          const ks = knockoutStages[t];
                          const { total } = computeScore([t], groupResults, knockoutStages)[0];
                          return (
                            <div key={t} style={{ background: "#0a1424", border: "1px solid #1a3050", borderRadius: 7, padding: "8px 12px" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                                <span style={{ fontSize: 13 }}>{FLAG[t] || "🏳️"} {t}</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: total > 0 ? TIERS[tier].color : "#2a4060" }}>{total > 0 ? `+${total}` : ""}</span>
                              </div>
                              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                                {[0, 1, 2].map(gi => (
                                  <span key={gi} style={{ width: 20, height: 20, borderRadius: 3, fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", background: gr[gi] === "W" ? "#15803d44" : gr[gi] === "D" ? "#92400e44" : gr[gi] === "L" ? "#7f1d1d44" : "#1a3050", color: gr[gi] === "W" ? "#4ade80" : gr[gi] === "D" ? "#fbbf24" : gr[gi] === "L" ? "#f87171" : "#2a4060", border: `1px solid ${gr[gi] === "W" ? "#15803d" : gr[gi] === "D" ? "#92400e" : gr[gi] === "L" ? "#7f1d1d" : "#1a3050"}` }}>
                                    {gr[gi] || "·"}
                                  </span>
                                ))}
                                {ks && <span style={{ fontSize: 10, color: "#6ba3be", marginLeft: 4 }}>{ks}</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── DRAFT ── */}
        {view === "draft" && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: "#FFD700", marginBottom: 4 }}>Join the Pool</h2>
            <p style={{ color: "#3a5070", marginBottom: 12, fontSize: 13 }}>
              Pick <strong style={{ color: "#e8eaf6" }}>1 team per tier</strong>. Group stage points update automatically as games happen.
            </p>
            <div style={{ marginBottom: 20 }}><ScoringTable /></div>

            {draftDone ? (
              <div style={{ textAlign: "center", padding: 48, border: "2px solid #FFD700", borderRadius: 16 }}>
                <div style={{ fontSize: 52, marginBottom: 10 }}>🎉</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#FFD700", marginBottom: 8 }}>You're in!</div>
                <div style={{ color: "#6b82a0", marginBottom: 24, fontSize: 14 }}>Your picks are locked. Check standings as games kick off.</div>
                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                  <button onClick={() => setView("standings")} style={{ background: "#FFD700", color: "#04090f", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 700, cursor: "pointer" }}>View Standings</button>
                  <button onClick={() => setDraftDone(false)} style={{ background: "transparent", color: "#6b82a0", border: "1px solid #1a3050", borderRadius: 8, padding: "10px 24px", cursor: "pointer" }}>Add Another Person</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, color: "#6b82a0", display: "block", marginBottom: 6, letterSpacing: 1 }}>YOUR NAME</label>
                  <input value={draftName} onChange={e => setDraftName(e.target.value)} placeholder="Enter your name..."
                    style={{ background: "#0a1424", border: "1px solid #1a3050", borderRadius: 8, padding: "10px 14px", color: "#e8eaf6", fontSize: 16, width: "100%", outline: "none", boxSizing: "border-box" }} />
                </div>
                {[1, 2, 3, 4].map(tier => {
                  const t = TIERS[tier];
                  return (
                    <div key={tier} style={{ background: "#08121e", border: `1px solid ${t.color}33`, borderRadius: 12, padding: "18px", marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                        <div style={{ width: 9, height: 9, borderRadius: "50%", background: t.color, flexShrink: 0 }} />
                        <span style={{ color: t.color, fontWeight: 700, fontSize: 14 }}>{t.label}</span>
                        <span style={{ color: "#2a4060", fontSize: 12 }}>{t.sublabel}</span>
                        {draftPicks[tier] && <span style={{ marginLeft: "auto", color: "#4ade80", fontSize: 13 }}>✓ {FLAG[draftPicks[tier]]} {draftPicks[tier]}</span>}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                        {t.teams.map(team => {
                          const taken = takenTeams.has(team) && draftPicks[tier] !== team;
                          const selected = draftPicks[tier] === team;
                          return (
                            <button key={team} disabled={taken} onClick={() => setDraftPicks(prev => ({ ...prev, [tier]: team }))}
                              style={{ background: selected ? t.color : taken ? "#060e1a" : "#0e1b2e", color: selected ? "#04090f" : taken ? "#1a3050" : "#cdd5e0", border: `1px solid ${selected ? t.color : taken ? "#0e1b2e" : "#1e3a5f"}`, borderRadius: 7, padding: "6px 12px", cursor: taken ? "not-allowed" : "pointer", fontSize: 13, fontWeight: selected ? 700 : 400, textDecoration: taken ? "line-through" : "none" }}>
                              {FLAG[team] || "🏳️"} {team}{taken ? " ✗" : ""}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                <button onClick={submitDraft} disabled={submitting || !draftName.trim() || Object.values(draftPicks).some(p => !p)}
                  style={{ width: "100%", padding: "14px", fontSize: 16, fontWeight: 700, background: (!draftName.trim() || Object.values(draftPicks).some(p => !p)) ? "#0e1b2e" : "#FFD700", color: (!draftName.trim() || Object.values(draftPicks).some(p => !p)) ? "#2a4060" : "#04090f", border: "none", borderRadius: 10, cursor: "pointer" }}>
                  {submitting ? "Saving..." : (!draftName.trim() || Object.values(draftPicks).some(p => !p)) ? "Pick 1 team from each tier to continue" : "Lock In My Picks →"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── ADMIN ── */}
        {view === "admin" && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: "#FFD700", marginBottom: 4 }}>Admin Panel</h2>
            <p style={{ color: "#3a5070", marginBottom: 20, fontSize: 13 }}>Group stage auto-updates from live data. Use this to override or set knockout stages manually.</p>

            {!adminUnlocked ? (
              <div style={{ background: "#0a1424", border: "1px solid #1a3050", borderRadius: 12, padding: 32, maxWidth: 380 }}>
                <div style={{ fontSize: 13, color: "#6b82a0", marginBottom: 10 }}>Admin Password</div>
                <input type="password" value={adminPassInput} onChange={e => setAdminPassInput(e.target.value)} onKeyDown={e => e.key === "Enter" && unlockAdmin()} placeholder="Enter password..."
                  style={{ background: "#060e1a", border: "1px solid #1a3050", borderRadius: 8, padding: "10px 14px", color: "#e8eaf6", fontSize: 14, width: "100%", boxSizing: "border-box", outline: "none", marginBottom: 12 }} />
                <button onClick={unlockAdmin} style={{ background: "#FFD700", color: "#04090f", border: "none", borderRadius: 8, padding: "10px", fontWeight: 700, cursor: "pointer", width: "100%" }}>Unlock →</button>
                <div style={{ marginTop: 10, fontSize: 12, color: "#2a4060" }}>Set via VITE_ADMIN_PASSWORD env var, or default: <code style={{ color: "#4a6080" }}>admin2026</code></div>
              </div>
            ) : (
              <div>
                <div style={{ background: "#081808", border: "1px solid #1a4020", borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontSize: 13, color: "#4ade80" }}>✓ Admin access granted</div>
                <div style={{ display: "flex", gap: 6, marginBottom: 24, borderBottom: "1px solid #1a3050", paddingBottom: 12 }}>
                  {[["knockout", "🏆 Knockout Stages"], ["group", "⚽ Group Override"], ["participants", "👥 Participants"]].map(([tab, label]) => (
                    <button key={tab} onClick={() => setAdminTab(tab)} style={{ background: adminTab === tab ? "#1a3050" : "transparent", color: adminTab === tab ? "#e8eaf6" : "#4a6080", border: `1px solid ${adminTab === tab ? "#2a4a70" : "#1a3050"}`, borderRadius: 6, padding: "6px 14px", fontSize: 13, cursor: "pointer" }}>
                      {label}
                    </button>
                  ))}
                </div>

                {adminTab === "knockout" && (
                  <div>
                    <p style={{ color: "#4a6080", fontSize: 13, marginBottom: 20 }}>Set how far each team advanced. Only needed for knockout rounds — group stage is automatic.</p>
                    {[1, 2, 3, 4].map(tier => (
                      <div key={tier} style={{ marginBottom: 22 }}>
                        <div style={{ color: TIERS[tier].color, fontSize: 13, fontWeight: 700, marginBottom: 10 }}>{TIERS[tier].label}</div>
                        <div style={{ display: "grid", gap: 6, gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))" }}>
                          {TIERS[tier].teams.map(team => {
                            const ks = knockoutStages[team] || "";
                            const kPts = ks && KNOCKOUT_PTS[ks] ? KNOCKOUT_PTS[ks] : 0;
                            return (
                              <div key={team} style={{ background: "#0a1424", border: "1px solid #1a3050", borderRadius: 8, padding: "9px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                                <span style={{ fontSize: 13, flex: 1 }}>{FLAG[team] || "🏳️"} {team}</span>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                  {kPts > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: "#FFD700" }}>+{kPts}</span>}
                                  <select value={ks} onChange={e => setKnockout(team, e.target.value)}
                                    style={{ background: "#060e1a", border: "1px solid #1a3050", borderRadius: 6, padding: "4px 8px", color: "#e8eaf6", fontSize: 12, cursor: "pointer", outline: "none" }}>
                                    <option value="">— Group only —</option>
                                    {Object.entries(KNOCKOUT_PTS).map(([s, pts]) => (
                                      <option key={s} value={s}>{s} (+{pts})</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {adminTab === "group" && (
                  <div>
                    <p style={{ color: "#4a6080", fontSize: 13, marginBottom: 20 }}>Group stage auto-updates from live data. Use this to manually override if needed.</p>
                    {[1, 2, 3, 4].map(tier => (
                      <div key={tier} style={{ marginBottom: 22 }}>
                        <div style={{ color: TIERS[tier].color, fontSize: 13, fontWeight: 700, marginBottom: 10 }}>{TIERS[tier].label}</div>
                        <div style={{ display: "grid", gap: 6, gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))" }}>
                          {TIERS[tier].teams.map(team => {
                            const gr = groupResults[team] || [null, null, null];
                            const gPts = gr.reduce((s, r) => s + (r === "W" ? 3 : r === "D" ? 1 : 0), 0);
                            return (
                              <div key={team} style={{ background: "#0a1424", border: "1px solid #1a3050", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                                <span style={{ fontSize: 13, flex: 1 }}>{FLAG[team] || "🏳️"} {team}</span>
                                <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>
                                  {[0, 1, 2].map(gi => (
                                    <ResultBtn key={gi} value={gr[gi] || ""} onChange={val => setGroupResult(team, gi, val)} />
                                  ))}
                                  <span style={{ fontSize: 12, fontWeight: 700, color: gPts > 0 ? "#FFD700" : "#2a4060", minWidth: 28, textAlign: "right" }}>{gPts > 0 ? `${gPts}pt` : ""}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {adminTab === "participants" && (
                  <div>
                    {participants.length === 0 ? (
                      <div style={{ color: "#3a5070", fontSize: 14 }}>No participants yet.</div>
                    ) : participants.map(p => (
                      <div key={p.id} style={{ background: "#0a1424", border: "1px solid #1a3050", borderRadius: 10, padding: "14px 18px", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <div>
                          <div style={{ fontWeight: 700, marginBottom: 6 }}>{p.name}</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {p.teams.map(t => <span key={t} style={{ fontSize: 12, color: "#6b82a0" }}>{FLAG[t]} {t}</span>)}
                          </div>
                        </div>
                        <button onClick={async () => { await supabase.from("participants").delete().eq("id", p.id); loadData(); }}
                          style={{ background: "#2a0a0a", border: "1px solid #5a1a1a", borderRadius: 6, color: "#f87171", cursor: "pointer", padding: "6px 12px", fontSize: 12, flexShrink: 0 }}>Remove</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ borderTop: "1px solid #0e1e30", marginTop: 60, padding: "18px", textAlign: "center", fontSize: 11, color: "#1a3050" }}>
        WC2026 Pool · June 11 – July 19, 2026 · Scores via openfootball
      </div>
    </div>
  );
}
