import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ─── Teams & Tiers ────────────────────────────────────────────────────────────
const TIERS = {
  1: { label: "Tier 1 — Top Contenders", sublabel: "FIFA Ranked 1–6", color: "#ff0080",
    teams: ["France","Spain","Argentina","England","Portugal","Brazil"] },
  2: { label: "Tier 2 — Contenders", sublabel: "FIFA Ranked 7–12", color: "#ff4dac",
    teams: ["Netherlands","Morocco","Belgium","Germany","Croatia","Colombia"] },
  3: { label: "Tier 3 — Dark Horses", sublabel: "FIFA Ranked 13–24", color: "#f48fb1",
    teams: ["Senegal","Mexico","USA","Uruguay","Japan","Austria","Ecuador","South Korea","Norway","Switzerland","Türkiye","Australia"] },
  4: { label: "Tier 4 — Wildcards", sublabel: "FIFA Ranked 25–36", color: "#ce93d8",
    teams: ["Iran","Denmark","Poland","Serbia","Sweden","Algeria","Ukraine","Scotland","Egypt","Ivory Coast","Bosnia and Herzegovina","Czechia"] },
  5: { label: "Tier 5 — Underdogs", sublabel: "FIFA Ranked 37–48", color: "#aaaaaa",
    teams: ["Canada","Nigeria","Ghana","Cameroon","Saudi Arabia","Qatar","New Zealand","Congo DR","South Africa","Cape Verde","Curaçao","Uzbekistan"] },
};

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

function computeScore(teams, groupResults, knockoutStages) {
  return teams.map(team => {
    const gr = groupResults[team] || [];
    const gPts = gr.reduce((s, r) => s + (r === "W" ? 3 : r === "D" ? 1 : 0), 0);
    const ks = knockoutStages[team];
    const kPts = ks ? (KNOCKOUT_PTS[ks] || 0) : 0;
    return { team, gPts, kPts, total: gPts + kPts };
  });
}

// ─── Color palette ────────────────────────────────────────────────────────────
const C = {
  bg: "#1e1e1e",
  bgGrad: "linear-gradient(160deg,#1e1e1e 0%,#252525 55%,#1e1e1e 100%)",
  card: "#2a2a2a",
  cardAlt: "#313131",
  border: "#3d3d3d",
  borderLight: "#333333",
  primary: "#ff0080",
  secondary: "#ff4dac",
  accent: "#ff0080",
  gold: "#ff4dac",
  text: "#f0f0f0",
  textMuted: "#aaaaaa",
  textDim: "#666666",
};

