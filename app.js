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
        <h2 class="card-name"><a href="/tools/${escapeAttr(tool.id || "")}/">${escapeHtml(tool.name)}</a></h2>
        <p class="card-blurb">${escapeHtml(tool.blurb)}</p>
        <div class="card-actions">
          <a class="get-it" href="${escapeAttr(tool.buyUrl)}" target="_blank" rel="${escapeAttr(buyRel(tool.buyUrl))}"
             data-tool-id="${escapeAttr(tool.id || "")}"
             data-tool-name="${escapeAttr(tool.name || "")}"
             data-tool-brand="${escapeAttr(tool.brand || "")}">
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

function buyRel(url) {
  return /amazon\./i.test(String(url ?? ""))
    ? "noopener noreferrer sponsored"
    : "noopener noreferrer";
}

const DEFAULT_BUTTONDOWN_USERNAME = "housetools";
const SIGNUP_OK = "On the list.";
const SIGNUP_ERR = "Could not add that address.";

function embedSubscribeUrl(username) {
  const slug = String(username || DEFAULT_BUTTONDOWN_USERNAME).trim() || DEFAULT_BUTTONDOWN_USERNAME;
  return `https://buttondown.com/api/emails/embed-subscribe/${encodeURIComponent(slug)}`;
}

function showSignupNote(text, isError) {
  if (!els.note) return;
  els.note.hidden = false;
  els.note.textContent = text;
  els.note.classList.toggle("is-error", Boolean(isError));
}

function trackSubscribe() {
  if (typeof gtag !== "function") return;
  gtag("event", "subscribe", { method: "buttondown" });
}

async function loadSiteConfig() {
  try {
    const res = await fetch("/data/site.json");
    if (!res.ok) return {};
    const data = await res.json();
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

function isSubscribeSuccess(res) {
  return res.ok || res.status === 409;
}

async function bindSignup() {
  if (!els.form) return;
  const submitBtn = els.form.querySelector('button[type="submit"]');

  els.form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (els.note) {
      els.note.hidden = true;
      els.note.classList.remove("is-error");
    }
    if (submitBtn) submitBtn.disabled = true;
    els.form.setAttribute("aria-busy", "true");

    try {
      const res = await fetch(els.form.action, {
        method: "POST",
        body: new URLSearchParams(new FormData(els.form)),
        headers: { Accept: "application/json, text/html" },
      });
      if (!isSubscribeSuccess(res)) throw new Error("subscribe failed");
      els.form.hidden = true;
      showSignupNote(SIGNUP_OK, false);
      trackSubscribe();
    } catch {
      showSignupNote(SIGNUP_ERR, true);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      els.form.removeAttribute("aria-busy");
    }
  });

  const site = await loadSiteConfig();
  els.form.action = embedSubscribeUrl(site.buttondownUsername);
}

bindSignup();

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


function asinFromUrl(url) {
  const m = String(url || "").match(/\/(?:dp|gp\/product|product)\/([A-Z0-9]{10})/i);
  return m ? m[1].toUpperCase() : "";
}

function trackGetItClick(anchor) {
  if (typeof gtag !== "function") return;
  const href = anchor.href || "";
  const card = anchor.closest(".card, .tool-page");
  const name =
    anchor.getAttribute("data-tool-name") ||
    (card && card.querySelector(".card-name, .tool-name")?.textContent?.trim()) ||
    "";
  const brand =
    anchor.getAttribute("data-tool-brand") ||
    (card && card.querySelector(".card-brand")?.textContent?.trim()) ||
    "";
  const id = anchor.getAttribute("data-tool-id") || "";
  const asin = asinFromUrl(href);
  gtag("event", "get_it_click", {
    tool_id: id,
    tool_name: name,
    tool_brand: brand,
    asin: asin,
    link_url: href,
  });
}

document.addEventListener(
  "click",
  (e) => {
    const a = e.target && e.target.closest ? e.target.closest("a.get-it") : null;
    if (!a) return;
    trackGetItClick(a);
  },
  true
);

async function init() {
  if (!els.grid) return;
  removeOrphanCards();
  const embedded = readEmbeddedTools();
  if (embedded) {
    applyTools(embedded);
    return;
  }
  const res = await fetch("/data/tools.json");
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
