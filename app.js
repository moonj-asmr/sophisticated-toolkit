const FILTERS = [
  "All",
  "Essentials",
  "Power",
  "Hand Tools",
  "Cutting",
  "Measuring & Layout",
  "Storage",
  "Gripping",
  "Light & Safety",
  "Outdoor",
];

const state = {
  tools: [],
  active: "All",
};

const els = {
  filters: document.getElementById("filters"),
  grid: document.getElementById("tool-grid"),
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

function shuffle(items) {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function matches(tool) {
  const active = currentFilter();
  if (active === "All") return true;
  const tags = new Set(tool.tags || []);
  if (tool.essential) tags.add("Essentials");
  return tags.has(active);
}


function removeOrphanCards() {
  if (!els.grid) return;
  const parent = els.grid.parentElement;
  if (!parent) return;
  // Any .card that is a direct child of .catalog (sibling of #tool-grid) is full-width junk.
  [...parent.children].forEach((el) => {
    if (el !== els.grid && el.classList && el.classList.contains("card")) {
      el.remove();
    }
  });
}

function renderTools() {
  if (!els.grid) return;
  if (!state.tools.length) return;
  removeOrphanCards();

  const visible = state.tools.filter(matches);
  if (els.empty) {
    els.empty.hidden = visible.length > 0;
    els.empty.textContent = visible.length > 0 ? "" : "No tools match these filters.";
  }
  els.grid.innerHTML = "";

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
  state.tools = shuffle(tools);
  if (!FILTERS.includes(state.active)) state.active = "All";
  renderFilters();
  renderTools();
}

async function init() {
  removeOrphanCards();
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

removeOrphanCards();
init().catch((err) => {
  console.error(err);
  const hasCards = els.grid && els.grid.querySelector(".card");
  if (!hasCards && els.empty) {
    els.empty.hidden = true;
    els.empty.textContent = "";
  }
});
