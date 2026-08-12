const FILTERS = [
  "All",
  "Essentials",
  "Power",
  "Hand Tools",
  "Measuring & Layout",
  "Cutting",
  "Gripping",
  "Storage",
  "Light & Safety",
];

const state = {
  tools: [],
  active: new Set(["All"]),
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

els.year.textContent = String(new Date().getFullYear());

function renderFilters() {
  els.filters.innerHTML = "";
  FILTERS.forEach((label) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pill" + (state.active.has(label) ? " is-active" : "");
    btn.textContent = label;
    btn.setAttribute("aria-pressed", state.active.has(label) ? "true" : "false");
    btn.addEventListener("click", () => toggleFilter(label));
    els.filters.appendChild(btn);
  });
}

function toggleFilter(label) {
  if (label === "All") {
    state.active = new Set(["All"]);
  } else {
    state.active.delete("All");
    if (state.active.has(label)) {
      state.active.delete(label);
    } else {
      state.active.add(label);
    }
    if (state.active.size === 0) {
      state.active.add("All");
    }
  }
  renderFilters();
  renderTools();
}

function matches(tool) {
  if (state.active.has("All")) return true;
  const tags = new Set(tool.tags || []);
  if (tool.essential) tags.add("Essentials");
  for (const f of state.active) {
    if (tags.has(f)) return true;
  }
  return false;
}

function renderTools() {
  const visible = state.tools.filter(matches);
  els.grid.innerHTML = "";
  els.count.textContent =
    visible.length === state.tools.length
      ? `${visible.length} tools`
      : `${visible.length} of ${state.tools.length} tools`;
  els.empty.hidden = visible.length > 0;

  visible.forEach((tool) => {
    const article = document.createElement("article");
    article.className = "card";
    article.innerHTML = `
      <div class="card-image">
        <img src="${tool.image}" alt="${escapeHtml(tool.brand)} ${escapeHtml(tool.name)}" loading="lazy" width="1100" height="825" />
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
    .replace(&//g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/'/g, "&#39;");
}

els.form.addEventListener("submit", (e) => {
  e.preventDefault();
  els.form.hidden = true;
  els.note.hidden = false;
});

async function init() {
  const res = await fetch("data/tools.json");
  if (!res.ok) throw new Error("Failed to load tools.json");
  state.tools = await res.json();
  renderFilters();
  renderTools();
}

init().catch((err) => {
  console.error(err);
  els.count.textContent = "Unable to load catalog.";
});
