# Sophisticated Toolkit

**Fewer, better tools. The essentials.**

Quiet editorial static catalog of heirloom-grade home-improvement tools.

## Stack

- Static HTML/CSS/JS
- Tool data in data/tools.json
- Packshots in images/
- Node serve for Railway static hosting

## Local development

Run `npm start`. It rebuilds tool pages from `data/tools.json`, then serves on port 3000 or `$PORT`. Use `npm run build` to generate `tools/{id}/`, `kits/essentials/`, and `sitemap.xml` without serving.

## Railway

Connect this GitHub repo. The start script runs `npm run build` then serves the site root.

## Content

Edit `data/tools.json`, then run `npm run build`. Filter tags should match pills in `app.js`. Buy URLs are Amazon search placeholders.

Homepage layout lives in `index.template.html`; `index.html` is generated with the catalog cards. Tool PDPs under `tools/` and `kits/essentials/` are also generated — do not edit them by hand.

## License

Content and photography (c) Sophisticated Toolkit. All rights reserved.
