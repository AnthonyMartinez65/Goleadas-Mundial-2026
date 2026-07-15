// goleadas.js — Lógica de filtrado, cálculo y ordenamiento
// Cero DOM aquí. Solo transforma datos.

import { apiFetch } from "./api.js";

// Construye el mapa id → equipo, para cruzar rápido sin recorrer el arreglo cada vez
function buildTeamsMap(teams) {
  const map = new Map();
  for (const team of teams) {
    map.set(String(team.id), team);
  }
  return map;
}

// Calcula la diferencia absoluta de goles de un partido
function goalDifference(game) {
  return Math.abs(Number(game.home_score) - Number(game.away_score));
}

// Filtra, calcula y ordena — el corazón del "Rastreador de Goleadas"
function processGoleadas(games, teamsMap) {
  return games
    .filter((game) => game.finished === "TRUE" || game.finished === true)
    .map((game) => ({
      ...game,
      difference: goalDifference(game),
    }))
    .filter((game) => game.difference >= 3)
    .sort((a, b) => b.difference - a.difference)
    .map((game) => enrichWithTeamNames(game, teamsMap));
}

// Cruza los ids de equipos contra el mapa; si no hay mapa (falló /get/teams),
// deja los ids crudos como respaldo — esto es el Reto de Resiliencia del proyecto
function enrichWithTeamNames(game, teamsMap) {
  const homeTeam = teamsMap?.get(String(game.home_team_id));
  const awayTeam = teamsMap?.get(String(game.away_team_id));

  return {
    ...game,
    homeName: homeTeam ? homeTeam.name_en : `Equipo #${game.home_team_id}`,
    homeFlag: homeTeam ? homeTeam.flag : null,
    awayName: awayTeam ? awayTeam.name_en : `Equipo #${game.away_team_id}`,
    awayFlag: awayTeam ? awayTeam.flag : null,
    hasRealNames: Boolean(homeTeam && awayTeam),
  };
}

// Orquesta las dos llamadas y aplica el Reto de Resiliencia:
// si /get/teams falla pero /get/games funcionó, igual se muestra la lista
export async function loadGoleadas() {
  const gamesResult = await apiFetch("/get/games");
  const games = gamesResult.data.games ?? gamesResult.data;

  let teamsMap = null;
  let teamsStale = false;

  try {
    const teamsResult = await apiFetch("/get/teams");
    teamsMap = buildTeamsMap(teamsResult.data);
    teamsStale = teamsResult.stale;
  } catch (error) {
    // /get/teams falló del todo (ni siquiera hay cache) — seguimos sin nombres
    document.dispatchEvent(
      new CustomEvent("goleadas:teams-unavailable", { detail: { error } })
    );
  }

  const goleadas = processGoleadas(games, teamsMap);

  return {
    goleadas,
    gamesStale: gamesResult.stale,
    teamsStale,
    total: goleadas.length,
    maxDifference: goleadas.length > 0 ? goleadas[0].difference : 0,
  };
}