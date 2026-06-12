"use client";

import { supabase } from "@/src/lib/supabase";

type FifaText = {
  Locale: string;
  Description: string;
};

type FifaMatch = {
  IdMatch: string;
  IdCompetition: string;
  IdSeason: string;
  Date: string;
  LocalDate: string;
  MatchNumber: number;
  MatchStatus: number;
  ResultType: number;
  PlaceHolderA: string;
  PlaceHolderB: string;
  CompetitionName: FifaText[];
  SeasonName: FifaText[];
  StageName: FifaText[];
  GroupName: FifaText[];
  Home: {
    Score: number | null;
    TeamName: FifaText[];
    Abbreviation: string;
    PictureUrl: string;
  };
  Away: {
    Score: number | null;
    TeamName: FifaText[];
    Abbreviation: string;
    PictureUrl: string;
  };
  Stadium: {
    Name: FifaText[];
    CityName: FifaText[];
  } | null;
};

function text(items?: FifaText[]) {
  return items?.[0]?.Description || "";
}

function flagUrl(template?: string) {
  if (!template) return null;

  return template
    .replace("{format}", "png")
    .replace("{size}", "2");
}

export default function SincronizarJogosPage() {
  async function sincronizar() {
    const url =
      "https://api.fifa.com/api/v3/calendar/matches?from=2026-06-10T00%3A00%3A00Z&to=2026-07-20T23%3A59%3A59Z&language=pt&count=500&idCompetition=17&idSeason=285023";

    const response = await fetch(url);
    const json = await response.json();

    const results: FifaMatch[] = json.Results || [];

    const worldCupMatches = results.filter(
      (match) =>
        match.IdCompetition === "17" &&
        match.IdSeason === "285023"
    );

    const mappedMatches = worldCupMatches.map((match) => ({
      fifa_match_id: match.IdMatch,
      match_number: match.MatchNumber,
      stage: text(match.StageName),
      group_name: text(match.GroupName),
      home_team: text(match.Home?.TeamName) || match.PlaceHolderA,
      away_team: text(match.Away?.TeamName) || match.PlaceHolderB,
      home_abbreviation: match.Home?.Abbreviation || null,
      away_abbreviation: match.Away?.Abbreviation || null,
      home_flag: flagUrl(match.Home?.PictureUrl),
      away_flag: flagUrl(match.Away?.PictureUrl),
      match_date: match.Date,
      venue: match.Stadium ? text(match.Stadium.Name) : null,
      city: match.Stadium ? text(match.Stadium.CityName) : null,
      home_score: match.Home?.Score ?? null,
      away_score: match.Away?.Score ?? null,
      match_status: match.MatchStatus,
      result_type: match.ResultType,
      placeholder_home: match.PlaceHolderA,
      placeholder_away: match.PlaceHolderB,
      finished: match.MatchStatus === 0,
    }));

    const { error } = await supabase.from("matches").upsert(mappedMatches, {
      onConflict: "fifa_match_id",
    });

    if (error) {
      console.log(error);
      alert("Erro ao salvar jogos no Supabase.");
      return;
    }

    alert(`${mappedMatches.length} jogos sincronizados com sucesso!`);
  }

  return (
    <main style={{ padding: 30 }}>
      <h1>Sincronizar jogos da FIFA</h1>

      <p>
        Importa jogos, horários, grupos, fase, estádios, bandeiras e placares.
      </p>

      <button onClick={sincronizar} style={{ padding: 10 }}>
        Sincronizar jogos da FIFA
      </button>
    </main>
  );
}