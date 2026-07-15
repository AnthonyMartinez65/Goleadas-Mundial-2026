// api.js — Capa de comunicación con la API del Mundial 2026
// Toda petición pasa por acá. Nada de fetch suelto en otros archivos.

const BASE_URL = "https://worldcup26.ir";
const TOKEN_KEY = "wc26_token";
const MAX_RETRIES = 4;
const BASE_DELAY_MS = 1000; // 1s, 2s, 4s, 8s

// ---------- Manejo del token ----------

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ---------- Autenticación ----------

export async function login(email, password) {
  const response = await fetch(`${BASE_URL}/auth/authenticate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error("No se pudo iniciar sesión. Revisa tus credenciales.");
  }

  const data = await response.json();
  setToken(data.token);
  return data.user;
}

export async function register(name, email, password) {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  if (!response.ok) {
    throw new Error("No se pudo registrar el usuario.");
  }

  const data = await response.json();
  setToken(data.token);
  return data.user;
}

// ---------- Cache en localStorage (modo offline) ----------

function cacheKey(endpoint) {
  return `wc26_cache_${endpoint}`;
}

function saveToCache(endpoint, data) {
  const entry = { data, savedAt: Date.now() };
  localStorage.setItem(cacheKey(endpoint), JSON.stringify(entry));
}

function loadFromCache(endpoint) {
  const raw = localStorage.getItem(cacheKey(endpoint));
  if (!raw) return null;
  return JSON.parse(raw);
}

// ---------- Utilidad: esperar con countdown visible ----------
// Dispara un evento personalizado cada segundo para que ui.js
// pueda pintar el countdown, sin que api.js toque el DOM.

async function waitWithCountdown(seconds, endpoint) {
  for (let remaining = seconds; remaining > 0; remaining--) {
    document.dispatchEvent(
      new CustomEvent("api:retry-countdown", {
        detail: { endpoint, remaining },
      })
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

// ---------- El corazón: fetch autenticado con resiliencia ----------

export async function apiFetch(endpoint) {
  const url = `${BASE_URL}${endpoint}`;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let response;

    try {
      response = await fetch(url, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    } catch (networkError) {
      // Sin conexión / falló la red antes de llegar al servidor
      return handleFailure(endpoint, attempt, BASE_DELAY_MS * 2 ** attempt);
    }

    // 401: sesión expirada — no se reintenta, se limpia y se avisa
    if (response.status === 401) {
      clearToken();
      document.dispatchEvent(
        new CustomEvent("api:session-expired", { detail: { endpoint } })
      );
      throw new Error("SESSION_EXPIRED");
    }

    // 429: rate limit — backoff con countdown visible
    if (response.status === 429) {
      const retryAfterHeader = response.headers.get("Retry-After");
      const waitSeconds = retryAfterHeader
        ? Number(retryAfterHeader)
        : Math.round((BASE_DELAY_MS * 2 ** attempt) / 1000);

      if (attempt < MAX_RETRIES) {
        await waitWithCountdown(waitSeconds, endpoint);
        continue; // siguiente intento
      }
      return handleFailure(endpoint, attempt, 0);
    }

    // 500: error de servidor — backoff exponencial normal
    if (response.status === 500) {
      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * 2 ** attempt;
        document.dispatchEvent(
          new CustomEvent("api:retrying", { detail: { endpoint, delay } })
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      return handleFailure(endpoint, attempt, 0);
    }

    // Cualquier otro error HTTP (400, 404, etc.) no se reintenta
    if (!response.ok) {
      throw new Error(`Error ${response.status} en ${endpoint}`);
    }

    // Éxito: guardamos copia fresca y devolvemos los datos
    const data = await response.json();
    saveToCache(endpoint, data);
    return { data, stale: false };
  }
}

// Se llama cuando se agotan los reintentos: intenta usar el cache
function handleFailure(endpoint) {
  const cached = loadFromCache(endpoint);
  if (cached) {
    document.dispatchEvent(
      new CustomEvent("api:using-cache", { detail: { endpoint } })
    );
    return { data: cached.data, stale: true, savedAt: cached.savedAt };
  }
  throw new Error(`No se pudo obtener ${endpoint} y no hay datos en cache.`);
}