import { InstagramExportArchive } from '../types/exportArchive';

const DATABASE_NAME = 'followtrack-export-library';
const STORE_NAME = 'archives';
const DATABASE_VERSION = 1;

function openExportDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('This browser does not support local archive storage.'));
      return;
    }

    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'snapshotId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open local archive storage.'));
  });
}

export async function saveExportArchive(snapshotId: string, archive: InstagramExportArchive): Promise<void> {
  const database = await openExportDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put({ snapshotId, archive });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('Could not save the archive library on this device.'));
      transaction.onabort = () => reject(transaction.error || new Error('Archive storage was interrupted.'));
    });
  } finally {
    database.close();
  }
}

export async function loadExportArchive(snapshotId: string): Promise<InstagramExportArchive | null> {
  const database = await openExportDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(snapshotId);
      request.onsuccess = () => resolve((request.result?.archive as InstagramExportArchive | undefined) || null);
      request.onerror = () => reject(request.error || new Error('Could not read the archive library on this device.'));
    });
  } finally {
    database.close();
  }
}

export async function deleteExportArchive(snapshotId: string): Promise<void> {
  const database = await openExportDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).delete(snapshotId);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('Could not remove the local archive library.'));
    });
  } finally {
    database.close();
  }
}

export async function clearExportArchives(): Promise<void> {
  const database = await openExportDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).clear();
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('Could not clear local archive libraries.'));
    });
  } finally {
    database.close();
  }
}
