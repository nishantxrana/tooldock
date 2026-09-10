const DB_NAME = 'tooldock-vault';
const DB_VERSION = 1;
const STORE_NAME = 'vault';
const EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

interface PatRecord {
  id: 'pat';
  ciphertext: ArrayBuffer;
  iv: Uint8Array;
  lockedAt: number;
  organization: string;
}

interface KeyRecord {
  id: 'key';
  key: CryptoKey;
}

function openVaultDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGet<T>(db: IDBDatabase, id: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(id);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

function idbPut(db: IDBDatabase, record: PatRecord | KeyRecord): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function idbDelete(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Encrypt the PAT and store it in IndexedDB alongside a non-extractable
 * AES-GCM-256 key. The plaintext PAT never touches disk.
 */
export async function lockPat(pat: string, organization: string): Promise<{ lockedAt: number }> {
  const db = await openVaultDb();

  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false, // non-extractable
    ['encrypt', 'decrypt'],
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(pat),
  );

  const lockedAt = Date.now();

  await idbPut(db, { id: 'key', key });
  await idbPut(db, { id: 'pat', ciphertext, iv, lockedAt, organization });

  db.close();
  return { lockedAt };
}

/**
 * Delete both the encrypted PAT and the key from IndexedDB.
 * Called on: manual unlock, disconnect, and auto-expiry.
 */
export async function unlockPat(): Promise<void> {
  try {
    const db = await openVaultDb();
    await idbDelete(db, 'pat');
    await idbDelete(db, 'key');
    db.close();
  } catch {
    // Best-effort — if IDB fails here, the data is inaccessible anyway.
  }
}

/**
 * On page load: check IndexedDB for a persisted PAT.
 * - Returns null if nothing is stored or IDB is unavailable.
 * - Returns null (and wipes IDB) if the 30-min window has expired.
 * - Decrypts and returns the PAT + resets lockedAt to now (fresh 30-min window).
 */
export async function loadLockedPat(): Promise<{
  pat: string;
  organization: string;
  lockedAt: number;
} | null> {
  const db = await openVaultDb();

  const patRecord = await idbGet<PatRecord>(db, 'pat');
  if (!patRecord) {
    db.close();
    return null;
  }

  // Expired — wipe and return null so caller falls back to in-memory-only mode.
  if (Date.now() - patRecord.lockedAt > EXPIRY_MS) {
    await idbDelete(db, 'pat');
    await idbDelete(db, 'key');
    db.close();
    return null;
  }

  const keyRecord = await idbGet<KeyRecord>(db, 'key');
  if (!keyRecord) {
    // Key missing but PAT present — inconsistent state, wipe both.
    await idbDelete(db, 'pat');
    db.close();
    return null;
  }

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(patRecord.iv) },
    keyRecord.key,
    patRecord.ciphertext,
  );

  const pat = new TextDecoder().decode(plaintext);

  // Reset lockedAt to now so the 30-min window starts fresh from this load.
  const lockedAt = Date.now();
  await idbPut(db, { ...patRecord, lockedAt });
  db.close();

  return { pat, organization: patRecord.organization, lockedAt };
}
