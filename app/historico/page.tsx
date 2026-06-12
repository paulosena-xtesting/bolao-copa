"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";
import { calculatePoints } from "@/src/utils/calculatePoints";

type PredictionWithMatch = {
  id: string;
  home_prediction: number;
  away_prediction: number;
  matches: {
    home_team: string;
    away_team: string;
    match_date: string;
    home_score: number | null;
    away_score: number | null;
    finished: boolean;
    group_name: string | null;
    stage: string | null;
  };
};

export default function HistoricoPage() {
  const [predictions, setPredictions] = useState<PredictionWithMatch[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    const appUserId = localStorage.getItem("bolao_user_id");

    if (!appUserId) {
      window.location.href = "/login";
      return;
    }

    const { data: participant } = await supabase
      .from("participants")
      .select("*")
      .eq("app_user_id", appUserId)
      .single();

    if (!participant) {
      alert("Participante não encontrado.");
      return;
    }

    const { data, error } = await supabase
      .from("predictions")
      .select(`
        id,
        home_prediction,
        away_prediction,
        matches (
          home_team,
          away_team,
          match_date,
          home_score,
          away_score,
          finished,
          group_name,
          stage
        )
      `)
      .eq("participant_id", participant.id);

    if (error) {
      console.log(error);
      alert("Erro ao carregar histórico.");
      return;
    }

    setPredictions((data || []) as unknown as PredictionWithMatch[]);
  }

  return (
  <main style={{ padding: 30, maxWidth: 900, margin: "0 auto" }}>
    <h1 style={{ color: "#d4af37", fontSize: 36 }}>
      📜 Meu Histórico
    </h1>

    <p style={{ color: "#aaa", marginBottom: 30 }}>
      Acompanhe seus palpites, resultados e pontuação
    </p>

    {predictions.length === 0 && <p>Nenhum palpite feito ainda.</p>}

    <div style={{ display: "grid", gap: 16 }}>
      {predictions.map((prediction) => {
        const match = prediction.matches;

        const points = calculatePoints({
          predictedHome: prediction.home_prediction,
          predictedAway: prediction.away_prediction,
          realHome: match.home_score,
          realAway: match.away_score,
          finished: match.finished,
        });

        return (
          <div
            key={prediction.id}
            style={{
              border: "1px solid #333",
              borderRadius: 14,
              padding: 20,
              background: "#111",
              color: "#fff",
            }}
          >
            <p style={{ color: "#d4af37", fontWeight: "bold" }}>
              {match.stage} {match.group_name ? `• ${match.group_name}` : ""}
            </p>

            <p style={{ color: "#aaa" }}>
              📅 {new Date(match.match_date).toLocaleDateString("pt-BR")} • 🕒{" "}
              {new Date(match.match_date).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>

            <h2>
              {match.home_team} x {match.away_team}
            </h2>

            <p>
              Seu palpite: <strong>{prediction.home_prediction} x {prediction.away_prediction}</strong>
            </p>

            {match.finished ? (
              <>
                <p>
                  Resultado: <strong>{match.home_score} x {match.away_score}</strong>
                </p>

                <p
                  style={{
                    color: points > 0 ? "#4ade80" : "#f87171",
                    fontWeight: "bold",
                    fontSize: 20,
                  }}
                >
                  {points > 0 ? `🏆 +${points} pontos` : "❌ 0 pontos"}
                </p>
              </>
            ) : (
              <p style={{ color: "#aaa" }}>
                ⏳ Jogo ainda não finalizado
              </p>
            )}
          </div>
        );
      })}
    </div>
  </main>
)}