"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";

type Match = {
  id: string;
  match_number: number;
  stage: string | null;
  group_name: string | null;
  home_team: string;
  away_team: string;
  home_abbreviation: string | null;
  away_abbreviation: string | null;
  home_flag: string | null;
  away_flag: string | null;
  match_date: string;
  venue: string | null;
  city: string | null;
  home_score: number | null;
  away_score: number | null;
  finished: boolean;
};

const flagMap: Record<string, string> = {
  BRA: "br",
  ARG: "ar",
  MEX: "mx",
  RSA: "za",
  KOR: "kr",
  CZE: "cz",
  CAN: "ca",
  BIH: "ba",
  USA: "us",
  PAR: "py",
  QAT: "qa",
  SUI: "ch",
  MAR: "ma",
  HAI: "ht",
  SCO: "gb-sct",
  AUS: "au",
  TUR: "tr",
  GER: "de",
  CUW: "cw",
  CIV: "ci",
  ECU: "ec",
  NED: "nl",
  JPN: "jp",
  SWE: "se",
  TUN: "tn",
  BEL: "be",
  EGY: "eg",
  IRN: "ir",
  NZL: "nz",
  ESP: "es",
  CPV: "cv",
  KSA: "sa",
  URU: "uy",
  FRA: "fr",
  IRQ: "iq",
  NOR: "no",
  ALG: "dz",
  AUT: "at",
  JOR: "jo",
  POR: "pt",
  COD: "cd",
  ENG: "gb-eng",
  CRO: "hr",
  GHA: "gh",
  PAN: "pa",
};



function getFlagUrl(abbreviation: string | null) {
  if (!abbreviation) return null;

  const code = flagMap[abbreviation];

  if (!code) return null;

  return `https://flagcdn.com/w40/${code}.png`;
}

