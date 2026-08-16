const FILTERS = [
  "All",
  "Essentials",
  "Power",
  "Hand Tools",
];

const state = {
  tools: [],
  active: "All",
};

const els = {
  filters: document.getElementById("filters"),
  grid: document.getElementById("tool-grid"),
  count: document.getElementById("result-count"),
  empty: document.getElementById("empty-state"),
  year: document.getElementById("year"),
  form: document.getElementById("signup-form"),
  note: document.getElementById("signup-note"),
};

if (els.year) els.year.textContent = String(new Date().getFullYear());

function currentFilter() {
  return FILTERS.includes(state.active) ? state.active : "All";
}

function renderFilters() {
  if (!els.filters) return;
  els.filters.innerHTML = "";
  const active = currentFilter();
  FILTERS.forEach((label) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pill" + (active === label ? " is-active" : "");
    btn.textContent = label;
    btn.setAttribute("aria-pressed", active === label ? "true" : "false");
    btn.addEventListener("click", () => toggleFilter(label));
    els.filters.appendChild(btn);
  });
}

function toggleFilter(label) {
  state.active = label === currentFilter() ? "All" : label;
  renderFilters();
  renderTools();
}

function matches(tool) {
  const active = currentFilter();
  if (active === "All") return true;
  const tags = new Set(tool.tags || []);
  if (tool.essential) tags.add("Essentials");
  return tags.has(active);
}

function renderTools() {
  if (!els.grid) return;
  if (!state.tools.length) return;

  const visible = state.tools.filter(matches);
  els.grid.innerHTML = "";
  if (els.count) {
    els.count.textContent =
      visible.length === state.tools.length
        ? `${visible.length} tools`
        : `${visible.length} of ${state.tools.length} tools`;
  }
  if (els.empty) {
    els.empty.hidden = visible.length > 0;
    els.empty.textContent = visible.length > 0 ? "" : "No tools match these filters.";
  }

  visible.forEach((tool) => {
    const article = document.createElement("article");
    article.className = "card";
    article.innerHTML = `
      <div class="card-image">
        <img src="${tool.image}" alt="${escapeHtml(tool.brand)} ${escapeHtml(tool.name)}" loading="lazy" />
      </div>
      <div class="card-body">
        <div class="card-meta">
          <p class="card-brand">${escapeHtml(tool.brand)}</p>
          <span class="origin">${escapeHtml(tool.origin)}</span>
        </div>
        <h2 class="card-name">${escapeHtml(tool.name)}</h2>
        <p class="card-blurb">${escapeHtml(tool.blurb)}</p>
        <div class="card-actions">
          <a class="get-it" href="${escapeAttr(tool.buyUrl)}" target="_blank" rel="noopener noreferrer sponsored">
            Get it <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    `;
    els.grid.appendChild(article);
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/'/g, "&#39;");
}

if (els.form) {
  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    els.form.hidden = true;
    if (els.note) els.note.hidden = false;
  });
}

function readEmbeddedTools() {
  const node = document.getElementById("tools-data");
  if (!node) return null;
  try {
    const data = JSON.parse(node.textContent);
    return Array.isArray(data) && data.length ? data : null;
  } catch {
    return null;
  }
}

function applyTools(tools) {
  state.tools = tools;
  if (!FILTERS.includes(state.active)) state.active = "All";
  renderFilters();
  const alreadyPainted =
    currentFilter() === "All" && els.grid && els.grid.querySelectorAll(".card").length === tools.length;
  if (alreadyPainted) {
    if (els.count) els.count.textContent = `${tools.length} tools`;
    if (els.empty) {
      els.empty.hidden = true;
      els.empty.textContent = "";
    }
    return;
  }
  renderTools();
}

async function init() {
  const embedded = readEmbeddedTools();
  if (embedded) {
    applyTools(embedded);
    return;
  }
  const res = await fetch("data/tools.json");
  if (!res.ok) throw new Error("Failed to load tools.json");
  const data = await res.json();
  if (!Array.isArray(data) || !data.length) throw new Error("Empty catalog");
  applyTools(data);
}

init().catch((err) => {
  console.error(err);
  const hasCards = els.grid && els.grid.querySelector(".card");
  if (!hasCards && els.count) els.count.textContent = "Unable to load catalog.";
  if (!hasCards && els.empty) {
    els.empty.hidden = true;
    els.empty.textContent = "";
  }
});
