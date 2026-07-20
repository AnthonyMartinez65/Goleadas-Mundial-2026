// app.js — Controla la navegación entre pestañas
// Carga cada subproyecto solo la primera vez que se visita su pestaña

import { initGoleadas } from "./uiGoleadas.js";
import { initRutaCampeon } from "./uiRutaCampeon.js";

const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");
const loadedTabs = new Set();

const initializers = {
  goleadas: initGoleadas,
  "ruta-campeon": initRutaCampeon,
  // "muro": initMuro,       // se agrega en el próximo paso
  // "estadios": initEstadios,
};

function switchTab(tabName) {
  tabButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tabName));
  tabContents.forEach((section) => section.classList.toggle("active", section.id === `tab-${tabName}`));

  if (!loadedTabs.has(tabName) && initializers[tabName]) {
    loadedTabs.add(tabName);
    initializers[tabName]();
  }
}

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});

switchTab("goleadas");