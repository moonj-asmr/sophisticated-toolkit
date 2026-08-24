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

Edit data/tools.json. Filter tags should match pills in app.js. Buy URLs are Amazon search placeholders.

## Stay in touch

The footer form collects addresses only. It does not send a welcome or newsletter from this site.

It POSTs to Buttondown’s embed subscribe endpoint:

`https://buttondown.com/api/emails/embed-subscribe/{username}`

The username lives in one place: `data/site.json` → `buttondownUsername`. The default is `housetools` (House Tools brand slug). Change that field if the newsletter uses `myhousetools` or another slug. Generated pages pick it up on `npm run build`; the homepage form action is also updated at runtime from the same file.

## License

Content and photography (c) Sophisticated Toolkit. All rights reserved.
