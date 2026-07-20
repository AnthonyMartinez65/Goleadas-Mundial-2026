// uiEstadios.js — DOM de la pestaña "Analítica de Estadios"
// Gráfica de barras hecha con CSS puro (sin librerías externas)

import { loadEstadios } from "./estadios.js";

const loadingEl = document.getElementById("loading-estadios");
const graficaEl = document.getElementById("grafica-estadios");
const statusEl = document.getElementById("status");

function setStatus(message, type = "info") {
  statusEl.textContent = message;
  statusEl.className = `status-banner status-banner--${type}`;
}

function renderSkeletons(count = 6) {
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

function createBarraEstadio(estadio, maxAsistencia) {
  const row = document.createElement("div");
  row.className = "barra-estadio";

  const porcentaje = estadio.asistenciaPotencial
    ? Math.round((estadio.asistenciaPotencial / maxAsistencia) * 100)
    : 0;

  row.innerHTML = `
    <div class="barra-header">
      <span class="barra-nombre">${estadio.name}</span>
      <span class="barra-ciudad">${estadio.city}</span>
    </div>
    <div class="barra-track">
      <div class="barra-fill" style="width: ${porcentaje}%"></div>
    </div>
    <div class="barra-datos">
      ${
        estadio.partidos === null
          ? "⚠️ Esperando datos de partidos..."
          : `🏟️ Aforo: ${estadio.capacity.toLocaleString()} · ⚽ ${estadio.partidos} ${estadio.partidos === 1 ? "partido" : "partidos"} · 👥 Asistencia potencial: ${estadio.asistenciaPotencial.toLocaleString()}`
      }
    </div>
  `;
  return row;
}

function renderGrafica({ estadios, gamesFailed }) {
  graficaEl.innerHTML = "";

  const maxAsistencia = Math.max(...estadios.map((e) => e.asistenciaPotencial || 0), 1);

  const fragment = document.createDocumentFragment();
  estadios.forEach((estadio) => fragment.appendChild(createBarraEstadio(estadio, maxAsistencia)));
  graficaEl.appendChild(fragment);

  if (gamesFailed) {
    setStatus("⚠️ No se pudieron cargar los partidos. Mostrando estadios en espera.", "warning");
  }
}

async function init() {
  renderSkeletons();

  try {
    const result = await loadEstadios();
    hideSkeletons();
    renderGrafica(result);
  } catch (error) {
    hideSkeletons();
    setStatus("❌ No se pudieron cargar los estadios.", "error");
  }
}

export { init as initEstadios };