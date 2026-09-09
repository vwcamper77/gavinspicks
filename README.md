# Gavin’s Picks

UK manual and rare modern-classic car discovery, 1995–2010 plus named BMW 1M and Audi ur-quattro exceptions, £10,000–£100,000.

## Run locally / VS Code

Use Node.js 22.13 or later within Node 22.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Open this repository folder in VS Code.

## Deploy with Vercel

1. Import `vwcamper77/gavinspicks` from GitHub.
2. Framework: **Next.js**. Root directory: repository root (`./`).
3. Use the default `npm run build`; leave Output Directory unset. Node.js 22.x.
4. The listing feed is versioned in Git. Visitor sold reports use the connected private Vercel Blob store and its server-only BLOB_READ_WRITE_TOKEN.
5. Deploy, then add your domain under Project → Settings → Domains and follow the DNS records Vercel supplies.

The existing GitHub-connected Vercel project serves https://www.gavinspicks.com (verified 8 September 2026). Pushes to main trigger deployment; do not create a duplicate project.

## Feed and scheduled updates

- `data/models.json`: 73 model search targets; guide prices are indicative.
- `data/feed.json`: verified listing evidence and activity history.
- `data/history.json`: recovered watch links, kept separate from current verified listings.
- `data/discovery-queue.json`: discovery URLs that still require advert/photo verification.
- `lib/eligibility.ts`: shared server/client gate. Sold, POA, unavailable, missing checks, out-of-range and stale results are suppressed. Checks expire after 24 hours.
- `/api/feed`: current qualifying results, with no-store caching. Browser refreshes every minute.

An hourly Codex automation is configured separately on the owner’s machine to import existing car-watch outputs, search further models, inspect photographs, update the data and push to this repository. It requires the owner’s Codex app/host and connections to be available. Once Vercel is connected to GitHub, pushes trigger deployments. **Vercel does not perform the searches itself.** There is no pretend scraper or unattended photo-check API in this repository.

Read `UPDATE_PROTOCOL.md` before updating. Preserve first discovery times, keep uncertainty out of Latest finds, and verify the deployed result before claiming it is live. Historical social posts cannot guarantee a car remains available.

## Validation

Facebook group, eBay UK and Auto Trader discovery is part of the owner-hosted hourly workflow. `node scripts/discovery-plan.mjs` generates explicit queries for the next 12 models; `--all` covers the full watchlist. Sources and optional Facebook group URLs live in `data/discovery-sources.json`. These are browser/web searches, not authenticated marketplace API integrations. Facebook coverage depends on public indexing or the owner's accessible browser session. The updater records actual coverage in `data/discovery-coverage.json` after executing searches; generation alone does not search or publish listings.

```sh
npm test
npm run typecheck
npm run build
```

## Social launch pack

`social/` contains a GP avatar, an Instagram launch card, matching bios, launch captions, video scripts and a first-week plan. Instagram and TikTok accounts are not yet created; handle availability, owner email and verification are outstanding. Nothing has been posted. Proposed monetisation is documented as a hypothesis; billing and paid memberships are not implemented.

Seller photographs remain remote source references. Obtain appropriate permission before re-uploading dealer photos for promotional social content.

## Visitor sold reports

“Mark as sold” queues a private report for the next hourly seller/photo recheck. It does not immediately remove a car. One pending report per listing is stored centrally; duplicate clicks do not create duplicate reports. The API accepts only known listing IDs and stores no visitor identity. Errors are shown honestly. The hourly updater reads and resolves reports using scripts/sold-reports.mjs; see UPDATE_PROTOCOL.md.

## Owner availability admin

Open `/admin` (also linked in the footer) and sign in with the private `GP_ADMIN_KEY` production secret. Use a cryptographically random key of at least 40 characters. It is never sent to the client bundle or stored in Git. Sign-in uses an HttpOnly, SameSite=Strict cookie, Secure on HTTPS, with a 12-hour expiry. Rotating the key invalidates existing sessions. Do not share it with visitors.

The admin queue shows visitor reports, original adverts, hidden cars and review history. Check the original advert, add a review note, then confirm unavailable and hide, or dismiss a report that is incorrect. Reports never hide cars automatically. Hidden cars can have their admin hold removed after a new check; this does not bypass ordinary eligibility or freshness rules.

Reviews are immutable records in private Blob under `availability-reviews/`. A report is cleared only after its review is saved. Hides apply by listing ID and original URL to the initial page, refreshed feed, shared car page and newly generated share images. Feed updates cannot override an admin hold. If review storage cannot be read, new page loads suppress listings and the feed API reports an error rather than republishing hidden cars. Existing visitors refresh their listings every minute. Previously cached third-party share previews may take time to update.
