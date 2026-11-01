# indexnow-ping

Zero-dependency Node script that pings [IndexNow](https://www.indexnow.org) — the protocol used by **Bing, Yandex, Seznam, Naver and Yep**. Bing's index feeds ChatGPT search, so for a new site this is the fastest free way to get crawled.

Reads every URL from your `sitemap.xml`, verifies your key file is live, then submits them in one POST.

```
node indexnow-ping.mjs example.com YOUR_KEY            # whole sitemap
node indexnow-ping.mjs example.com YOUR_KEY /pricing   # only these paths
HOST=example.com KEY=YOUR_KEY node indexnow-ping.mjs
```

## Setup

1. Generate a key — any GUID works: `node -e "console.log(crypto.randomUUID())"`
2. Serve it at `https://<host>/<key>.txt` with the key as the **whole body** (plain text, no markup). Search engines fetch this to confirm you own the host.
3. Deploy, then run the script. Never ping a build that isn't live — the key check will fail.

## Notes

- Node 18+ (global `fetch`), no dependencies, single file — drop it in `scripts/` and wire it to your deploy.
- `200` = URLs accepted. `202` = accepted, key validation still pending. `403` = key invalid, `422` = URLs don't belong to the host.
- IndexNow deduplicates URLs it has seen recently; re-pinging unchanged pages is wasted calls.

## Used in production by

- [AI Rap Video](https://useairapvideo.com) — turns a photo or a topic into a lip-synced AI rap video

## License

[MIT](LICENSE)
