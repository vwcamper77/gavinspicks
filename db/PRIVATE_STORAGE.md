# Private records migration

A dedicated London Supabase project `qqgtirkdbtquvsdonvmm` has been provisioned at a quoted $0/month. Server read/write/delete probes passed on 12 September 2026. The owner authorised partial recovery and cutover rather than waiting for Blob recovery. `GP_PRIVATE_STORE=supabase` is explicitly configured; credentials alone do not select the provider. No paid plan or spend cap was changed.

The source Blob file index was read in full (8 records, no pagination): six curation decisions, two sold reports, no availability reviews or signup leads. All six decision hashes were matched to candidate URLs, none in the saved feed. `data/recovery-holds.json` blocks those URLs and the two reported listing IDs across fresh imports. The two pending reports have been reconstructed in Supabase with explicit recovery notes; their dates are recovery times, not claimed original report times. Original decision payloads have NOT been recovered or invented. The old Blob store remains intact.

The database contains reports, immutable availability reviews, curation decisions and signup leads. `db/private-records.sql` denies browser/anonymous access and grants only the server service role. Configure `GP_SUPABASE_URL` and `GP_SUPABASE_SECRET_KEY` server-side in the existing Vercel project and locally. Never prefix the secret with `NEXT_PUBLIC_` or commit it.

Reads use indexed collections and batches of up to 500 JSON records. They no longer list Blob files then fetch every file separately. Writes preserve create-only reports and immutable review records; curation and signup updates explicitly upsert. Failures do not silently fall back to an empty store or another provider.

## Recovery and cutover

The original `gavinspicks-reports` store is blocked by its Hobby advanced-operation allowance. Keep it intact. Source data is not recovered merely because a new empty database exists.

1. Provision the owner-selected destination; apply the SQL and verify anonymous access is denied and server access works.
2. Once Blob reads are available, export all four collections: `node --env-file=.env.local scripts/migrate-private-records.mjs export work/private-records-backup.json`. The file is written with private permissions only after every source read succeeds. Do not put private backups into Git.
3. Pause admin writes while taking the final export and importing. Run `node --env-file=.env.local scripts/migrate-private-records.mjs import work/private-records-backup.json`. The import is create-only, verifies each write and refuses conflicts with existing destination data. It never deletes source data.
4. Reconcile all owner hide/reject decisions and pending reports. Do not switch to an empty store as a workaround for unreadable decisions. If immediate operation is needed before source recovery, obtain an explicit owner decision on how to reconcile the missing records first.
5. Set `GP_PRIVATE_STORE=supabase` in production and deploy through the existing GitHub/Vercel project. Verify the live feed, authenticated review reads, report submission and signup storage. Do not describe migration as complete before recovery and production verification.

Rollback only to a reconciled store: after new writes start on Supabase, switching back to Blob without synchronising those writes would lose decisions. Leave the old store undeleted until recovery and reconciliation are complete.
