// Server/CLI only. Never import this module into a client component.
// Keep Blob available for rollback and recovery; selecting Supabase never silently
// falls back to a different database when a read or write fails.
export function createSupabaseStore({url, key, fetcher = fetch}) {
  if (!url || !key) throw new Error('Private database configuration is missing.');
  const base = new URL('/rest/v1/gavin_private_records', url);
  if (base.protocol !== 'https:') throw new Error('Private database requires HTTPS.');
  async function request(params, options = {}) {
    const endpoint = new URL(base);
    for (const [name, value] of Object.entries(params)) endpoint.searchParams.set(name, String(value));
    const response = await fetcher(endpoint, {
      ...options, cache: 'no-store', signal: AbortSignal.timeout(15000),
      headers: {apikey: key, ...(key.startsWith('eyJ') ? {Authorization: `Bearer ${key}`} : {}),
        'Content-Type': 'application/json', ...options.headers},
    });
    if (!response.ok) throw new Error(`Private database request failed (${response.status}).`);
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }
  function split(path) {
    const match = /^(sold-reports|availability-reviews|curation-decisions|leads)\/([a-zA-Z0-9_-]+)\.json$/.exec(path);
    if (!match) throw new Error('Invalid private record path.');
    return {collection: match[1], id: match[2]};
  }
  return {
    async read(path) {
      const {collection, id} = split(path);
      const rows = await request({collection: `eq.${collection}`, id: `eq.${id}`, select: 'payload', limit: 1});
      return rows[0]?.payload ?? null;
    },
    async all(prefix) {
      const collection = split(`${prefix}probe.json`).collection;
      const rows = []; let after;
      while (true) {
        const page = await request({collection: `eq.${collection}`, select: 'id,payload', order: 'id.asc', limit: 500,
          ...(after ? {id: `gt.${after}`} : {})});
        rows.push(...page.map(row => row.payload));
        if (page.length < 500) return rows;
        after = page.at(-1).id;
      }
    },
    async write(path, payload, overwrite = false) {
      const identity = split(path);
      await request(overwrite ? {on_conflict: 'collection,id'} : {}, {method: 'POST',
        headers: {Prefer: `${overwrite ? 'resolution=merge-duplicates,' : ''}return=minimal`},
        body: JSON.stringify({...identity, payload})});
    },
    async remove(path) {
      const {collection, id} = split(path);
      await request({collection: `eq.${collection}`, id: `eq.${id}`}, {method: 'DELETE', headers: {Prefer: 'return=minimal'}});
    },
  };
}

async function blobStore() {
  const {get, list, put, del} = await import('@vercel/blob');
  async function read(path) {
    const result = await get(path, {access: 'private', useCache: false});
    if (!result) return null;
    if (result.statusCode !== 200) throw new Error('Could not read private record.');
    return new Response(result.stream).json();
  }
  return {read,
    async all(prefix) {
      const records = []; let cursor;
      do {
        const page = await list({prefix, cursor, limit: 1000});
        for (const blob of page.blobs) {
          const record = await read(blob.url);
          if (!record) throw new Error('Private record disappeared during read.');
          records.push(record);
        }
        cursor = page.hasMore ? page.cursor : undefined;
      } while (cursor);
      return records;
    },
    async write(path, payload, overwrite = false) {
      await put(path, JSON.stringify(payload), {access: 'private', addRandomSuffix: false,
        allowOverwrite: overwrite, contentType: 'application/json'});
    },
    async remove(path) {await del(path);},
  };
}
export async function privateStore() {
  // Cutover must be explicit; credentials alone must not activate an empty store.
  const provider = process.env.GP_PRIVATE_STORE ?? 'blob';
  if (provider === 'blob') return blobStore();
  if (provider === 'supabase') return createSupabaseStore({url: process.env.GP_SUPABASE_URL, key: process.env.GP_SUPABASE_SECRET_KEY});
  throw new Error('Unknown private database provider.');
}
