const DB_NAME = "booth-clips";
const STORE = "clips";
const MAX_CLIPS = 12;

export type StoredClip = {
  id: string;
  text: string;
  voiceId: string;
  voiceName: string;
  createdAt: number;
  sampleRate: number;
  wav: Blob;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function listClips(): Promise<StoredClip[]> {
  if (typeof indexedDB === "undefined") return [];
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => {
      const rows = (req.result as StoredClip[]).sort((a, b) => b.createdAt - a.createdAt);
      resolve(rows);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveClip(clip: StoredClip): Promise<StoredClip[]> {
  const existing = await listClips();
  const next = [clip, ...existing.filter((row) => row.id !== clip.id)].slice(0, MAX_CLIPS);
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    store.clear();
    for (const row of next) store.put(row);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return next;
}

export async function deleteClip(id: string): Promise<StoredClip[]> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return listClips();
}
