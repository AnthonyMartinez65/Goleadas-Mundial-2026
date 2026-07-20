// muro.js — Lógica de "El Muro"
// Ranking de los 5 equipos con menos goles en contra (ga). Cero DOM aquí.

import { apiFetch } from "./api.js";

// Aplana los 12 grupos en un solo arreglo de {team_id, ga}
function flattenGroups(groups) {
  const registros = [];
  for (const grupo of groups) {
    for (const equipo of grupo.teams) {
      registros.push({
        team_id: equipo.team_id,
        ga: Number(equipo.ga),
        gf: Number(equipo.gf),
      });
    }
  }
  return registros;
}

// Busca el próximo partido pendiente (finished: false) de un equipo específico
function findNextMatch(games, teamId) {
  const pendientes = games
    .filter(
      (game) =>
        game.finished === false || game.finished === "FALSE"
    )
    .filter(
      (game) =>
        String(game.home_team_id) === String(teamId) ||
        String(game.away_team_id) === String(teamId)
    )
    .sort((a, b) => new Date(a.local_date) - new Date(b.local_date));

  return pendientes.length > 0 ? pendientes[0] : null;
}

// Orquesta todo: ranking de los 5 equipos con menos ga + su próximo rival
// Reto de Resiliencia: la búsqueda de próximo rival se evalúa equipo por
// equipo — si falla para uno, ese registro muestra "no disponible" sin
// afectar a los otros 4.
export async function loadMuro() {
  const groupsResult = await apiFetch("/get/groups");
  const groups = groupsResult.data.groups ?? groupsResult.data;

  const teamsResult = await apiFetch("/get/teams");
  const teamsMap = new Map(
    (teamsResult.data.teams ?? teamsResult.data).map((t) => [String(t.id), t])
  );

  const gamesResult = await apiFetch("/get/games");
  const games = gamesResult.data.games ?? gamesResult.data;

  const registros = flattenGroups(groups)
    .sort((a, b) => a.ga - b.ga)
    .slice(0, 5);

  const ranking = registros.map((registro) => {
    const team = teamsMap.get(String(registro.team_id));

    let nextMatch = null;
    let nextMatchFailed = false;
    try {
      const found = findNextMatch(games, registro.team_id);
      if (found) {
        const isHome = String(found.home_team_id) === String(registro.team_id);
        const opponentId = isHome ? found.away_team_id : found.home_team_id;
        const opponent = teamsMap.get(String(opponentId));
        nextMatch = {
          opponentName: opponent ? opponent.name_en : `Equipo #${opponentId}`,
          date: found.local_date,
        };
      }
    } catch (error) {
      nextMatchFailed = true;
    }

    return {
  teamId: registro.team_id,
  teamName: team ? team.name_en : `Equipo #${registro.team_id}`,
  teamFlag: team ? team.flag : null,
  ga: registro.ga,
  gf: registro.gf,
  diferencia: registro.gf - registro.ga,
  nextMatch,
  nextMatchFailed,
   };
  });

  return { ranking };
}