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

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [allowed, setAllowed] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);

  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [matchDate, setMatchDate] = useState("");

  const [results, setResults] = useState<Record<string, { home: string; away: string }>>({});

  function enterAdmin() {
    if (password === "copa2026") {
      setAllowed(true);
      loadMatches();
    } else {
      alert("Senha incorreta.");
    }
  }

  async function loadMatches() {
    const { data } = await supabase
      .from("matches")
      .select("*")
      .order("match_date");

    setMatches(data || []);

    const mapped: Record<string, { home: string; away: string }> = {};

    data?.forEach((match) => {
      mapped[match.id] = {
        home: match.home_score !== null ? String(match.home_score) : "",
        away: match.away_score !== null ? String(match.away_score) : "",
      };
    });

    setResults(mapped);
  }

  async function createMatch() {
    if (!homeTeam.trim() || !awayTeam.trim() || !matchDate) {
      alert("Preencha os times e a data do jogo.");
      return;
    }

    const { error } = await supabase.from("matches").insert({
      home_team: homeTeam.trim(),
      away_team: awayTeam.trim(),
      match_date: matchDate,
    });

    if (error) {
      console.log(error);
      alert("Erro ao cadastrar jogo.");
      return;
    }

    setHomeTeam("");
    setAwayTeam("");
    setMatchDate("");
    alert("Jogo cadastrado!");
    loadMatches();
  }

  function updateResult(matchId: string, field: "home" | "away", value: string) {
    if (Number(value) < 0) return;

    setResults((prev) => ({
      ...prev,
      [matchId]: {
        home: prev[matchId]?.home || "",
        away: prev[matchId]?.away || "",
        [field]: value,
      },
    }));
  }

  async function saveResult(matchId: string) {
    const result = results[matchId];

    if (!result?.home || !result?.away) {
      alert("Preencha o resultado.");
      return;
    }

    const { error } = await supabase
      .from("matches")
      .update({
        home_score: Number(result.home),
        away_score: Number(result.away),
        finished: true,
      })
      .eq("id", matchId);

    if (error) {
      console.log(error);
      alert("Erro ao salvar resultado.");
      return;
    }

    alert("Resultado salvo!");
    loadMatches();
  }

  async function deleteMatch(matchId: string) {
    const confirmDelete = confirm("Tem certeza que deseja apagar esse jogo?");

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("matches")
      .delete()
      .eq("id", matchId);

    if (error) {
      console.log(error);
      alert("Erro ao apagar jogo.");
      return;
    }

    alert("Jogo apagado.");
    loadMatches();
  }

  if (!allowed) {
    return (
      <main style={{ padding: 30, maxWidth: 400, margin: "0 auto" }}>
        <h1>Admin</h1>

        <input
          type="password"
          placeholder="Senha admin"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 10, width: "100%", marginBottom: 10 }}
        />

        <button onClick={enterAdmin} style={{ padding: 10 }}>
          Entrar
        </button>
      </main>
    );
  }

  return (
    <main style={{ padding: 30 }}>
      <h1>Admin - Jogos e Resultados</h1>

      <section
        style={{
          border: "1px solid #ccc",
          padding: 20,
          marginBottom: 30,
        }}
      >
        <h2>Cadastrar novo jogo</h2>

        <input
          placeholder="Time da casa"
          value={homeTeam}
          onChange={(e) => setHomeTeam(e.target.value)}
          style={{ padding: 10, marginRight: 10 }}
        />

        <input
          placeholder="Time visitante"
          value={awayTeam}
          onChange={(e) => setAwayTeam(e.target.value)}
          style={{ padding: 10, marginRight: 10 }}
        />

        <input
          type="datetime-local"
          value={matchDate}
          onChange={(e) => setMatchDate(e.target.value)}
          style={{ padding: 10, marginRight: 10 }}
        />

        <button onClick={createMatch} style={{ padding: 10 }}>
          Cadastrar jogo
        </button>
      </section>

      <h2>Jogos cadastrados</h2>

      {matches.map((match) => (
        <div
          key={match.id}
          style={{
            border: "1px solid #ccc",
            padding: 20,
            marginBottom: 20,
          }}
        >
          <p>
            <strong>
              {match.home_team} x {match.away_team}
            </strong>
          </p>

          <p>
            Data: {new Date(match.match_date).toLocaleString("pt-BR")}
          </p>

          <input
            type="number"
            min="0"
            value={results[match.id]?.home || ""}
            onChange={(e) => updateResult(match.id, "home", e.target.value)}
          />

          <span> x </span>

          <input
            type="number"
            min="0"
            value={results[match.id]?.away || ""}
            onChange={(e) => updateResult(match.id, "away", e.target.value)}
          />

          <br />
          <br />

          <button onClick={() => saveResult(match.id)} style={{ padding: 10 }}>
            Salvar resultado
          </button>

          <button
            onClick={() => deleteMatch(match.id)}
            style={{ padding: 10, marginLeft: 10 }}
          >
            Apagar jogo
          </button>

          {match.finished && (
            <p style={{ color: "green" }}>
              Finalizado: {match.home_score} x {match.away_score}
            </p>
          )}
        </div>
      ))}
    </main>
  );
}