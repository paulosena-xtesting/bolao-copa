"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";
import { calculatePoints } from "@/src/utils/calculatePoints";

type PredictionWithData = {
  id: string;
  home_prediction: number;
  away_prediction: number;
  participants: {
    id: string;
    name: string;
  };
  matches: {
    home_score: number | null;
    away_score: number | null;
    finished: boolean;
  };
};

type RankingItem = {
  participantId: string;
  name: string;
  points: number;
  exactScores: number;
  correctResults: number;
  errors: number;
  totalPredictions: number;
};

export default function RankingPage() {
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [currentParticipantId, setCurrentParticipantId] = useState("");

  useEffect(() => {
    loadRanking();
  }, []);

  async function loadRanking() {
    const appUserId = localStorage.getItem("bolao_user_id");

    if (appUserId) {
      const { data: participant } = await supabase
        .from("participants")
        .select("id")
        .eq("app_user_id", appUserId)
        .single();

      if (participant) {
        setCurrentParticipantId(participant.id);
      }
    }

    const { data, error } = await supabase
      .from("predictions")
      .select(`
        id,
        home_prediction,
        away_prediction,
        participants (
          id,
          name
        ),
        matches (
          home_score,
          away_score,
          finished
        )
      `);

    if (error) {
      console.log(error);
      alert("Erro ao carregar ranking.");
      return;
    }

    const rankingMap = new Map<string, RankingItem>();

    (data as unknown as PredictionWithData[]).forEach((prediction) => {
      const participant = prediction.participants;
      const match = prediction.matches;

      if (!participant || !match) return;

      if (!rankingMap.has(participant.id)) {
        rankingMap.set(participant.id, {
          participantId: participant.id,
          name: participant.name,
          points: 0,
          exactScores: 0,
          correctResults: 0,
          errors: 0,
          totalPredictions: 0,
        });
      }

      const item = rankingMap.get(participant.id)!;

      if (!match.finished) return;

      item.totalPredictions += 1;

      const points = calculatePoints({
        predictedHome: prediction.home_prediction,
        predictedAway: prediction.away_prediction,
        realHome: match.home_score,
        realAway: match.away_score,
        finished: match.finished,
      });

      item.points += points;

      if (points === 5) {
        item.exactScores += 1;
      } else if (points === 3) {
        item.correctResults += 1;
      } else {
        item.errors += 1;
      }
    });

    const sortedRanking = Array.from(rankingMap.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.exactScores !== a.exactScores) return b.exactScores - a.exactScores;
      return b.correctResults - a.correctResults;
    });

    setRanking(sortedRanking);
  }

  return (
    <main style={{ padding: 30, maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ color: "#d4af37", fontSize: 36 }}>
        🏆 Ranking Geral
      </h1>

      <p style={{ color: "#aaa", marginBottom: 30 }}>
        Classificação dos participantes do bolão
      </p>

      {ranking.length === 0 ? (
        <p>Ainda não há ranking.</p>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {ranking.map((item, index) => {
            const medal =
              index === 0
                ? "🥇"
                : index === 1
                ? "🥈"
                : index === 2
                ? "🥉"
                : `${index + 1}º`;

            const isCurrentUser = item.participantId === currentParticipantId;

            return (
              <div
                key={item.participantId}
                style={{
                  background: isCurrentUser
                    ? "rgba(212, 175, 55, 0.18)"
                    : "#111",
                  border: isCurrentUser
                    ? "1px solid rgba(212, 175, 55, 0.65)"
                    : "1px solid #333",
                  borderRadius: 14,
                  padding: 20,
                  color: "#fff",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h2 style={{ margin: 0 }}>
                    {medal} {item.name} {isCurrentUser && "⭐"}
                  </h2>

                  {isCurrentUser && (
                    <p
                      style={{
                        color: "#d4af37",
                        fontWeight: "bold",
                        marginTop: 8,
                      }}
                    >
                      Você
                    </p>
                  )}

                  <p style={{ color: "#aaa", marginTop: 8 }}>
                    🎯 Placares exatos: {item.exactScores} • Acertos de resultado:{" "}
                    {item.correctResults} • Erros: {item.errors}
                  </p>
                </div>

                <div style={{ textAlign: "right" }}>
                  <strong
                    style={{
                      color: "#d4af37",
                      fontSize: 28,
                    }}
                  >
                    {item.points}
                  </strong>

                  <p style={{ color: "#aaa", margin: 0 }}>
                    pontos
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}