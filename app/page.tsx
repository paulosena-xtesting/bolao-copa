"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";

type Match = {
  id: string;
  home_team: string;
  away_team: string;
  match_date: string;
  finished: boolean;
  home_score: number | null;
  away_score: number | null;
  match_status: number | null;
  match_time: string | null;
};

export default function Home() {
  const [userName, setUserName] = useState("");
  const [totalMatches, setTotalMatches] = useState(0);
  const [totalPredictions, setTotalPredictions] = useState(0);
  const [todayMatches, setTodayMatches] = useState(0);
  const [nextMatch, setNextMatch] = useState<Match | null>(null);
  const [liveMatch, setLiveMatch] = useState<Match | null>(null);

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(() => {
    loadDashboard();
  }, 30000);

  return () => clearInterval(interval);
  }, []);

  async function loadDashboard() {
    const userId = localStorage.getItem("bolao_user_id");
    const name = localStorage.getItem("bolao_user_name");

    if (!userId) {
      window.location.href = "/login";
      return;
    }

    setUserName(name || "");

    const { data: matches } = await supabase
      .from("matches")
      .select("*")
      .order("match_date");

    setTotalMatches(matches?.length || 0);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const gamesToday =
      matches?.filter((match) => {
        const matchDate = new Date(match.match_date);
        return matchDate >= startOfToday && matchDate <= endOfToday;
      }).length || 0;

    setTodayMatches(gamesToday);

    const liveGame =
      matches?.find(
        (match) =>
          !match.finished &&
          match.home_score !== null &&
          match.away_score !== null &&
          new Date(match.match_date) <= new Date()
      ) || null;

    setLiveMatch(liveGame);

    const nextGame =
      matches?.find(
        (match) =>
          new Date(match.match_date) > new Date() && !match.finished
      ) || null;

    setNextMatch(nextGame);

    const { data: participant } = await supabase
      .from("participants")
      .select("id")
      .eq("app_user_id", userId)
      .single();

    if (!participant) return;

    const { data: predictions } = await supabase
      .from("predictions")
      .select("id")
      .eq("participant_id", participant.id);

    setTotalPredictions(predictions?.length || 0);
  }

  return (
    <main style={{ padding: 30, maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ color: "#d4af37", fontSize: 40 }}>
        ⚽ Bolão Copa 2026
      </h1>

      <p style={{ color: "#aaa", fontSize: 18 }}>
        Olá, {userName} 👋
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginTop: 30,
          marginBottom: 30,
        }}
      >
        <div style={cardStyle}>
          <h2>{totalPredictions}/{totalMatches}</h2>
          <p>Palpites realizados</p>
        </div>

        <div style={cardStyle}>
          <h2>{todayMatches}</h2>
          <p>Jogos hoje</p>
        </div>

        <div style={cardStyle}>
          <h2>🏆</h2>
          <p>Acompanhe o ranking</p>
        </div>
      </div>

      {liveMatch && (
        <div
          className="glass-card"
          style={{
            padding: 24,
            borderRadius: 16,
            marginBottom: 30,
            border: "1px solid rgba(248, 113, 113, 0.5)",
          }}
        >
          <h2 style={{ color: "#f87171" }}>🔴 Ao vivo</h2>

          <h3>
            {liveMatch.home_team} {liveMatch.home_score} x{" "}
            {liveMatch.away_score} {liveMatch.away_team}
          </h3>

          <p style={{ color: "#aaa" }}>
            Tempo: {liveMatch.match_time || "Em andamento"}
          </p>
        </div>
      )}

      {nextMatch && (
        <div
          className="glass-card"
          style={{
            padding: 24,
            borderRadius: 16,
            marginBottom: 30,
          }}
        >
          <h2 style={{ color: "#d4af37" }}>⚽ Próximo jogo</h2>

          <h3>
            {nextMatch.home_team} x {nextMatch.away_team}
          </h3>

          <p style={{ color: "#aaa" }}>
            📅 {new Date(nextMatch.match_date).toLocaleDateString("pt-BR")} • 🕒{" "}
            {new Date(nextMatch.match_date).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <a href="/palpites">
          <button>Fazer palpites</button>
        </a>

        <a href="/ranking">
          <button>Ver ranking</button>
        </a>

        <a href="/historico">
          <button>Ver histórico</button>
        </a>
      </div>
    </main>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#111",
  border: "1px solid #333",
  borderRadius: 14,
  padding: 24,
  color: "#fff",
};