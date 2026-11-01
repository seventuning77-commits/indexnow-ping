#!/usr/bin/env node
// Ping IndexNow (Bing, Yandex, Seznam, Naver, Yep) with the URLs from your
// sitemap. Zero dependencies, Node 18+. Bing feeds ChatGPT search, so this is
// the fastest free way to get a new site crawled.
//
//   node indexnow-ping.mjs example.com YOUR_KEY
//   node indexnow-ping.mjs example.com YOUR_KEY /pricing /about   # only these paths
//   HOST=example.com KEY=YOUR_KEY node indexnow-ping.mjs
//
// Your key must be served live at https://<host>/<key>.txt with the key as the
// whole body — search engines fetch it to confirm you own the host. Any GUID
// works; get one at https://www.bing.com/indexnow

const [hostArg, keyArg, ...paths] = process.argv.slice(2);
const HOST = process.env.HOST || hostArg;
const KEY = process.env.KEY || keyArg;
const ORIGIN = `https://${HOST}`;

if (!HOST || !KEY) {
  console.error('usage: node indexnow-ping.mjs <host> <key> [paths...]');
  process.exit(1);
}

async function sitemapUrls() {
  const res = await fetch(`${ORIGIN}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap.xml: HTTP ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

async function main() {
  const urls = paths.length
    ? paths.map((p) => new URL(p, ORIGIN).toString())
    : await sitemapUrls();
  const foreign = urls.filter((u) => new URL(u).host !== HOST);
  if (foreign.length) throw new Error(`not on ${HOST}: ${foreign.join(', ')}`);

  // Never ping before the key file is live.
  const keyRes = await fetch(`${ORIGIN}/${KEY}.txt`);
  if (!keyRes.ok || (await keyRes.text()).trim() !== KEY) {
    throw new Error('key file is not live yet: deploy first, then rerun');
  }

  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `${ORIGIN}/${KEY}.txt`,
      urlList: urls,
    }),
  });
  // 200/202 = accepted (202 means the key check is still pending).
  console.log(`IndexNow: HTTP ${res.status} for ${urls.length} URL(s)`);
  for (const u of urls) console.log(`  ${u}`);
  if (res.status !== 200 && res.status !== 202) {
    console.error(await res.text());
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
