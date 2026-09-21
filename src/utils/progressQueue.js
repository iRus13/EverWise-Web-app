const PREFIX = "everwise.progress.pending.v1:";
const EMPTY = { completedLessons: [], badges: [] };
const fields = ["completedLessons", "badges"];
const strings = value => Array.isArray(value) && value.length <= 512 && value.every(item => typeof item === "string" && item.length > 0 && item.length <= 200);
const prefixFor = uid => `${PREFIX}${encodeURIComponent(uid)}:`;

export function mergeProgress(...values) {
  return Object.fromEntries(fields.map(field => [field, [...new Set(values.flatMap(value => Array.isArray(value?.[field]) ? value[field] : []))]]));
}

function validRecord(value, uid, key) {
  return value?.version === 1 && value.uid === uid && typeof value.id === "string" &&
    key === prefixFor(uid) + value.id && strings(value.completedLessons) && strings(value.badges);
}

export function clearPendingProgress(uid, storage) {
  if (!uid || !storage) return false;
  try {
    const keys = Array.from({length:storage.length}, (_, index) => storage.key(index));
    keys.filter(key => key?.startsWith(prefixFor(uid))).forEach(key => storage.removeItem(key));
    return true;
  } catch { return false; }
}

// Each completion has its own storage key, so one tab cannot overwrite another
// tab's pending work. Acknowledgements delete only the exact records sent.
export function createProgressQueue({uid, storage, write, timeoutMs = 15_000, makeId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}) {
  if (typeof uid !== "string" || !uid || uid.length > 256) throw new Error("A progress owner is required");
  const records = new Map();
  const acknowledged = new Set();
  const listeners = new Set();
  let disposed = false, inFlight = null, failed = false;

  const read = () => {
    try {
      if (!storage) return;
      const keys = Array.from({length:storage.length}, (_, index) => storage.key(index));
      records.forEach(entry => { entry.persisted = false; });
      for (const key of keys) {
        if (!key?.startsWith(prefixFor(uid)) || acknowledged.has(key)) continue;
        const raw = storage.getItem(key);
        if (!raw || raw.length > 100_000) continue;
        try {
          const record = JSON.parse(raw);
          if (validRecord(record, uid, key)) records.set(key, {record, persisted:true});
        } catch { /* Ignore malformed entries; never upload arbitrary fields. */ }
      }
    } catch { records.forEach(entry => { entry.persisted = false; }); }
  };
  const state = () => ({
    uid,
    pending: records.size > 0,
    saving: Boolean(inFlight),
    failed,
    durable: [...records.values()].every(entry => entry.persisted),
    progress: mergeProgress(...[...records.values()].map(entry => entry.record)),
  });
  const notify = () => { if (!disposed) listeners.forEach(listener => listener(state())); };
  const persist = (key, entry) => {
    try {
      if (!storage) return;
      const serialized = JSON.stringify(entry.record);
      storage.setItem(key, serialized);
      entry.persisted = storage.getItem(key) === serialized;
    } catch { entry.persisted = false; }
  };
  read();

  const flush = () => {
    if (disposed) return Promise.resolve();
    if (inFlight) return inFlight.done;
    read();
    const batch = [...records.entries()];
    if (!batch.length) { failed = false; notify(); return Promise.resolve(); }
    batch.forEach(([key, entry]) => { if (!entry.persisted) persist(key, entry); });
    const progress = mergeProgress(...batch.map(([, entry]) => entry.record));
    let settle;
    const attempt = {done:new Promise(resolve => {settle = resolve;}), timer:null, settle:() => settle()};
    inFlight = attempt; failed = false; notify();
    const finish = failure => {
      if (inFlight !== attempt) return;
      clearTimeout(attempt.timer);
      inFlight = null; failed = failure;
      attempt.settle(); notify();
    };
    attempt.timer = setTimeout(() => finish(true), timeoutMs);
    Promise.resolve().then(() => {
      if (disposed) return;
      return write(uid, progress);
    }).then(() => {
      if (disposed) return;
      for (const [key] of batch) {
        records.delete(key); acknowledged.add(key);
        try { storage?.removeItem(key); } catch { /* Replay is idempotent after reload. */ }
      }
      if (!records.size) failed = false;
      finish(false);
      notify();
      // Work completed during this request belongs in a subsequent write.
      if (records.size && !inFlight) void flush();
    }, () => finish(true));
    return attempt.done;
  };

  const dispose = () => {
    disposed = true; listeners.clear();
    if (inFlight) { clearTimeout(inFlight.timer); inFlight.settle(); inFlight = null; }
  };
  return {
    snapshot: state,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    enqueue(progress) {
      if (disposed) return;
      if (!fields.every(field => strings(progress[field] ?? []))) throw new Error("Invalid progress");
      const delta = mergeProgress(EMPTY, progress);
      if (!delta.completedLessons.length && !delta.badges.length) return;
      const record = {version:1, uid, id:makeId(), ...delta};
      const key = prefixFor(uid) + record.id;
      const entry = {record, persisted:false};
      records.set(key, entry); persist(key, entry); failed = false;
      notify(); void flush();
    },
    refresh() { if (!disposed) { read(); notify(); void flush(); } },
    flush,
    clear() {
      clearPendingProgress(uid, storage);
      records.clear();
      dispose();
    },
    dispose,
  };
}
