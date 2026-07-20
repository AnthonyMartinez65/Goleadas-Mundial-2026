// uiMuro.js — DOM de la pestaña "El Muro"

import { loadMuro } from "./muro.js";

const loadingEl = document.getElementById("loading-muro");
const rankingEl = document.getElementById("ranking-muro");
const statusEl = document.getElementById("status");

function setStatus(message, type = "info") {
  statusEl.textContent = message;
  statusEl.className = `status-banner status-banner--${type}`;
}

function renderSkeletons(count = 5) {
  loadingEl.innerHTML = "";
  loadingEl.classList.remove("hidden");
  for (let i = 0; i < count; i++) {
    const skeleton = document.createElement("div");
    skeleton.className = "skeleton-card";
    loadingEl.appendChild(skeleton);
  }
}

function hideSkeletons() {
  loadingEl.innerHTML = "";
  loadingEl.classList.add("hidden");
}

function createTarjetaMuro(equipo, posicion) {
  const card = document.createElement("article");
  card.className = "tarjeta tarjeta-muro";

  const fecha = equipo.nextMatch
    ? new Date(equipo.nextMatch.date).toLocaleDateString("es-CR", { day: "numeric", month: "long" })
    : null;

  card.innerHTML = `
    <div class="muro-posicion">#${posicion}</div>
    <div class="equipo">
      ${equipo.teamFlag ? `<img src="${equipo.teamFlag}" alt="Bandera de ${equipo.teamName}" class="bandera">` : `<span class="bandera bandera--vacia">🏳️</span>`}
      <span>${equipo.teamName}</span>
    </div>
    <p class="muro-ga"><strong>${equipo.ga}</strong> ${equipo.ga === 1 ? "gol recibido" : "goles recibidos"}</p>
   <p class="muro-detalle">⚽ ${equipo.gf} a favor · Diferencia: ${equipo.diferencia >= 0 ? "+" : ""}${equipo.diferencia}</p>
    <p class="estadio-info">
      ${
        equipo.nextMatchFailed
          ? "⚠️ Próximo rival no disponible"
          : equipo.nextMatch
          ? `⚽ Próximo: vs ${equipo.nextMatch.opponentName} (${fecha})`
          : "Sin partidos pendientes"
      }
    </p>
  `;
  return card;
}

function renderRanking(ranking) {
  rankingEl.innerHTML = "";
  const fragment = document.createDocumentFragment();
  ranking.forEach((equipo, index) => fragment.appendChild(createTarjetaMuro(equipo, index + 1)));
  rankingEl.appendChild(fragment);
}

async function init() {
  renderSkeletons();

  try {
    const { ranking } = await loadMuro();
    hideSkeletons();
    renderRanking(ranking);
  } catch (error) {
    hideSkeletons();
    setStatus("❌ No se pudo cargar el ranking de El Muro.", "error");
  }
}

export { init as initMuro };