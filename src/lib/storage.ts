import { Snapshot, InstagramUser } from '../types';
import { isValidInstagramUsername } from './parser';

const STORAGE_KEY = 'followtrack_snapshots';

function sanitizeUsers(users: InstagramUser[]): InstagramUser[] {
  if (!Array.isArray(users)) return [];
  return users.filter((u) => u && typeof u.username === 'string' && isValidInstagramUsername(u.username));
}

function sanitizeSnapshot(snap: Snapshot): Snapshot {
  const followers = sanitizeUsers(snap.followers);
  const following = sanitizeUsers(snap.following);
  return {
    ...snap,
    followers,
    following,
    followerCount: followers.length,
    followingCount: following.length,
  };
}

export function saveSnapshots(snapshots: Snapshot[]): void {
  try {
    const sanitized = snapshots.map(sanitizeSnapshot);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  } catch (err) {
    console.error('Error saving snapshots to localStorage:', err);
  }
}

export function loadSnapshots(): Snapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(sanitizeSnapshot);
  } catch (err) {
    console.error('Error loading snapshots from localStorage:', err);
    return [];
  }
}

export function addSnapshot(snapshot: Snapshot): Snapshot[] {
  const current = loadSnapshots();
  const clean = sanitizeSnapshot(snapshot);
  const updated = [clean, ...current.filter((s) => s.id !== snapshot.id)];
  saveSnapshots(updated);
  return updated;
}

export function deleteSnapshot(id: string): Snapshot[] {
  const current = loadSnapshots();
  const updated = current.filter((s) => s.id !== id);
  saveSnapshots(updated);
  return updated;
}

export function clearAllSnapshots(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Error clearing snapshots:', err);
  }
}