function ScoringTable() {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 20px", fontSize: 12, color: C.textMuted }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <div style={{ fontWeight: 700, color: C.text, marginBottom: 8, fontSize: 13 }}>Group Stage</div>
          {[["Win", "3 pts"], ["Draw", "1 pt"], ["Loss", "0 pts"]].map(([r, p]) => (
            <div key={r} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span>{r}</span><span style={{ color: C.text, fontWeight: 600 }}>{p}</span>
            </div>
          ))}
          <div style={{ marginTop: 8, fontSize: 11, color: C.textDim }}>3 games · max 9 pts · auto-updated</div>
        </div>
        <div>
          <div style={{ fontWeight: 700, color: C.text, marginBottom: 8, fontSize: 13 }}>Knockout Rounds</div>
          {Object.entries(KNOCKOUT_PTS).map(([stage, pts]) => (
            <div key={stage} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span>{stage}</span><span style={{ color: C.text, fontWeight: 600 }}>{pts} pts</span>
            </div>
          ))}
          <div style={{ marginTop: 8, fontSize: 11, color: C.textDim }}>Same for all tiers</div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("standings");
  const [participants, setParticipants] = useState([]);
  const [groupResults, setGroupResults] = useState({});
  const [knockoutStages, setKnockoutStages] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminPassInput, setAdminPassInput] = useState("");
  const [adminTab, setAdminTab] = useState("knockout");
  const [showScoring, setShowScoring] = useState(false);

  const [draftName, setDraftName] = useState("");
  const [draftPicks, setDraftPicks] = useState({ 1: null, 2: null, 3: null, 4: null, 5: null });
  const [draftDone, setDraftDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const fetchLiveScores = useCallback(async () => {
    try {
      const apiKey = import.meta.env.VITE_API_FOOTBALL_KEY;
      if (!apiKey) return;

      // World Cup 2026 league ID is 1 (FIFA World Cup) season 2026
      const res = await fetch("https://v3.football.api-sports.io/fixtures?league=1&season=2026", {
        headers: {
          "x-apisports-key": apiKey,
        }
      });
      if (!res.ok) return;
      const data = await res.json();
      const fixtures = data.response || [];

      const newGroupResults = {};
      const teamGameCount = {};
      const teamBestStage = {};
      const newKnockout = {};

      const knockoutRoundMap = {
        "Round of 32": "Round of 32",
        "Round of 16": "Round of 16",
        "Quarter-finals": "Quarterfinal",
        "Semi-finals": "Semifinal",
        "Final": null,
      };

      fixtures.forEach(fixture => {
        const status = fixture.fixture?.status?.short;
        const finished = ["FT", "AET", "PEN"].includes(status);
        if (!finished) return;

        const t1 = normalizeTeamName(fixture.teams?.home?.name);
        const t2 = normalizeTeamName(fixture.teams?.away?.name);
        const g1 = fixture.goals?.home;
        const g2 = fixture.goals?.away;
        if (g1 === null || g1 === undefined || g2 === null || g2 === undefined) return;

        const round = fixture.league?.round || "";
        const isGroup = round.toLowerCase().includes("group");

        if (isGroup) {
          if (!newGroupResults[t1]) newGroupResults[t1] = [];
          if (!newGroupResults[t2]) newGroupResults[t2] = [];
          if (!teamGameCount[t1]) teamGameCount[t1] = 0;
          if (!teamGameCount[t2]) teamGameCount[t2] = 0;
          const idx1 = teamGameCount[t1]++;
          const idx2 = teamGameCount[t2]++;
          if (g1 > g2) { newGroupResults[t1][idx1] = "W"; newGroupResults[t2][idx2] = "L"; }
          else if (g1 < g2) { newGroupResults[t1][idx1] = "L"; newGroupResults[t2][idx2] = "W"; }
          else { newGroupResults[t1][idx1] = "D"; newGroupResults[t2][idx2] = "D"; }
        } else {
          const mappedRound = knockoutRoundMap[round];
          const winner = g1 > g2 ? t1 : g1 < g2 ? t2 : null;
          const loser = g1 > g2 ? t2 : g1 < g2 ? t1 : null;
          if (round === "Final" && winner) {
            newKnockout[winner] = "Champion";
            if (loser) newKnockout[loser] = "Runner-Up";
          } else if (mappedRound && winner) {
            if (!teamBestStage[winner] || KNOCKOUT_PTS[mappedRound] > KNOCKOUT_PTS[teamBestStage[winner]]) teamBestStage[winner] = mappedRound;
            if (loser && (!teamBestStage[loser] || KNOCKOUT_PTS[mappedRound] > KNOCKOUT_PTS[teamBestStage[loser]])) teamBestStage[loser] = mappedRound;
          }
        }
      });

      Object.assign(newKnockout, teamBestStage);
      const grRows = [];
      Object.entries(newGroupResults).forEach(([team, results]) => {
        results.forEach((result, game_index) => {
          if (result) grRows.push({ team, game_index, result });
        });
      });
      if (grRows.length) await supabase.from("group_results").upsert(grRows, { onConflict: "team,game_index" });
      const ksRows = Object.entries(newKnockout).map(([team, stage]) => ({ team, stage }));
      if (ksRows.length) await supabase.from("knockout_stages").upsert(ksRows, { onConflict: "team" });
      await loadData();
    } catch (e) {
      console.error("Live score fetch error:", e);
    }
  }, [loadData]);

  useEffect(() => {
    loadData();
    fetchLiveScores();
    const interval = setInterval(fetchLiveScores, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadData, fetchLiveScores]);

  useEffect(() => {
    const channel = supabase.channel("pool-updates")
      .on("postgres_changes", { event: "*", schema: "public" }, loadData)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [loadData]);

  const scores = participants.map(p => {
    const breakdown = computeScore(p.teams, groupResults, knockoutStages);
    const total = breakdown.reduce((s, b) => s + b.total, 0);
    return { ...p, breakdown, total };
  }).sort((a, b) => b.total - a.total);

  const takenTeams = new Set(participants.flatMap(p => p.teams));

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
    else { setDraftDone(true); setDraftName(""); setDraftPicks({ 1: null, 2: null, 3: null, 4: null, 5: null }); }
    setSubmitting(false);
  }

  async function setKnockout(team, stage) {
    if (stage) {
      await supabase.from("knockout_stages").upsert({ team, stage }, { onConflict: "team" });
    } else {
      await supabase.from("knockout_stages").delete().eq("team", team);
    }
    loadData();
  }

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
    const colors = { "": C.borderLight, W: "#15803d", D: "#92400e", L: "#7f1d1d" };
    const textColors = { "": C.textDim, W: "#4ade80", D: "#fbbf24", L: "#f87171" };
    const v = value || "";
    return (
      <button onClick={() => onChange(cycle[v])}
        style={{ width: 32, height: 26, borderRadius: 4, border: `1px solid ${colors[v]}`, background: colors[v] + "44", color: textColors[v], fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
        {v || "—"}
      </button>
    );
  }

  const rankBorder = i => i === 0 ? "#ff0000" : i === 1 ? "#cc0000" : i === 2 ? "#990000" : C.border;

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", color: C.primary, fontFamily: "Georgia, serif", fontSize: 18 }}>
      Loading pool data...
    </div>
  );

  const allPicked = Object.values(draftPicks).every(p => p !== null);

  return (
    <div style={{ minHeight: "100vh", background: C.bgGrad, color: C.text, fontFamily: "'Georgia','Times New Roman',serif" }}>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(13,0,16,0.95)", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 100, gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24 }}>⚽</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1, color: C.primary }}>MERGE 2026 WORLD CUP POOL</div>
            <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: 1 }}>Brought to you by the CardioConnect Committee</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {lastUpdated && (
            <span style={{ fontSize: 11, color: C.textDim }}>
              Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <a href="https://www.google.com/search?q=2026+world+cup+schedule" target="_blank" rel="noreferrer" style={{ background: C.primary, border: "none", borderRadius: 6, color: "#1e1e1e", fontSize: 11, padding: "5px 11px", cursor: "pointer", fontWeight: 700, textDecoration: "none" }}>📅 Schedule & Bracket</a>
          <button onClick={fetchLiveScores} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, color: C.textMuted, fontSize: 11, padding: "4px 10px", cursor: "pointer" }}>↻ Refresh</button>
          <nav style={{ display: "flex", gap: 6 }}>
            {[["standings", "🏆 Standings"], ["draft", "✍️ Join"], ["admin", "⚙️ Admin"]].map(([v, label]) => (
              <button key={v} onClick={() => setView(v)} style={{ background: view === v ? C.primary : "transparent", color: view === v ? "#0d0010" : C.textMuted, border: `1px solid ${view === v ? C.primary : C.border}`, borderRadius: 6, padding: "6px 14px", fontSize: 13, cursor: "pointer", fontWeight: view === v ? 700 : 400 }}>
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
                <h2 style={{ fontSize: 24, fontWeight: 700, color: C.primary, margin: 0 }}>Leaderboard</h2>
                <p style={{ color: C.textDim, marginTop: 4, fontSize: 13 }}>{participants.length} participant{participants.length !== 1 ? "s" : ""} · scores update automatically</p>
              </div>
              <button onClick={() => setShowScoring(s => !s)} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 14px", color: C.textMuted, fontSize: 12, cursor: "pointer" }}>
                {showScoring ? "Hide" : "Show"} Scoring
              </button>
            </div>
            {showScoring && <div style={{ marginBottom: 20 }}><ScoringTable /></div>}

            {scores.length === 0 ? (
              <div style={{ textAlign: "center", padding: "56px 20px", border: `2px dashed ${C.border}`, borderRadius: 14, color: C.textDim }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>⚽</div>
                <div style={{ fontSize: 18, marginBottom: 6 }}>No participants yet</div>
                <button onClick={() => setView("draft")} style={{ marginTop: 8, background: C.primary, color: "#0d0010", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>Be the first →</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {scores.map((p, i) => (
                  <div key={p.id} style={{ background: i === 0 ? "linear-gradient(120deg,#2e2e2e,#3a3a3a)" : C.card, border: `1px solid ${rankBorder(i)}`, borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: "#000000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: i < 3 ? 18 : 13, fontWeight: 900, color: i < 3 ? "#ffffff" : C.textDim }}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: i === 0 ? C.primary : C.text }}>{p.name}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {p.breakdown.map(({ team, gPts, kPts, total }) => {
                          const tier = getTeamTier(team);
                          return (
                            <span key={team} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: C.cardAlt, border: `1px solid ${TIERS[tier].color}44`, borderRadius: 6, padding: "3px 9px", fontSize: 12 }}>
                              <span>{FLAG[team] || "🏳️"}</span>
                              <span style={{ color: "#ddd0f0" }}>{team}</span>
                              {total > 0 && (
                                <span style={{ color: TIERS[tier].color, fontWeight: 700, fontSize: 11 }}>
                                  +{total}
                                  {gPts > 0 && kPts > 0 && <span style={{ color: C.textDim, fontWeight: 400 }}> ({gPts}g+{kPts}k)</span>}
                                  {gPts > 0 && kPts === 0 && <span style={{ color: C.textDim, fontWeight: 400 }}> (grp)</span>}
                                </span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 28, fontWeight: 900, color: i === 0 ? C.primary : C.text }}>{p.total}</div>
                      <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 1 }}>PTS</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {takenTeams.size > 0 && (
              <div style={{ marginTop: 36 }}>
                <h3 style={{ fontSize: 12, color: C.textDim, letterSpacing: 2, marginBottom: 14 }}>COUNTRY TRACKER</h3>
                {[1, 2, 3, 4, 5].map(tier => {
                  const active = TIERS[tier].teams.filter(t => participants.some(p => p.teams.includes(t)));
                  if (!active.length) return null;
                  return (
                    <div key={tier} style={{ marginBottom: 16 }}>
                      <div style={{ color: TIERS[tier].color, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{TIERS[tier].label}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 6 }}>
                        {active.map(t => {
                          const gr = groupResults[t] || [];
                          const ks = knockoutStages[t];
                          const { total } = computeScore([t], groupResults, knockoutStages)[0];
                          const owners = participants.filter(p => p.teams.includes(t)).map(p => p.name);
                          return (
                            <div key={t} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 7, padding: "8px 12px" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                                <span style={{ fontSize: 13 }}>{FLAG[t] || "🏳️"} {t}</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: total > 0 ? TIERS[tier].color : C.textDim }}>{total > 0 ? `+${total}` : ""}</span>
                              </div>
                              <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 6 }}>
                                {[0, 1, 2].map(gi => (
                                  <span key={gi} style={{ width: 20, height: 20, borderRadius: 3, fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", background: gr[gi] === "W" ? "#15803d44" : gr[gi] === "D" ? "#92400e44" : gr[gi] === "L" ? "#7f1d1d44" : C.borderLight, color: gr[gi] === "W" ? "#4ade80" : gr[gi] === "D" ? "#fbbf24" : gr[gi] === "L" ? "#f87171" : C.textDim, border: `1px solid ${gr[gi] === "W" ? "#15803d" : gr[gi] === "D" ? "#92400e" : gr[gi] === "L" ? "#7f1d1d" : C.border}` }}>
                                    {gr[gi] || "·"}
                                  </span>
                                ))}
                                {ks && <span style={{ fontSize: 10, color: C.accent, marginLeft: 4 }}>{ks}</span>}
                              </div>
                              <div style={{ fontSize: 10, color: C.textMuted, lineHeight: 1.4 }}>
                                {owners.join(", ")}
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
            <h2 style={{ fontSize: 24, fontWeight: 700, color: C.primary, marginBottom: 4 }}>Join the Pool</h2>
            <p style={{ color: C.textMuted, marginBottom: 12, fontSize: 13 }}>
              Pick <strong style={{ color: C.text }}>1 team per tier</strong> — 5 picks total. Group stage points update automatically as games happen.
            </p>
            <div style={{ marginBottom: 20 }}><ScoringTable /></div>

            {draftDone ? (
              <div style={{ textAlign: "center", padding: 48, border: `2px solid ${C.primary}`, borderRadius: 16 }}>
                <div style={{ fontSize: 52, marginBottom: 10 }}>🎉</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.primary, marginBottom: 8 }}>You're in!</div>
                <div style={{ color: C.textMuted, marginBottom: 24, fontSize: 14 }}>Your picks are locked. Check standings as games kick off.</div>
                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                  <button onClick={() => setView("standings")} style={{ background: C.primary, color: "#0d0010", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 700, cursor: "pointer" }}>View Standings</button>
                  <button onClick={() => setDraftDone(false)} style={{ background: "transparent", color: C.textMuted, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 24px", cursor: "pointer" }}>Add Another Person</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, color: C.textMuted, display: "block", marginBottom: 6, letterSpacing: 1 }}>YOUR NAME</label>
                  <input value={draftName} onChange={e => setDraftName(e.target.value)} placeholder="Enter your name..."
                    style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", color: C.text, fontSize: 16, width: "100%", outline: "none", boxSizing: "border-box" }} />
                </div>
                {[1, 2, 3, 4, 5].map(tier => {
                  const t = TIERS[tier];
                  return (
                    <div key={tier} style={{ background: C.card, border: `1px solid ${t.color}44`, borderRadius: 12, padding: "18px", marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                        <div style={{ width: 9, height: 9, borderRadius: "50%", background: t.color, flexShrink: 0 }} />
                        <span style={{ color: t.color, fontWeight: 700, fontSize: 14 }}>{t.label}</span>
                        <span style={{ color: C.textDim, fontSize: 12 }}>{t.sublabel}</span>
                        {draftPicks[tier] && <span style={{ marginLeft: "auto", color: "#4ade80", fontSize: 13 }}>✓ {FLAG[draftPicks[tier]]} {draftPicks[tier]}</span>}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                        {t.teams.map(team => {
                          const selected = draftPicks[tier] === team;
                          const ownerCount = participants.filter(p => p.teams.includes(team)).length;
                          return (
                            <button key={team} onClick={() => setDraftPicks(prev => ({ ...prev, [tier]: team }))}
                              style={{ background: selected ? t.color : C.cardAlt, color: selected ? "#1e1e1e" : "#ddd0f0", border: `1px solid ${selected ? t.color : C.border}`, borderRadius: 7, padding: "6px 12px", cursor: "pointer", fontSize: 13, fontWeight: selected ? 700 : 400 }}>
                              {FLAG[team] || "🏳️"} {team}{ownerCount > 0 ? <span style={{ fontSize: 10, opacity: 0.6, marginLeft: 4 }}>×{ownerCount}</span> : ""}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                <button onClick={submitDraft} disabled={submitting || !draftName.trim() || !allPicked}
                  style={{ width: "100%", padding: "14px", fontSize: 16, fontWeight: 700, background: (!draftName.trim() || !allPicked) ? C.cardAlt : C.primary, color: (!draftName.trim() || !allPicked) ? C.textDim : "#0d0010", border: "none", borderRadius: 10, cursor: "pointer" }}>
                  {submitting ? "Saving..." : (!draftName.trim() || !allPicked) ? "Pick 1 team from each tier to continue" : "Lock In My Picks →"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── ADMIN ── */}
        {view === "admin" && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: C.primary, marginBottom: 4 }}>Admin Panel</h2>
            <p style={{ color: C.textDim, marginBottom: 20, fontSize: 13 }}>Group stage auto-updates from live data. Use this to override or set knockout stages manually.</p>

            {!adminUnlocked ? (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 32, maxWidth: 380 }}>
                <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 10 }}>Admin Password</div>
                <input type="password" value={adminPassInput} onChange={e => setAdminPassInput(e.target.value)} onKeyDown={e => e.key === "Enter" && unlockAdmin()} placeholder="Enter password..."
                  style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", color: C.text, fontSize: 14, width: "100%", boxSizing: "border-box", outline: "none", marginBottom: 12 }} />
                <button onClick={unlockAdmin} style={{ background: C.primary, color: "#0d0010", border: "none", borderRadius: 8, padding: "10px", fontWeight: 700, cursor: "pointer", width: "100%" }}>Unlock →</button>
              </div>
            ) : (
              <div>
                <div style={{ background: "#0a1a0a", border: "1px solid #1a4020", borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontSize: 13, color: "#4ade80" }}>✓ Admin access granted</div>
                <div style={{ display: "flex", gap: 6, marginBottom: 24, borderBottom: `1px solid ${C.border}`, paddingBottom: 12 }}>
                  {[["knockout", "🏆 Knockout Stages"], ["group", "⚽ Group Override"], ["participants", "👥 Participants"]].map(([tab, label]) => (
                    <button key={tab} onClick={() => setAdminTab(tab)} style={{ background: adminTab === tab ? C.borderLight : "transparent", color: adminTab === tab ? C.text : C.textMuted, border: `1px solid ${adminTab === tab ? C.border : C.borderLight}`, borderRadius: 6, padding: "6px 14px", fontSize: 13, cursor: "pointer" }}>
                      {label}
                    </button>
                  ))}
                </div>

                {adminTab === "knockout" && (
                  <div>
                    <p style={{ color: C.textMuted, fontSize: 13, marginBottom: 20 }}>Set how far each team advanced. Only needed for knockout rounds — group stage is automatic.</p>
                    {[1, 2, 3, 4, 5].map(tier => (
                      <div key={tier} style={{ marginBottom: 22 }}>
                        <div style={{ color: TIERS[tier].color, fontSize: 13, fontWeight: 700, marginBottom: 10 }}>{TIERS[tier].label}</div>
                        <div style={{ display: "grid", gap: 6, gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))" }}>
                          {TIERS[tier].teams.map(team => {
                            const ks = knockoutStages[team] || "";
                            const kPts = ks && KNOCKOUT_PTS[ks] ? KNOCKOUT_PTS[ks] : 0;
                            return (
                              <div key={team} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                                <span style={{ fontSize: 13, flex: 1 }}>{FLAG[team] || "🏳️"} {team}</span>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                  {kPts > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: C.primary }}>+{kPts}</span>}
                                  <select value={ks} onChange={e => setKnockout(team, e.target.value)}
                                    style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "4px 8px", color: C.text, fontSize: 12, cursor: "pointer", outline: "none" }}>
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
                    <p style={{ color: C.textMuted, fontSize: 13, marginBottom: 20 }}>Group stage auto-updates from live data. Use this to manually override if needed.</p>
                    {[1, 2, 3, 4, 5].map(tier => (
                      <div key={tier} style={{ marginBottom: 22 }}>
                        <div style={{ color: TIERS[tier].color, fontSize: 13, fontWeight: 700, marginBottom: 10 }}>{TIERS[tier].label}</div>
                        <div style={{ display: "grid", gap: 6, gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))" }}>
                          {TIERS[tier].teams.map(team => {
                            const gr = groupResults[team] || [null, null, null];
                            const gPts = gr.reduce((s, r) => s + (r === "W" ? 3 : r === "D" ? 1 : 0), 0);
                            return (
                              <div key={team} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                                <span style={{ fontSize: 13, flex: 1 }}>{FLAG[team] || "🏳️"} {team}</span>
                                <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>
                                  {[0, 1, 2].map(gi => (
                                    <ResultBtn key={gi} value={gr[gi] || ""} onChange={val => setGroupResult(team, gi, val)} />
                                  ))}
                                  <span style={{ fontSize: 12, fontWeight: 700, color: gPts > 0 ? C.primary : C.textDim, minWidth: 28, textAlign: "right" }}>{gPts > 0 ? `${gPts}pt` : ""}</span>
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
                      <div style={{ color: C.textDim, fontSize: 14 }}>No participants yet.</div>
                    ) : participants.map(p => (
                      <div key={p.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 18px", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <div>
                          <div style={{ fontWeight: 700, marginBottom: 6 }}>{p.name}</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {p.teams.map(t => <span key={t} style={{ fontSize: 12, color: C.textMuted }}>{FLAG[t]} {t}</span>)}
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

      <div style={{ borderTop: `1px solid ${C.borderLight}`, marginTop: 60, padding: "18px", textAlign: "center", fontSize: 11, color: C.textDim }}>
        Merge 2026 World Cup Pool · June 11 – July 19, 2026 · Scores via API-Football
      </div>
    </div>
  );
}
