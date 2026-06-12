import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

type FifaText = {
  Locale: string;
  Description: string;
};

type FifaMatch = {
  IdMatch: string;
  IdCompetition: string;
  IdSeason: string;
  Date: string;
  MatchNumber: number;
  MatchStatus: number;
  MatchTime: string | null;
  ResultType: number;
  PlaceHolderA: string;
  PlaceHolderB: string;
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

  return template.replace("{format}", "png").replace("{size}", "4");
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createClient(supabaseUrl, supabaseKey);

  const url =
    "https://api.fifa.com/api/v3/calendar/matches?from=2026-06-10T00%3A00%3A00Z&to=2026-07-20T23%3A59%3A59Z&language=pt&count=500&idCompetition=17&idSeason=285023";

  const response = await fetch(url);
  const json = await response.json();

  const results: FifaMatch[] = json.Results || [];

  const mappedMatches = results
    .filter(
      (match) =>
        match.IdCompetition === "17" &&
        match.IdSeason === "285023"
        
    )
    .map((match) => ({
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
      match_time: match.MatchTime,
      result_type: match.ResultType,
      placeholder_home: match.PlaceHolderA,
      placeholder_away: match.PlaceHolderB,
      finished: match.MatchStatus === 0,
    }));

  const { error } = await supabase.from("matches").upsert(mappedMatches, {
    onConflict: "fifa_match_id",
  });

  if (error) {
    return NextResponse.json(
      {
        success: false,
        error,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    total: mappedMatches.length,
    message: "Jogos FIFA sincronizados com sucesso.",
  });
}