// uiRutaCampeon.js — DOM de la pestaña "Ruta del Campeón"

import { loadTeams, loadItinerario } from "./rutaCampeon.js";

const selectorEl = document.getElementById("selector-equipo");
const loadingEl = document.getElementById("loading-ruta");
const itinerarioEl = document.getElementById("itinerario");
const statusEl = document.getElementById("status");

function setStatus(message, type = "info") {
  statusEl.textContent = message;
  statusEl.className = `status-banner status-banner--${type}`;
}

function clearStatus() {
  statusEl.textContent = "";
  statusEl.className = "status-banner";
}

function renderSkeletons(count = 4) {
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

function createTarjetaPartido(game) {
  const card = document.createElement("article");
  card.className = "tarjeta";
  if (!game.hasStadiumData) card.classList.add("tarjeta--pendiente");

  const fecha = new Date(game.local_date).toLocaleDateString("es-CR", {
    day: "numeric",
    month: "long",
  });

  card.innerHTML = `
    <p class="fecha-partido">${fecha}</p>
    <div class="tarjeta-equipos">
  <div class="equipo">
    ${game.homeFlag ? `<img src="${game.homeFlag}" alt="Bandera de ${game.homeName}" class="bandera">` : `<span class="bandera bandera--vacia">🏳️</span>`}
    <span>${game.homeName}</span>
  </div>
  <strong>vs</strong>
  <div class="equipo">
    ${game.awayFlag ? `<img src="${game.awayFlag}" alt="Bandera de ${game.awayName}" class="bandera">` : `<span class="bandera bandera--vacia">🏳️</span>`}
    <span>${game.awayName}</span>
  </div>
</div>
    <p class="estadio-info">
      ${
        game.hasStadiumData
          ? `📍 ${game.stadiumName} · ${game.stadiumCity}, ${game.stadiumCountry} · Aforo: ${game.stadiumCapacity?.toLocaleString()}`
          : `⚠️ Estadio no disponible`
      }
    </p>
  `;
  return card;
}

function renderItinerario({ itinerario, ciudadesDistintas, stadiumsFailed }) {
  itinerarioEl.innerHTML = "";

  if (itinerario.length === 0) {
    itinerarioEl.innerHTML = `<p class="empty-state">Este equipo no tiene partidos registrados.</p>`;
    return;
  }

  const resumen = document.createElement("div");
resumen.className = "resumen-ruta";
resumen.innerHTML = `
  <div class="stat-badge">
    <span class="stat-numero">${itinerario.length}</span>
    <span class="stat-label">Partidos</span>
  </div>
  <div class="stat-badge">
    <span class="stat-numero">${ciudadesDistintas}</span>
    <span class="stat-label">Ciudades distintas</span>
  </div>
`;
itinerarioEl.appendChild(resumen);

  const fragment = document.createDocumentFragment();
  itinerario.forEach((game) => fragment.appendChild(createTarjetaPartido(game)));
  itinerarioEl.appendChild(fragment);

  if (stadiumsFailed) {
    setStatus("⚠️ No se pudieron cargar los datos de estadios. Mostrando itinerario sin esa info.", "warning");
  }
}

async function onTeamSelected() {
  const teamId = selectorEl.value;
  if (!teamId) {
    itinerarioEl.innerHTML = "";
    return;
  }

  clearStatus();
  renderSkeletons();

  try {
    const result = await loadItinerario(teamId);
    hideSkeletons();
    renderItinerario(result);
  } catch (error) {
    hideSkeletons();
    setStatus("❌ No se pudo cargar el itinerario de este equipo.", "error");
  }
}

async function init() {
  try {
    const teams = await loadTeams();
    teams.forEach((team) => {
      const option = document.createElement("option");
      option.value = team.id;
      option.textContent = team.name_en;
      selectorEl.appendChild(option);
    });
  } catch (error) {
    setStatus("❌ No se pudo cargar la lista de equipos.", "error");
  }

  selectorEl.addEventListener("change", onTeamSelected);
}

export { init as initRutaCampeon };