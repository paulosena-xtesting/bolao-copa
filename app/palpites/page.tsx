"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";

type Match = {
  id: string;
  home_team: string;
  away_team: string;
  match_date: string;
  home_score: number | null;
  away_score: number | null;
  finished: boolean;
};

export default function PalpitesPage() {
  const [userName, setUserName] = useState("");
  const [participantId, setParticipantId] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, { home: string; away: string }>>({});

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

    if (
      prediction?.home === undefined ||
      prediction?.away === undefined ||
      prediction.home === "" ||
      prediction.away === ""
    ) {
      alert("Preencha o placar.");
      return;
    }

    if (Number(prediction.home) < 0 || Number(prediction.away) < 0) {
      alert("O placar não pode ser negativo.");
      return;
    }

    const { error } = await supabase.from("predictions").upsert({
      participant_id: participantId,
      match_id: matchId,
      home_prediction: Number(prediction.home),
      away_prediction: Number(prediction.away),
    });

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

  const today = new Date();

  const openMatches = matches.filter((match) => {
    const matchDate = new Date(match.match_date);
    return matchDate > today && !match.finished;
  });

  const closedMatches = matches.filter((match) => {
    const matchDate = new Date(match.match_date);
    return matchDate <= today || match.finished;
  });

  return (
    <main style={{ padding: 30 }}>
      <h1>Meus Palpites</h1>

      <p>Logado como: {userName}</p>

      <button onClick={logout} style={{ padding: 8, marginBottom: 20 }}>
        Sair
      </button>

      <h2>Jogos abertos para palpite</h2>

      {openMatches.length === 0 && (
        <p>Nenhum jogo aberto para palpite.</p>
      )}

      {openMatches.map((match) => (
        <div
          key={match.id}
          style={{
            border: "1px solid #ccc",
            padding: 20,
            marginBottom: 20,
          }}
        >
          <p>{new Date(match.match_date).toLocaleString("pt-BR")}</p>

          <h3>
            {match.home_team} x {match.away_team}
          </h3>

          <input
            type="number"
            min="0"
            value={predictions[match.id]?.home || ""}
            onChange={(e) => updatePrediction(match.id, "home", e.target.value)}
          />

          <span> x </span>

          <input
            type="number"
            min="0"
            value={predictions[match.id]?.away || ""}
            onChange={(e) => updatePrediction(match.id, "away", e.target.value)}
          />

          <br />
          <br />

          <button onClick={() => savePrediction(match.id)}>
            Salvar Palpite
          </button>
        </div>
      ))}

      <h2>Jogos encerrados ou bloqueados</h2>

      {closedMatches.length === 0 && (
        <p>Nenhum jogo encerrado ainda.</p>
      )}

      {closedMatches.map((match) => (
        <div
          key={match.id}
          style={{
            border: "1px solid #ddd",
            padding: 20,
            marginBottom: 20,
            background: "#f5f5f5",
          }}
        >
          <p>{new Date(match.match_date).toLocaleString("pt-BR")}</p>

          <h3>
            {match.home_team} x {match.away_team}
          </h3>

          <p>Palpites encerrados.</p>

          {predictions[match.id] && (
            <p>
              Seu palpite: {predictions[match.id].home} x{" "}
              {predictions[match.id].away}
            </p>
          )}

          {match.finished && (
            <p>
              Resultado: {match.home_score} x {match.away_score}
            </p>
          )}
        </div>
      ))}
    </main>
  );
}