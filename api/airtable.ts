import type { VercelRequest, VercelResponse } from '@vercel/node';

const AIRTABLE_API = 'https://api.airtable.com/v0';
const META_API = 'https://api.airtable.com/v0/meta';

function env() {
  const token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!token || !baseId) throw new Error('Airtable environment variables are missing.');
  return { token, baseId };
}

function normalized(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function snake(value: string) {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

async function airtable(path: string, init: RequestInit = {}) {
  const { token } = env();
  const response = await fetch(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body?.error?.message || body?.error || `Airtable request failed (${response.status}).`;
    throw new Error(message);
  }
  return body;
}

async function tables() {
  const { baseId } = env();
  return airtable(`${META_API}/bases/${baseId}/tables`);
}

async function resolveTable(requested: string) {
  const data = await tables();
  const wanted = normalized(requested);
  const table = data.tables?.find((t: any) => normalized(t.name) === wanted);
  if (!table) throw new Error(`Airtable table "${requested}" was not found.`);
  return table;
}

function decodeFields(fields: Record<string, any>) {
  const output: Record<string, any> = {};
  for (const [key, value] of Object.entries(fields || {})) {
    const name = snake(key);
    if (Array.isArray(value) && value.every(v => typeof v === 'string' && /^rec[a-zA-Z0-9]+$/.test(v))) {
      output[name] = value[0] || '';
    } else {
      output[name] = value;
    }
  }
  return output;
}

function encodeFields(input: Record<string, any>, table: any) {
  const actualByNormalized = new Map<string, string>(
    (table.fields || []).map((field: any) => [normalized(field.name), field.name])
  );
  const fields: Record<string, any> = {};
  for (const [key, value] of Object.entries(input || {})) {
    if (key === 'id' || value === undefined) continue;
    const actual = actualByNormalized.get(normalized(key)) || actualByNormalized.get(normalized(snake(key)));
    if (!actual) continue;
    const field = table.fields.find((f: any) => f.name === actual);
    const isLink = field?.type === 'multipleRecordLinks' || field?.type === 'singleLineText' && /(^|_)(client|project|inquiry)_id$/.test(key) && field?.type === 'multipleRecordLinks';
    if (field?.type === 'multipleRecordLinks') {
      fields[actual] = value ? (Array.isArray(value) ? value : [value]) : [];
    } else if (field?.type === 'number' || field?.type === 'currency' || field?.type === 'percent') {
      fields[actual] = value === '' || value === null ? null : Number(value);
    } else {
      fields[actual] = value;
    }
  }
  return fields;
}

async function listRecords(tableName: string) {
  const table = await resolveTable(tableName);
  const { baseId } = env();
  const records: any[] = [];
  let offset = '';
  do {
    const query = new URLSearchParams({ pageSize: '100' });
    if (offset) query.set('offset', offset);
    const page = await airtable(`${AIRTABLE_API}/${baseId}/${encodeURIComponent(table.id)}?${query}`);
    records.push(...(page.records || []).map((record: any) => ({ id: record.id, ...decodeFields(record.fields) })));
    offset = page.offset || '';
  } while (offset);
  return { table: table.name, records };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET' && req.query.action === 'tables') {
      const data = await tables();
      return res.status(200).json({
        tables: (data.tables || []).map((t: any) => ({
          id: t.id,
          name: t.name,
          fields: (t.fields || []).map((f: any) => ({ id: f.id, name: f.name, type: f.type })),
        })),
      });
    }

    const tableName = String(req.query.table || '');
    if (!tableName) return res.status(400).json({ error: 'Missing table parameter.' });

    if (req.method === 'GET') {
      return res.status(200).json(await listRecords(tableName));
    }

    const table = await resolveTable(tableName);
    const { baseId } = env();

    if (req.method === 'POST') {
      const fields = encodeFields(req.body?.fields || req.body || {}, table);
      const data = await airtable(`${AIRTABLE_API}/${baseId}/${encodeURIComponent(table.id)}`, {
        method: 'POST',
        body: JSON.stringify({ fields }),
      });
      return res.status(201).json({ id: data.id, ...decodeFields(data.fields) });
    }

    if (req.method === 'PATCH') {
      const recordId = String(req.body?.id || req.query.id || '');
      if (!recordId) return res.status(400).json({ error: 'Missing record id.' });
      const fields = encodeFields(req.body?.fields || req.body || {}, table);
      const data = await airtable(`${AIRTABLE_API}/${baseId}/${encodeURIComponent(table.id)}/${encodeURIComponent(recordId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ fields }),
      });
      return res.status(200).json({ id: data.id, ...decodeFields(data.fields) });
    }

    if (req.method === 'DELETE') {
      const recordId = String(req.body?.id || req.query.id || '');
      if (!recordId) return res.status(400).json({ error: 'Missing record id.' });
      await airtable(`${AIRTABLE_API}/${baseId}/${encodeURIComponent(table.id)}/${encodeURIComponent(recordId)}`, { method: 'DELETE' });
      return res.status(200).json({ ok: true, id: recordId });
    }

    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected Airtable error.';
    return res.status(500).json({ error: message });
  }
}
