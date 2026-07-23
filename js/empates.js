// empates.js — Lógica de "Radar de Empates"
// Filtra partidos empatados y los agrupa por grupo (A-L). Cero DOM aquí.

import { apiFetch } from "./api.js";

// Filtra solo los partidos terminados en empate
function filterEmpates(games) {
  return games.filter(
    (game) =>
      (game.finished === true || game.finished === "TRUE") &&
      Number(game.home_score) === Number(game.away_score)
  );
}

// Agrupa los empates por su campo "group" (A a L)
function agruparPorGrupo(empates) {
  const grupos = {};
  for (const empate of empates) {
    const letra = empate.group;
    if (!grupos[letra]) grupos[letra] = [];
    grupos[letra].push(empate);
  }
  return grupos;
}

// Cruza cada empate con los nombres/banderas reales de ambos equipos
function enrichEmpate(game, teamsMap) {
  const homeTeam = teamsMap?.get(String(game.home_team_id));
  const awayTeam = teamsMap?.get(String(game.away_team_id));

  return {
    ...game,
    homeName: homeTeam ? homeTeam.name_en : `Equipo #${game.home_team_id}`,
    homeFlag: homeTeam ? homeTeam.flag : null,
    awayName: awayTeam ? awayTeam.name_en : `Equipo #${game.away_team_id}`,
    awayFlag: awayTeam ? awayTeam.flag : null,
  };
}

// Orquesta todo: partidos empatados, agrupados por grupo, con nombres reales.
// Reto de Resiliencia: la matriz se arma a partir de una sola respuesta de
// /get/games — mientras esa petición está en backoff (429/500), los grupos
// dibujados en la carga anterior permanecen visibles (no se limpian hasta
// tener una respuesta nueva y exitosa).
export async function loadEmpates() {
  const gamesResult = await apiFetch("/get/games");
  const games = gamesResult.data.games ?? gamesResult.data;

  const teamsResult = await apiFetch("/get/teams");
  const teamsMap = new Map(
    (teamsResult.data.teams ?? teamsResult.data).map((t) => [String(t.id), t])
  );

  const empates = filterEmpates(games).map((g) => enrichEmpate(g, teamsMap));
  const grupos = agruparPorGrupo(empates);

  const letrasOrdenadas = Object.keys(grupos).sort();

  return {
    grupos,
    letrasOrdenadas,
    totalEmpates: empates.length,
    stale: gamesResult.stale || teamsResult.stale,
  };
}