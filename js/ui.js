// ui.js — Todo lo que toca el DOM vive aquí.
// Escucha eventos de api.js/goleadas.js y decide cómo pintarlos.

import { loadGoleadas, retryTeamsInBackground } from "./goleadas.js";
import { login } from "./api.js";

const tarjetasEl = document.getElementById("tarjetas");
const loadingEl = document.getElementById("loading");
const statsEl = document.getElementById("stats");
const statusEl = document.getElementById("status");
const sessionModal = document.getElementById("session-modal");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");

// ---------- Skeleton loading ----------

function renderSkeletons(count = 6) {
  loadingEl.innerHTML = "";
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

// ---------- Tarjeta de goleada ----------

function createTarjeta(goleada) {
  const card = document.createElement("article");
  card.className = "tarjeta";
  if (!goleada.hasRealNames) card.classList.add("tarjeta--pendiente");

  const flagOrPlaceholder = (flag, name) =>
    flag
      ? `<img src="${flag}" alt="Bandera de ${name}" class="bandera">`
      : `<span class="bandera bandera--vacia">🏳️</span>`;

  card.innerHTML = `
    <div class="tarjeta-equipos">
      <div class="equipo">
        ${flagOrPlaceholder(goleada.homeFlag, goleada.homeName)}
        <span>${goleada.homeName}</span>
      </div>
      <div class="marcador">
        <strong>${goleada.home_score} - ${goleada.away_score}</strong>
        <span class="diferencia">+${goleada.difference}</span>
      </div>
      <div class="equipo">
        ${flagOrPlaceholder(goleada.awayFlag, goleada.awayName)}
        <span>${goleada.awayName}</span>
      </div>
    </div>
    ${!goleada.hasRealNames ? '<p class="badge badge--pendiente">Nombres pendientes de cargar</p>' : ""}
  `;
  return card;
}

function renderTarjetas(goleadas) {
  tarjetasEl.innerHTML = "";

  if (goleadas.length === 0) {
    tarjetasEl.innerHTML = `<p class="empty-state">No se encontraron goleadas de 3 o más goles.</p>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  goleadas.forEach((goleada) => fragment.appendChild(createTarjeta(goleada)));
  tarjetasEl.appendChild(fragment);
}

// ---------- Stats y status ----------

function renderStats({ total, maxDifference }) {
  statsEl.textContent = `🔥 ${total} goleadas encontradas · Mayor diferencia: ${maxDifference} goles`;
}

function setStatus(message, type = "info") {
  statusEl.textContent = message;
  statusEl.className = `status-banner status-banner--${type}`;
}

function clearStatus() {
  statusEl.textContent = "";
  statusEl.className = "status-banner";
}

// ---------- Eventos de api.js ----------

document.addEventListener("api:retry-countdown", (event) => {
  const { remaining } = event.detail;
  setStatus(`⏱️ Límite de peticiones alcanzado. Reintentando en ${remaining}s...`, "warning");
});

document.addEventListener("api:retrying", (event) => {
  setStatus(`⚠️ El servidor no respondió. Reintentando...`, "warning");
});

document.addEventListener("api:using-cache", () => {
  setStatus(`📦 Mostrando datos guardados (no actualizados)`, "stale");
});

document.addEventListener("goleadas:teams-unavailable", () => {
  setStatus(`⚠️ No se pudieron cargar los nombres de equipos. Mostrando ids temporalmente.`, "warning");
});

document.addEventListener("api:session-expired", () => {
  sessionModal.classList.remove("hidden");
});

// ---------- Reautenticación sin reload ----------

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginError.textContent = "";

  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    await login(email, password);
    sessionModal.classList.add("hidden");
    await init(); // recargamos los datos con el nuevo token, sin reload()
  } catch (error) {
    loginError.textContent = "Correo o contraseña incorrectos.";
  }
});

// ---------- Orquestación principal ----------

async function init() {
  renderSkeletons();
  loadingEl.classList.remove("hidden");
  clearStatus();

  try {
    const result = await loadGoleadas();
    hideSkeletons();
    renderStats(result);
    renderTarjetas(result.goleadas);

    if (result.gamesStale || result.teamsStale) {
      setStatus("📦 Algunos datos son de la última sesión guardada.", "stale");
    }
  } catch (error) {
    hideSkeletons();
    if (error.message !== "SESSION_EXPIRED") {
      setStatus("❌ No se pudieron cargar los datos y no hay copia guardada.", "error");
    }
  }
}

init();