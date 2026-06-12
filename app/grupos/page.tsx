"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";

type Match = {
  group_name: string | null;
  home_team: string;
  away_team: string;
  home_abbreviation: string | null;
  away_abbreviation: string | null;
  home_score: number | null;
  away_score: number | null;
  finished: boolean;
};

type TeamStats = {
  team: string;
  abbreviation: string | null;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
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
  SEN: "sn",
  ALG: "dz",
  AUT: "at",
  JOR: "jo",
  POR: "pt",
  COD: "cd",
  UZB: "uz",
  COL: "co",
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

export default function GruposPage() {
  const [groups, setGroups] = useState<Record<string, TeamStats[]>>({});

  useEffect(() => {
    loadGroups();
  }, []);

  async function loadGroups() {
    const { data } = await supabase
      .from("matches")
      .select(`
        group_name,
        home_team,
        away_team,
        home_abbreviation,
        away_abbreviation,
        home_score,
        away_score,
        finished
      `);

    if (!data) return;

    const groupsMap: Record<string, Record<string, TeamStats>> = {};

    data.forEach((match: Match) => {
      if (!match.group_name) return;

      const group = match.group_name;

      if (!groupsMap[group]) {
        groupsMap[group] = {};
      }

      const ensureTeam = (team: string, abbreviation: string | null) => {
        if (!groupsMap[group][team]) {
          groupsMap[group][team] = {
            team,
            abbreviation,
            points: 0,
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goalsFor: 0,
            goalsAgainst: 0,
          };
        }
      };

      ensureTeam(match.home_team, match.home_abbreviation);
      ensureTeam(match.away_team, match.away_abbreviation);

      const home = groupsMap[group][match.home_team];
      const away = groupsMap[group][match.away_team];

      if (!match.finished) return;

      const homeScore = match.home_score || 0;
      const awayScore = match.away_score || 0;

      home.played++;
      away.played++;

      home.goalsFor += homeScore;
      home.goalsAgainst += awayScore;

      away.goalsFor += awayScore;
      away.goalsAgainst += homeScore;

      if (homeScore > awayScore) {
        home.wins++;
        home.points += 3;
        away.losses++;
      } else if (homeScore < awayScore) {
        away.wins++;
        away.points += 3;
        home.losses++;
      } else {
        home.draws++;
        away.draws++;
        home.points++;
        away.points++;
      }
    });

    const finalGroups: Record<string, TeamStats[]> = {};

    Object.entries(groupsMap).forEach(([group, teams]) => {
      finalGroups[group] = Object.values(teams).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;

        const saldoA = a.goalsFor - a.goalsAgainst;
        const saldoB = b.goalsFor - b.goalsAgainst;

        if (saldoB !== saldoA) return saldoB - saldoA;

        return b.goalsFor - a.goalsFor;
      });
    });

    setGroups(finalGroups);
  }

  return (
    <main
      style={{
        padding: 30,
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      <h1 style={{ color: "#d4af37", fontSize: 36 }}>
        🏆 Classificação dos Grupos
      </h1>

      <p style={{ color: "#aaa", marginBottom: 30 }}>
        Tabelas atualizadas com base nos resultados sincronizados da FIFA
      </p>

      {Object.entries(groups).map(([group, teams]) => (
        <div
          key={group}
          className="glass-card"
          style={{
            padding: 24,
            borderRadius: 16,
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              color: "#d4af37",
              marginBottom: 12,
            }}
          >
            ⚽ {group}
          </h2>

          <div style={{ overflowX: "auto", width: "100%" }}>
            <table
                style={{
                    width: "100%",
                    minWidth: 760,
                    tableLayout: "fixed",
                    borderCollapse: "collapse",
                    color: "white",
                    marginTop: 16,
                }}
  >
          
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <th style={{ ...thCenter, width: 50 }}>#</th>
                <th style={{ ...thLeft, width: 300 }}>Seleção</th>
                <th style={{ ...thCenter, width: 70 }}>Pts</th>
                <th style={{ ...thCenter, width: 60 }}>J</th>
                <th style={{ ...thCenter, width: 60 }}>V</th>
                <th style={{ ...thCenter, width: 60 }}>E</th>
                <th style={{ ...thCenter, width: 60 }}>D</th>
                <th style={{ ...thCenter, width: 70 }}>GP</th>
                <th style={{ ...thCenter, width: 70 }}>GC</th>
                <th style={{ ...thCenter, width: 70 }}>SG</th>
              </tr>
            </thead>

            <tbody>
              {teams.map((team, index) => (
                <tr
                  key={team.team}
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <td style={tdCenter}>{index + 1}</td>

                  <td
                    style={{
                      ...tdLeft,
                      fontWeight: "bold",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      {getFlagUrl(team.abbreviation) && (
                        <img
                          src={getFlagUrl(team.abbreviation)!}
                          alt={team.team}
                          width={28}
                        />
                      )}

                      <span>{team.team}</span>
                    </div>
                  </td>

                  <td
                    style={{
                      ...tdCenter,
                      color: "#d4af37",
                      fontWeight: "bold",
                    }}
                  >
                    {team.points}
                  </td>

                  <td style={tdCenter}>{team.played}</td>
                  <td style={tdCenter}>{team.wins}</td>
                  <td style={tdCenter}>{team.draws}</td>
                  <td style={tdCenter}>{team.losses}</td>
                  <td style={tdCenter}>{team.goalsFor}</td>
                  <td style={tdCenter}>{team.goalsAgainst}</td>
                  <td style={tdCenter}>
                    {team.goalsFor - team.goalsAgainst}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      ))}
    </main>
  );
}

const thCenter: React.CSSProperties = {
  padding: "12px 8px",
  textAlign: "center",
  color: "#d4af37",
};

const thLeft: React.CSSProperties = {
  padding: "12px 8px",
  textAlign: "left",
  color: "#d4af37",
};

const tdCenter: React.CSSProperties = {
  padding: "12px 8px",
  textAlign: "center",
};

const tdLeft: React.CSSProperties = {
  padding: "12px 8px",
  textAlign: "left",
};