// estadios.js — Lógica de "Analítica de Estadios"
// Cruza estadios + partidos para calcular asistencia potencial. Cero DOM aquí.

import { apiFetch } from "./api.js";

// Cuenta cuántos partidos alberga cada estadio
function contarPartidosPorEstadio(games) {
  const conteo = {};
  for (const game of games) {
    const id = String(game.stadium_id);
    conteo[id] = (conteo[id] || 0) + 1;
  }
  return conteo;
}

// Orquesta todo: estadios + conteo de partidos + asistencia potencial
// Reto de Resiliencia: si /get/stadiums ya cargó y /get/games falla después,
// los estadios ya obtenidos NO se pierden — solo entran en estado de espera.
export async function loadEstadios() {
  const stadiumsResult = await apiFetch("/get/stadiums");
  const stadiums = stadiumsResult.data.stadiums ?? stadiumsResult.data;

  let games = null;
  let gamesFailed = false;

  try {
    const gamesResult = await apiFetch("/get/games");
    games = gamesResult.data.games ?? gamesResult.data;
  } catch (error) {
    gamesFailed = true;
  }

  // Si /get/games falló, devolvemos los estadios sin datos de partidos,
  // en vez de destruir lo que ya teníamos de /get/stadiums
  if (gamesFailed) {
    const estadiosSinPartidos = stadiums.map((s) => ({
      id: s.id,
      name: s.name_en,
      city: s.city_en,
      capacity: s.capacity,
      partidos: null,
      asistenciaPotencial: null,
    }));
    return { estadios: estadiosSinPartidos, gamesFailed: true };
  }

  const conteo = contarPartidosPorEstadio(games);

  const estadios = stadiums
    .map((s) => {
      const partidos = conteo[String(s.id)] || 0;
      return {
        id: s.id,
        name: s.name_en,
        city: s.city_en,
        capacity: Number(s.capacity),
        partidos,
        asistenciaPotencial: Number(s.capacity) * partidos,
      };
    })
    .sort((a, b) => b.asistenciaPotencial - a.asistenciaPotencial);

  return { estadios, gamesFailed: false };
}