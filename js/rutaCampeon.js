// rutaCampeon.js — Lógica de "La Ruta del Campeón"
// Cruza equipos + partidos + estadios. Cero DOM aquí.

import { apiFetch } from "./api.js";

let teamsCache = null;

// Carga los 48 equipos una sola vez, para poblar el selector
export async function loadTeams() {
  if (teamsCache) return teamsCache;
  const result = await apiFetch("/get/teams");
  teamsCache = result.data.teams;
  return teamsCache;
}

// Filtra los partidos de un equipo (como local o visitante), ordenados por fecha
function filterTeamGames(games, teamId) {
  return games
    .filter(
      (game) =>
        String(game.home_team_id) === String(teamId) ||
        String(game.away_team_id) === String(teamId)
    )
    .sort((a, b) => new Date(a.local_date) - new Date(b.local_date));
}

// Cruza cada partido con su estadio; si no hay mapa de estadios, deja "no disponible"
function enrichWithStadium(game, stadiumsMap, teamsMap) {
  const stadium = stadiumsMap?.get(String(game.stadium_id));
  const homeTeam = teamsMap?.get(String(game.home_team_id));
  const awayTeam = teamsMap?.get(String(game.away_team_id));

  return {
    ...game,
    homeName: homeTeam ? homeTeam.name_en : `Equipo #${game.home_team_id}`,
    homeFlag: homeTeam ? homeTeam.flag : null,
    awayName: awayTeam ? awayTeam.name_en : `Equipo #${game.away_team_id}`,
    awayFlag: awayTeam ? awayTeam.flag : null,
    stadiumName: stadium ? stadium.name_en : null,
    stadiumCity: stadium ? stadium.city_en : null,
    stadiumCountry: stadium ? stadium.country_en : null,
    stadiumCapacity: stadium ? stadium.capacity : null,
    hasStadiumData: Boolean(stadium),
  };
}

function buildStadiumsMap(stadiums) {
  const map = new Map();
  for (const stadium of stadiums) {
    map.set(String(stadium.id), stadium);
  }
  return map;
}

// Orquesta todo: partidos del equipo + cruce con estadios
// Implementa el Reto de Resiliencia: si /get/stadiums falla, el itinerario
// ya construido con los partidos NO se pierde — solo faltan los datos de estadio.
export async function loadItinerario(teamId) {
  const gamesResult = await apiFetch("/get/games");
  const allGames = gamesResult.data.games ?? gamesResult.data;
  const teamGames = filterTeamGames(allGames, teamId);

  const teams = await loadTeams();
  const teamsMap = new Map(teams.map((t) => [String(t.id), t]));

  let stadiumsMap = null;
  let stadiumsFailed = false;

  try {
    const stadiumsResult = await apiFetch("/get/stadiums");
    stadiumsMap = buildStadiumsMap(stadiumsResult.data.stadiums ?? stadiumsResult.data);
  } catch (error) {
    stadiumsFailed = true;
  }

  const itinerario = teamGames.map((game) => enrichWithStadium(game, stadiumsMap, teamsMap));

  const ciudadesDistintas = new Set(
    itinerario.filter((g) => g.stadiumCity).map((g) => g.stadiumCity)
  ).size;

  return { itinerario, ciudadesDistintas, stadiumsFailed };
}