export default function PalpitesPage() {
  const [userName, setUserName] = useState("");
  const [participantId, setParticipantId] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, { home: string; away: string }>>({});
  const [filter, setFilter] = useState<"all" | "done" | "missing">("all");

  useEffect(() => {
    const storedUserId = localStorage.getItem("bolao_user_id");
    const storedUserName = localStorage.getItem("bolao_user_name");

    if (!storedUserId) {
      window.location.href = "/login";
      return;
    }

    setUserName(storedUserName || "");
    loadData(storedUserId);
  }, []);

  async function loadData(appUserId: string) {
    const { data: participant } = await supabase
      .from("participants")
      .select("*")
      .eq("app_user_id", appUserId)
      .single();

    if (!participant) {
      alert("Participante não encontrado.");
      window.location.href = "/login";
      return;
    }

    setParticipantId(participant.id);

    const { data: matchesData } = await supabase
      .from("matches")
      .select("*")
      .order("match_date");

    setMatches(matchesData || []);

    const { data: predictionsData } = await supabase
      .from("predictions")
      .select("*")
      .eq("participant_id", participant.id);

    const mapped: Record<string, { home: string; away: string }> = {};

    predictionsData?.forEach((prediction) => {
      mapped[prediction.match_id] = {
        home: String(prediction.home_prediction),
        away: String(prediction.away_prediction),
      };
    });

    setPredictions(mapped);
  }

  function updatePrediction(matchId: string, field: "home" | "away", value: string) {
    if (value !== "" && Number(value) < 0) return;

    setPredictions((prev) => ({
      ...prev,
      [matchId]: {
        home: prev[matchId]?.home || "",
        away: prev[matchId]?.away || "",
        [field]: value,
      },
    }));
  }

  async function savePrediction(matchId: string) {
    const match = matches.find((item) => item.id === matchId);

    if (!match) return;

    const matchStarted = new Date(match.match_date) <= new Date();

    if (matchStarted || match.finished) {
      alert("Palpites encerrados para esse jogo.");
      return;
    }

    const prediction = predictions[matchId];

    if (!participantId) {
      alert("Participante não encontrado.");
      return;
    }

    if (!prediction?.home || !prediction?.away) {
      alert("Preencha o placar.");
      return;
    }

    const { error } = await supabase.from("predictions").upsert(
  {
    participant_id: participantId,
    match_id: matchId,
    home_prediction: Number(prediction.home),
    away_prediction: Number(prediction.away),
  },
  {
    onConflict: "participant_id,match_id",
    }
  );

    if (error) {
      console.log(error);
      alert("Erro ao salvar palpite.");
      return;
    }

    alert("Palpite salvo!");
  }

  function logout() {
    localStorage.removeItem("bolao_user_id");
    localStorage.removeItem("bolao_user_name");
    window.location.href = "/login";
  }

  const now = new Date();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const totalMatches = matches.length;
  const totalPredictions = Object.keys(predictions).length;
  

  const todayMatches = matches.filter((match) => {
    const matchDate = new Date(match.match_date);

  return (
    matchDate >= startOfToday &&
    matchDate <= endOfToday &&
    matchDate > now &&
    !match.finished
  );
});

  const nextMatches = matches.filter((match) => {
  const matchDate = new Date(match.match_date);

  return matchDate > endOfToday && !match.finished;
});

  const closedMatches = matches.filter((match) => {
  const matchDate = new Date(match.match_date);

  return matchDate <= now || match.finished;
});

  function applyFilter(matchesList: Match[]) {
      if (filter === "done") {
        return matchesList.filter((match) => predictions[match.id]);
      }

      if (filter === "missing") {
        return matchesList.filter((match) => !predictions[match.id]);
      }

      return matchesList;
    }
  

  function MatchCard({ match, blocked }: { match: Match; blocked: boolean }) {
    const prediction = predictions[match.id];

    return (
      <div
        className="glass-card"
        style={{
          border: "1px solid #333",
          borderRadius: 12,
          padding: 30,
          maxWidth: 650,
          margin: "0 auto 20px auto",
          marginBottom: 20,
          background: "rgba(22, 24, 30, 0.78)",
          color: "#ffffff",
        }}
      >
        <div style={{ textAlign: "center" }}>
            <p style={{ color: "#d4af37", fontWeight: "bold" }}>
              {match.group_name
              ? `${match.group_name} • ${match.stage}`
              : match.stage}
            </p>
            {prediction && (
            <p
              style={{
                color: "#4ade80",
                fontWeight: "bold",
                marginTop: 5,
              }}
            >
              ✓ Palpite realizado
            </p>
          )}

            <p>
              📅{" "}
              {new Date(match.match_date).toLocaleDateString("pt-BR")}
            </p>

            <p>
              🕒{" "}
              {new Date(match.match_date).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>

            <p>
              🏟 {match.venue}
            </p>
        </div>

        <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              marginTop: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 8,
              }}
            >
              {getFlagUrl(match.home_abbreviation) && (
                <img
                  src={getFlagUrl(match.home_abbreviation)!}
                  alt={match.home_team}
                  width={40}
                />
              )}

              <h3 style={{ margin: 0 }}>
                {match.home_team}
              </h3>
            </div>

            <p style={{ color: "#d4af37" }}>
              {match.home_abbreviation}
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                margin: "20px 0",
              }}
            >
              <input
                type="number"
                min="0"
                disabled={blocked}
                value={prediction?.home || ""}
                onChange={(e) => updatePrediction(match.id, "home", e.target.value)}
                style={{
                  width: 60,
                  padding: 10,
                  background: "#222",
                  color: "#fff",
                  border: "1px solid #555",
                  borderRadius: 8,
                  textAlign: "center",
                }}
              />

              <span style={{ fontSize: 22 }}>x</span>

              <input
                type="number"
                min="0"
                disabled={blocked}
                value={prediction?.away || ""}
                onChange={(e) => updatePrediction(match.id, "away", e.target.value)}
                style={{
                  width: 60,
                  padding: 10,
                  background: "#222",
                  color: "#fff",
                  border: "1px solid #555",
                  borderRadius: 8,
                  textAlign: "center",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 8,
              }}
            >
              {getFlagUrl(match.away_abbreviation) && (
                <img
                  src={getFlagUrl(match.away_abbreviation)!}
                  alt={match.away_team}
                  width={40}
                />
              )}

              <h3 style={{ margin: 0 }}>
                {match.away_team}
              </h3>
            </div>
            <p style={{ color: "#d4af37" }}>
              {match.away_abbreviation}
            </p>
          </div>
        <br />

        {!blocked ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: 24,
            }}
          >
            <button onClick={() => savePrediction(match.id)}>
              Salvar Palpite
            </button>
          </div>
        ) : (
          <p style={{ color: "#aaa" }}>Palpites encerrados.</p>
        )}

        {blocked && prediction && (
          <p>
            Seu palpite: {prediction.home} x {prediction.away}
          </p>
        )}

        {match.finished && (
          <p>
            Resultado: {match.home_score} x {match.away_score}
          </p>
        )}
      </div>
    );
  }

  return (
    <main style={{ padding: 30 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 30,
            padding: "20px 0",
          }}
        >
          <div>

            <p
              style={{
                marginTop: 8,
                color: "#666",
              }}
            >
            <h2
              style={{
                  margin: 0,
                  color: "#d4af37",
              }}
              >
                Olá, {userName} 👋
            </h2>
              <p
                style={{
                  marginTop: 8,
                  color: "#666",
                }}
              >
                Faça seus palpites para a Copa do Mundo 2026
              </p>
              <p
                style={{
                  marginTop: 8,
                  color: "#d4af37",
                  fontWeight: "bold",
                }}
              >
                Palpites realizados: {totalPredictions}/{totalMatches}
              </p>

              <div style={{ display: "flex", gap: 10, marginTop: 15 }}>
                <button onClick={() => setFilter("all")}>
                  Todos
                </button>

                <button onClick={() => setFilter("done")}>
                  Já palpitados
                </button>

                <button onClick={() => setFilter("missing")}>
                  Faltando
                </button>
              </div>
            </p>
          </div>

      </div>

      <h2
        style={{
          fontSize: 32,
          marginTop: 40,
          marginBottom: 20,
        }}
      >
        🔥 Jogos de hoje
      </h2>

        {todayMatches.length === 0 && (
          <p>Nenhum jogo restante para palpitar hoje.</p>
        )}

        {applyFilter(todayMatches).map((match) => {
            return (
              <MatchCard key={match.id} match={match} blocked={false} />
            );
        })}

        <h2
          style={{
            fontSize: 32,
            marginTop: 40,
            marginBottom: 20,
          }}
        >
          📅 Próximos jogos
        </h2>

        {nextMatches.length === 0 && (
          <p>Nenhum próximo jogo disponível.</p>
        )}

        {applyFilter(nextMatches).slice(0, 10).map((match) => {
          return (
            <MatchCard key={match.id} match={match} blocked={false} />
          );
        })}

    </main>
  );
}