#!/usr/bin/env node
/**
 * Generate thin crawlable tool PDPs, the essentials kit page, and sitemap
 * from data/tools.json. Writes tools/{id}/index.html, kits/essentials/index.html,
 * and regenerates sitemap.xml.
 */
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://myhousetools.com";
const GA_ID = "G-924R9QWW3P";
const ASSET_V = "wk0";
const ID_RE = /^[a-z0-9][a-z0-9-]*$/;
const META_LEN = 155;
const KIT_INTRO =
  "Not for the trade. The short list of tools a house actually needs, in the versions worth keeping. Not the most expensive or most extravagant, just the most competent, and made to last.";

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/'/g, "&#39;");
}

function truncateMeta(text, max = META_LEN) {
  const s = String(text ?? "").replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  const base = (lastSpace > 80 ? cut.slice(0, lastSpace) : cut).replace(/[\s.,;:]+$/, "");
  return `${base}…`;
}

function sitePath(path) {
  const raw = String(path ?? "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `/${raw.replace(/^\/+/, "")}`;
}

function absoluteUrl(path) {
  const raw = String(path ?? "").trim();
  if (!raw) return SITE;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${SITE}/${raw.replace(/^\/+/, "")}`;
}

function buyRel(url) {
  return /amazon\./i.test(String(url ?? ""))
    ? "noopener noreferrer sponsored"
    : "noopener noreferrer";
}

function renderFooter(year) {
  const y = escapeHtml(year || String(new Date().getFullYear()));
  return `  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-col">
        <h2 class="footer-heading"><a href="/disclosure/">Affiliate disclosure</a></h2>
        <p>As an Amazon Associate I earn from qualifying purchases. <a href="/disclosure/">More</a></p>
      </div>
      <div class="footer-col">
        <h2 class="footer-heading">Stay in touch</h2>
        <p>Occasional notes on tools worth keeping. No noise.</p>
        <form class="signup" id="signup-form" action="#" method="post">
          <label class="sr-only" for="email">Email</label>
          <input type="email" id="email" name="email" placeholder="name@example.com" required autocomplete="email" />
          <button type="submit">Join</button>
        </form>
        <p class="signup-note" id="signup-note" hidden>Thanks — signup coming soon.</p>
      </div>
    </div>
    <p class="copyright">© <span id="year">${y}</span> House Tools · <a href="/kits/essentials/">Essentials</a></p>
  </footer>`;
}

function renderChromeHead({ title, description, canonical, ogImage }) {
  const e = {
    title: escapeHtml(title),
    description: escapeAttr(description),
    canonical: escapeAttr(canonical),
    ogImage: escapeAttr(ogImage),
  };
  return `  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${e.title}</title>
  <meta name="description" content="${e.description}" />
  <meta name="robots" content="index,follow" />
  <link rel="canonical" href="${e.canonical}" />
  <meta property="og:title" content="${e.title}" />
  <meta property="og:description" content="${e.description}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${e.canonical}" />
  <meta property="og:image" content="${e.ogImage}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${e.title}" />
  <meta name="twitter:description" content="${e.description}" />
  <meta name="twitter:image" content="${e.ogImage}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Newsreader:opsz,wght@6..72,400;6..72,500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/styles.css?v=${ASSET_V}" />
  <link rel="icon" href="/favicon.ico?v=house3" sizes="any" />
  <link rel="icon" type="image/png" href="/images/favicon-32.png?v=house3" sizes="32x32" />
  <link rel="apple-touch-icon" href="/images/apple-touch-icon.png?v=house3" />
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){ dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', '${GA_ID}');
  </script>`;
}

function renderLockupHeader(extra = "") {
  return `  <header class="site-header">
    <div class="header-inner">
      <p class="site-title">
        <a href="/">
          <img src="/images/house-tools-lockup.png" alt="House Tools" width="1536" height="1024" />
        </a>
      </p>
${extra}    </div>
  </header>`;
}

function renderToolPage(tool) {
  const brand = String(tool.brand ?? "");
  const name = String(tool.name ?? "");
  const origin = String(tool.origin ?? "");
  const blurb = String(tool.blurb ?? "");
  const id = String(tool.id ?? "");
  const buyUrl = String(tool.buyUrl ?? "");
  const image = String(tool.image ?? "");

  const title = `${brand} ${name} — House Tools`;
  const description = truncateMeta(blurb);
  const canonical = `${SITE}/tools/${id}/`;
  const ogImage = absoluteUrl(image);
  const imageSrc = sitePath(image);
  const heading = `${brand} ${name}`.trim();
  const alt = heading;
  const rel = buyRel(buyUrl);
  const year = String(new Date().getFullYear());

  const e = {
    title: escapeHtml(title),
    description: escapeAttr(description),
    canonical: escapeAttr(canonical),
    ogImage: escapeAttr(ogImage),
    imageSrc: escapeAttr(imageSrc),
    alt: escapeAttr(alt),
    heading: escapeHtml(heading),
    origin: escapeHtml(origin),
    blurb: escapeHtml(blurb),
    buyUrl: escapeAttr(buyUrl),
    rel: escapeAttr(rel),
    id: escapeAttr(id),
    name: escapeAttr(name),
    brand: escapeAttr(brand),
    year: escapeHtml(year),
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
${renderChromeHead({
    title,
    description,
    canonical,
    ogImage,
  })}
</head>
<body>
${renderLockupHeader()}

  <main class="tool-page">
    <a class="tool-back" href="/">← All tools</a>
    <div class="tool-meta">
      <span class="origin">${e.origin}</span>
    </div>
    <h1 class="tool-name">${e.heading}</h1>
    <p class="tool-blurb">${e.blurb}</p>
    <div class="tool-hero">
      <img src="${e.imageSrc}" alt="${e.alt}" />
    </div>
    <div class="tool-actions">
      <a class="get-it" href="${e.buyUrl}" target="_blank" rel="${e.rel}"
         data-tool-id="${e.id}"
         data-tool-name="${e.name}"
         data-tool-brand="${e.brand}">
        Get it <span aria-hidden="true">→</span>
      </a>
    </div>
  </main>

${renderFooter(e.year)}

  <script src="/app.js?v=${ASSET_V}"></script>
</body>
</html>
`;
}

function renderKitCard(tool) {
  const brand = String(tool.brand ?? "");
  const name = String(tool.name ?? "");
  const origin = String(tool.origin ?? "");
  const blurb = String(tool.blurb ?? "");
  const id = String(tool.id ?? "");
  const buyUrl = String(tool.buyUrl ?? "");
  const imageSrc = sitePath(tool.image);
  return `      <article class="card">
        <div class="card-image">
          <img src="${escapeAttr(imageSrc)}" alt="${escapeAttr(`${brand} ${name}`)}" loading="lazy" />
        </div>
        <div class="card-body">
          <div class="card-meta">
            <p class="card-brand">${escapeHtml(brand)}</p>
            <span class="origin">${escapeHtml(origin)}</span>
          </div>
          <h2 class="card-name"><a href="/tools/${escapeAttr(id)}/">${escapeHtml(name)}</a></h2>
          <p class="card-blurb">${escapeHtml(blurb)}</p>
          <div class="card-actions">
            <a class="get-it" href="${escapeAttr(buyUrl)}" target="_blank" rel="${escapeAttr(buyRel(buyUrl))}"
               data-tool-id="${escapeAttr(id)}"
               data-tool-name="${escapeAttr(name)}"
               data-tool-brand="${escapeAttr(brand)}">
              Get it <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </article>`;
}

function renderKitPage(essentials) {
  const title = "Essentials — tools a house actually needs";
  const description =
    "The short list of tools a house actually needs, in the versions worth keeping. Not the most expensive or most extravagant, just the most competent, and made to last.";
  const canonical = `${SITE}/kits/essentials/`;
  const ogImage = `${SITE}/images/house-tools-lockup.png`;
  const year = String(new Date().getFullYear());
  const cards = essentials.map(renderKitCard).join("\n");
  const headerExtra = `      <h1 class="kit-title">The tools a house actually needs</h1>
      <p class="manifesto">${escapeHtml(KIT_INTRO)}</p>
`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
${renderChromeHead({ title, description, canonical, ogImage })}
</head>
<body>
${renderLockupHeader(headerExtra)}

  <main>
    <section class="catalog" aria-label="Essential tools">
      <div class="grid">
${cards}
      </div>
    </section>
  </main>

${renderFooter(year)}

  <script src="/app.js?v=${ASSET_V}"></script>
</body>
</html>
`;
}

function renderSitemap(ids) {
  const urls = [
    { loc: `${SITE}/`, priority: "1.0" },
    { loc: `${SITE}/kits/essentials/`, priority: "0.8" },
    { loc: `${SITE}/disclosure/`, priority: "0.5" },
    ...ids.map((id) => ({ loc: `${SITE}/tools/${id}/`, priority: "0.8" })),
  ];
  const body = urls
    .map(
      ({ loc, priority }) => `  <url>
    <loc>${loc}</loc>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

async function main() {
  const raw = await readFile(join(ROOT, "data", "tools.json"), "utf8");
  const tools = JSON.parse(raw);
  if (!Array.isArray(tools) || !tools.length) {
    throw new Error("data/tools.json is empty or not an array");
  }

  const toolsDir = join(ROOT, "tools");
  await rm(toolsDir, { recursive: true, force: true });

  const ids = [];
  for (const tool of tools) {
    const id = String(tool?.id ?? "").trim();
    if (!ID_RE.test(id)) {
      throw new Error(`Invalid or missing tool id: ${JSON.stringify(tool?.id)}`);
    }
    ids.push(id);
    const dir = join(toolsDir, id);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "index.html"), renderToolPage(tool), "utf8");
  }

  const essentials = tools.filter((tool) => tool.essential === true);
  const kitDir = join(ROOT, "kits", "essentials");
  await mkdir(kitDir, { recursive: true });
  await writeFile(join(kitDir, "index.html"), renderKitPage(essentials), "utf8");

  await writeFile(join(ROOT, "sitemap.xml"), renderSitemap(ids), "utf8");
  console.log(
    `Wrote ${ids.length} tool pages, kits/essentials/ (${essentials.length} tools), and sitemap.xml`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
