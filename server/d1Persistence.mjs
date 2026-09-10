// Whole validated snapshots preserve existing cross-record invariants. A
// revision comparison prevents lost updates across separate Worker instances.
export function createD1Persistence(db, name, { maxRetries = 12 } = {}) {
  if (!db || typeof db.prepare !== "function") throw new TypeError("D1 binding is required");
  if (!["billing", "partners"].includes(name)) throw new TypeError("Unknown store");
  const readRow = () => db.prepare("SELECT revision, body FROM app_stores WHERE name = ?").bind(name).first();
  return {
    async read() {
      const row = await readRow();
      return row ? JSON.parse(row.body) : null;
    },
    async mutate(mutator) {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const row = await readRow();
        const outcome = await mutator(row ? JSON.parse(row.body) : null);
        if (!outcome.changed) return outcome.result;
        const body = JSON.stringify(outcome.data);
        // D1 has a per-row size limit; refuse oversized writes explicitly.
        if (new TextEncoder().encode(body).length > 1_500_000) throw new Error("STORE_CAPACITY_EXCEEDED");
        const result = row
          ? await db.prepare("UPDATE app_stores SET body = ?, revision = revision + 1 WHERE name = ? AND revision = ?").bind(body, name, row.revision).run()
          : await db.prepare("INSERT INTO app_stores (name, revision, body) VALUES (?, 1, ?) ON CONFLICT(name) DO NOTHING").bind(name, body).run();
        if (!result.success) throw new Error("STORE_WRITE_FAILED");
        if (result.meta?.changes === 1) return outcome.result;
      }
      throw new Error("STORE_WRITE_CONFLICT");
    },
  };
}
