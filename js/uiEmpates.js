// uiEmpates.js — DOM de la pestaña "Radar de Empates"

import { loadEmpates } from "./empates.js";

const loadingEl = document.getElementById("loading-empates");
const matrizEl = document.getElementById("matriz-empates");
const statusEl = document.getElementById("status");

function setStatus(message, type = "info") {
  statusEl.textContent = message;
  statusEl.className = `status-banner status-banner--${type}`;
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

function createCeldaEmpate(empate) {
  const celda = document.createElement("div");
  celda.className = "celda-empate";

  celda.innerHTML = `
    <div class="equipo">
      ${empate.homeFlag ? `<img src="${empate.homeFlag}" alt="Bandera de ${empate.homeName}" class="bandera">` : `<span class="bandera bandera--vacia">🏳️</span>`}
      <span>${empate.homeName}</span>
    </div>
    <strong class="marcador-empate">${empate.home_score} - ${empate.away_score}</strong>
    <div class="equipo">
      ${empate.awayFlag ? `<img src="${empate.awayFlag}" alt="Bandera de ${empate.awayName}" class="bandera">` : `<span class="bandera bandera--vacia">🏳️</span>`}
      <span>${empate.awayName}</span>
    </div>
  `;
  return celda;
}

function createGrupoBloque(letra, empatesDelGrupo) {
  const bloque = document.createElement("section");
  bloque.className = "grupo-bloque";

  const header = document.createElement("div");
  header.className = "grupo-header";
  header.innerHTML = `
    <h3>Grupo ${letra}</h3>
    <span class="grupo-contador">${empatesDelGrupo.length} ${empatesDelGrupo.length === 1 ? "empate" : "empates"}</span>
  `;
  bloque.appendChild(header);

  const grid = document.createElement("div");
  grid.className = "grupo-celdas";
  empatesDelGrupo.forEach((empate) => grid.appendChild(createCeldaEmpate(empate)));
  bloque.appendChild(grid);

  return bloque;
}

function renderMatriz({ grupos, letrasOrdenadas, totalEmpates, stale }) {
  matrizEl.innerHTML = "";

  if (totalEmpates === 0) {
    matrizEl.innerHTML = `<p class="empty-state">No se encontraron partidos empatados.</p>`;
    return;
  }

  const resumen = document.createElement("p");
  resumen.className = "stats";
  resumen.textContent = `🤝 ${totalEmpates} empates encontrados en ${letrasOrdenadas.length} grupos`;
  matrizEl.appendChild(resumen);

  const fragment = document.createDocumentFragment();
  letrasOrdenadas.forEach((letra) => fragment.appendChild(createGrupoBloque(letra, grupos[letra])));
  matrizEl.appendChild(fragment);

  if (stale) {
    setStatus("📦 Mostrando datos guardados (no actualizados).", "stale");
  }
}

async function init() {
  renderSkeletons();

  try {
    const result = await loadEmpates();
    hideSkeletons();
    renderMatriz(result);
  } catch (error) {
    hideSkeletons();
    setStatus("❌ No se pudo cargar el radar de empates.", "error");
  }
}

export { init as initEmpates };