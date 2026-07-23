# ⚽ Mundial 2026 · Cruce de Datos

Aplicación JavaScript que consume la API pública del Mundial 2026 (`https://worldcup26.ir`) para construir 4 vistas de análisis que no existen como tales en ningún endpoint individual de la API.

**Laboratorio 2 · ISW-521 Programación en Ambiente Web I · Universidad Técnica Nacional**
Categoría A: Cruce de Datos y Analítica

## Subproyectos incluidos

- 🔥 **Rastreador de Goleadas** — partidos con diferencia de 3+ goles, ordenados de mayor a menor
- 🏆 **La Ruta del Campeón** — itinerario de partidos de un equipo, cruzado con datos de estadio
- 🧱 **El Muro** — los 5 equipos con menos goles en contra en fase de grupos, con su próximo rival
- 🏟️ **Analítica de Estadios** — asistencia potencial por estadio (capacidad × partidos albergados)

## Arquitectura de resiliencia implementada

- `async/await` exclusivo en todas las llamadas — cero `.then()/.catch()`
- Backoff exponencial (1s, 2s, 4s, 8s) ante errores 500
- Countdown visible ante error 429 (límite de tasa)
- Modo offline con `localStorage`: última respuesta exitosa de cada endpoint, con indicador de "datos no actualizados"
- Cada subproyecto resuelve su propio Reto de Resiliencia (ver código de cada módulo de lógica)

> **Nota:** por indicación del profesor, los requisitos de autenticación JWT no aplican en este laboratorio.

## Cómo correrlo

1. Clona el repositorio
2. Ábrelo en VS Code
3. Instala la extensión **Live Server** (si no la tienes)
4. Click derecho sobre `index.html` → **"Open with Live Server"**

No requiere instalación de dependencias ni build — JavaScript vanilla con ES Modules.

## Estructura del proyecto
├── index.html
├── css/
│ └── styles.css
├── js/
│ ├── api.js # Capa de fetch, backoff, cache offline
│ ├── goleadas.js # Lógica: Rastreador de Goleadas
│ ├── uiGoleadas.js
│ ├── rutaCampeon.js # Lógica: La Ruta del Campeón
│ ├── uiRutaCampeon.js
│ ├── muro.js # Lógica: El Muro
│ ├── uiMuro.js
│ ├── estadios.js # Lógica: Analítica de Estadios
│ ├── uiEstadios.js
│ └── app.js # Controlador de navegación entre pestañas

## Endpoints consumidos

- `GET /get/games`
- `GET /get/teams`
- `GET /get/groups`
- `GET /get/stadiums`

## Autor

Anthony Martínez