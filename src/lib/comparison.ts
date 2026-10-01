import { Snapshot, ComparisonResult, InstagramUser } from '../types';

/**
 * Normalizes username for key comparison.
 */
function toKey(username: string): string {
  return username.toLowerCase().trim().replace(/^@+/, '');
}

/**
 * Compares two snapshots. Automatically respects chronological order so that
 * unfollowedMe and newFollowers are never inverted even if snapshots were passed in reverse order.
 */
export function compareSnapshots(
  snapshotA: Snapshot,
  snapshotB: Snapshot
): ComparisonResult {
  // Determine which is older and which is newer based on date
  const dateA = new Date(snapshotA.date).getTime();
  const dateB = new Date(snapshotB.date).getTime();

  let oldSnapshot = snapshotA;
  let newSnapshot = snapshotB;

  // If snapshotA is newer than snapshotB, swap them
  if (dateA > dateB) {
    oldSnapshot = snapshotB;
    newSnapshot = snapshotA;
  }

  const isSameSnapshot = oldSnapshot.id === newSnapshot.id;

  // Build maps and sets using normalized keys
  const oldFollowerMap = new Map<string, InstagramUser>();
  oldSnapshot.followers.forEach((u) => {
    const k = toKey(u.username);
    if (k) oldFollowerMap.set(k, u);
  });

  const newFollowerMap = new Map<string, InstagramUser>();
  newSnapshot.followers.forEach((u) => {
    const k = toKey(u.username);
    if (k) newFollowerMap.set(k, u);
  });

  const newFollowingMap = new Map<string, InstagramUser>();
  newSnapshot.following.forEach((u) => {
    const k = toKey(u.username);
    if (k) newFollowingMap.set(k, u);
  });

  // 1. Unfollowed Me: in old followers but NOT in new followers
  const unfollowedMe: InstagramUser[] = [];
  if (!isSameSnapshot) {
    for (const [key, user] of oldFollowerMap) {
      if (!newFollowerMap.has(key)) {
        unfollowedMe.push(user);
      }
    }
  }

  // 2. New Followers: in new followers but NOT in old followers
  const newFollowers: InstagramUser[] = [];
  if (!isSameSnapshot) {
    for (const [key, user] of newFollowerMap) {
      if (!oldFollowerMap.has(key)) {
        newFollowers.push(user);
      }
    }
  }

  // 3. Don't Follow Me Back: I follow them (new.following) but they don't follow me back (not in new.followers)
  const theyDontFollowBack: InstagramUser[] = [];
  for (const [key, user] of newFollowingMap) {
    if (!newFollowerMap.has(key)) {
      theyDontFollowBack.push(user);
    }
  }

  // 4. I Don't Follow Back: They follow me (new.followers) but I don't follow them back (not in new.following)
  const iDontFollowBack: InstagramUser[] = [];
  for (const [key, user] of newFollowerMap) {
    if (!newFollowingMap.has(key)) {
      iDontFollowBack.push(user);
    }
  }

  // 5. Mutual Followers: In BOTH new.followers AND new.following
  const mutualFollowers: InstagramUser[] = [];
  for (const [key, user] of newFollowerMap) {
    if (newFollowingMap.has(key)) {
      mutualFollowers.push(user);
    }
  }

  return {
    unfollowedMe,
    newFollowers,
    theyDontFollowBack,
    iDontFollowBack,
    mutualFollowers,
  };
}

export function analyzeCurrentSnapshot(snapshot: Snapshot): ComparisonResult {
  return compareSnapshots(snapshot, snapshot);
}
