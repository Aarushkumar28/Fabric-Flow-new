/**
 * Converts any empty-string ("" or whitespace-only) value in a
 * Prisma `data` payload to `null`. This prevents empty strings
 * from violating @unique constraints on optional fields (e.g.
 * gstin, email, code) — Postgres treats NULL as distinct across
 * rows in a unique index.
 */
export function normalizeEmptyStrings(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  // If it's a string, trim it. If it becomes empty, return null.
  if (typeof data === 'string') {
    return data.trim() === '' ? null : data;
  }

  // Recursively process arrays
  if (Array.isArray(data)) {
    return data.map((item) => normalizeEmptyStrings(item));
  }

  // Recursively process plain objects
  if (typeof data === 'object' && !(data instanceof Date)) {
    const result: any = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = normalizeEmptyStrings(value);
    }
    return result;
  }

  return data;
}
