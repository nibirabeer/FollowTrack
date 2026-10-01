import JSZip from 'jszip';
import { InstagramUser } from '../types';

/**
 * Strict validator for Instagram usernames.
 * Must be 1-30 chars, alphanumeric + periods + underscores.
 * Cannot contain spaces, curly brackets, semicolons, hash symbols, or HTML/CSS remnants.
 */
export function isValidInstagramUsername(username: string): boolean {
  if (!username) return false;
  if (username.length < 1 || username.length > 30) return false;

  // Disallow any CSS or HTML characters
  if (
    username.includes('{') ||
    username.includes('}') ||
    username.includes(';') ||
    username.includes(':') ||
    username.includes('#') ||
    username.includes(' ') ||
    username.includes('(') ||
    username.includes(')') ||
    username.includes('<') ||
    username.includes('>') ||
    username.includes('=') ||
    username.includes('"') ||
    username.includes("'") ||
    username.includes('/') ||
    username.includes('\\')
  ) {
    return false;
  }

  // Instagram rules: starts and ends with alphanumeric or underscore (not a period), only a-z, 0-9, ., _
  return /^[a-zA-Z0-9._]+$/.test(username) && !username.startsWith('.') && !username.endsWith('.');
}

/**
 * Normalizes username by trimming, removing leading '@', trailing slashes, and spaces.
 */
export function normalizeUsername(raw: string): string {
  if (!raw) return '';
  return raw
    .trim()
    .replace(/^@+/, '')
    .replace(/\/+$/, '')
    .replace(/^https?:\/\/(?:www\.)?instagram\.com\/(?:_u\/)?/i, '')
    .split('/')[0]
    .split('?')[0]
    .split('#')[0]
    .trim();
}

/**
 * Extracts a username from any raw object entry produced in Instagram JSON exports.
 */
function extractUsernameFromEntry(entry: any, stringItem?: any): string {
  // 1. Try stringItem.value
  if (stringItem && typeof stringItem.value === 'string' && stringItem.value.trim()) {
    const u = normalizeUsername(stringItem.value);
    if (isValidInstagramUsername(u)) return u;
  }

  // 2. Try entry.title
  if (entry && typeof entry.title === 'string' && entry.title.trim()) {
    const u = normalizeUsername(entry.title);
    if (isValidInstagramUsername(u)) return u;
  }

  // 3. Try stringItem.href (e.g. https://www.instagram.com/_u/username or https://www.instagram.com/username/)
  if (stringItem && typeof stringItem.href === 'string' && stringItem.href.trim()) {
    const u = normalizeUsername(stringItem.href);
    if (isValidInstagramUsername(u)) return u;
  }

  // 4. Try entry.href
  if (entry && typeof entry.href === 'string' && entry.href.trim()) {
    const u = normalizeUsername(entry.href);
    if (isValidInstagramUsername(u)) return u;
  }

  // 5. Try direct string if entry is string
  if (typeof entry === 'string') {
    const u = normalizeUsername(entry);
    if (isValidInstagramUsername(u)) return u;
  }

  return '';
}

/**
 * Extracts timestamp from stringItem or entry.
 */
function extractTimestamp(entry: any, stringItem?: any): string | undefined {
  const ts = stringItem?.timestamp || entry?.timestamp;
  if (typeof ts === 'number' && ts > 0) {
    const ms = ts > 1000000000000 ? ts : ts * 1000;
    return new Date(ms).toISOString();
  }
  return undefined;
}

/**
 * Parses generic Instagram JSON export entries.
 */
function parseInstagramGeneric(data: any): InstagramUser[] {
  const users: InstagramUser[] = [];
  const seen = new Set<string>();

  const processItem = (entry: any) => {
    if (!entry) return;

    if (Array.isArray(entry.string_list_data) && entry.string_list_data.length > 0) {
      for (const item of entry.string_list_data) {
        const username = extractUsernameFromEntry(entry, item);
        if (username && isValidInstagramUsername(username) && !seen.has(username.toLowerCase())) {
          seen.add(username.toLowerCase());
          users.push({
            username,
            profileUrl: `https://instagram.com/${username}`,
            timestamp: extractTimestamp(entry, item),
          });
        }
      }
    } else {
      const username = extractUsernameFromEntry(entry);
      if (username && isValidInstagramUsername(username) && !seen.has(username.toLowerCase())) {
        seen.add(username.toLowerCase());
        users.push({
          username,
          profileUrl: `https://instagram.com/${username}`,
          timestamp: extractTimestamp(entry),
        });
      }
    }
  };

  if (Array.isArray(data)) {
    for (const entry of data) {
      processItem(entry);
    }
  } else if (typeof data === 'object' && data !== null) {
    for (const key of Object.keys(data)) {
      if (Array.isArray(data[key])) {
        for (const entry of data[key]) {
          processItem(entry);
        }
      }
    }
  }

  return users;
}

/**
 * Reliably parses Instagram HTML export files using DOMParser.
 * Removes <style>, <script>, <head> tags to prevent extracting CSS rules as usernames.
 */
export function parseHtmlExport(htmlString: string): InstagramUser[] {
  const users: InstagramUser[] = [];
  const seen = new Set<string>();

  // Browser DOMParser
  if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
    try {
      const doc = new DOMParser().parseFromString(htmlString, 'text/html');
      // Strip style, script, head, meta, link tags completely
      doc.querySelectorAll('style, script, head, link, meta, noscript, svg, style').forEach((el) => el.remove());

      const anchors = doc.querySelectorAll('a');
      for (const a of anchors) {
        const href = a.getAttribute('href') || '';
        const text = a.textContent?.trim() || '';

        let username = '';
        if (href.includes('instagram.com')) {
          username = normalizeUsername(href);
        } else if (text) {
          username = normalizeUsername(text);
        }

        if (isValidInstagramUsername(username) && !seen.has(username.toLowerCase())) {
          seen.add(username.toLowerCase());
          users.push({
            username,
            profileUrl: `https://instagram.com/${username}`,
          });
        }
      }

      if (users.length > 0) return users;
    } catch {
      // Continue to regex fallback
    }
  }

  // Regex fallback matching ONLY clean instagram links
  const regex = /href=["']https?:\/\/(?:www\.)?instagram\.com\/(?:_u\/)?([a-zA-Z0-9._]+)\/?["']/gi;
  let match;
  while ((match = regex.exec(htmlString)) !== null) {
    const raw = match[1];
    const username = normalizeUsername(raw);
    if (isValidInstagramUsername(username) && !seen.has(username.toLowerCase())) {
      seen.add(username.toLowerCase());
      users.push({
        username,
        profileUrl: `https://instagram.com/${username}`,
      });
    }
  }

  return users;
}

export function parseFollowers(rawString: string): InstagramUser[] {
  const trimmed = rawString.trim();

  // HTML format check
  if (
    trimmed.startsWith('<!DOCTYPE') ||
    trimmed.includes('<html') ||
    trimmed.includes('<div') ||
    trimmed.includes('<a ') ||
    trimmed.includes('<body')
  ) {
    const htmlUsers = parseHtmlExport(trimmed);
    if (htmlUsers.length > 0) return htmlUsers;
  }

  try {
    const data = JSON.parse(trimmed);
    const users = parseInstagramGeneric(data);
    if (users.length > 0) return users;
    throw new Error('No valid followers found in JSON data');
  } catch (err) {
    // If it is HTML, never fall back to line splitting (which captures CSS)
    if (trimmed.includes('<') && trimmed.includes('>')) {
      const htmlUsers = parseHtmlExport(trimmed);
      if (htmlUsers.length > 0) return htmlUsers;
      throw new Error('Could not find follower links in this HTML export.');
    }

    const fallbackList = parseUsernameList(trimmed);
    if (fallbackList.length > 0) return fallbackList;

    if (err instanceof SyntaxError) {
      throw new Error('Invalid JSON format. Please verify your Instagram export file.');
    }
    throw err;
  }
}

export function parseFollowing(rawString: string): InstagramUser[] {
  const trimmed = rawString.trim();

  if (
    trimmed.startsWith('<!DOCTYPE') ||
    trimmed.includes('<html') ||
    trimmed.includes('<div') ||
    trimmed.includes('<a ') ||
    trimmed.includes('<body')
  ) {
    const htmlUsers = parseHtmlExport(trimmed);
    if (htmlUsers.length > 0) return htmlUsers;
  }

  try {
    const data = JSON.parse(trimmed);
    const users = parseInstagramGeneric(data);
    if (users.length > 0) return users;
    throw new Error('No valid following accounts found in JSON data');
  } catch (err) {
    if (trimmed.includes('<') && trimmed.includes('>')) {
      const htmlUsers = parseHtmlExport(trimmed);
      if (htmlUsers.length > 0) return htmlUsers;
      throw new Error('Could not find following links in this HTML export.');
    }

    const fallbackList = parseUsernameList(trimmed);
    if (fallbackList.length > 0) return fallbackList;

    if (err instanceof SyntaxError) {
      throw new Error('Invalid JSON format. Please verify your Instagram export file.');
    }
    throw err;
  }
}

export function parseUsernameList(text: string): InstagramUser[] {
  // If the input contains HTML tags, route to parseHtmlExport
  if (text.includes('<html') || text.includes('<style') || text.includes('<div') || text.includes('<!DOCTYPE')) {
    return parseHtmlExport(text);
  }

  const users: InstagramUser[] = [];
  const seen = new Set<string>();

  const lines = text.split(/[\n,;\r]+/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('{') || trimmed.startsWith('}')) {
      continue;
    }
    const username = normalizeUsername(trimmed);
    if (isValidInstagramUsername(username) && !seen.has(username.toLowerCase())) {
      seen.add(username.toLowerCase());
      users.push({
        username,
        profileUrl: `https://instagram.com/${username}`,
      });
    }
  }

  return users;
}

/**
 * Extracts and parses Instagram followers and following directly from a downloaded Instagram .zip archive.
 */
export async function parseInstagramZip(zipFile: File): Promise<{
  followers: InstagramUser[];
  following: InstagramUser[];
}> {
  const zip = new JSZip();
  const contents = await zip.loadAsync(zipFile);

  const followersList: InstagramUser[] = [];
  const followingList: InstagramUser[] = [];

  const files = Object.keys(contents.files);

  for (const filename of files) {
    const lower = filename.toLowerCase();
    const entry = contents.files[filename];
    if (entry.dir) continue;

    // Follower files: followers_1.json, followers.json, followers_1.html, etc.
    if (
      lower.includes('followers_') ||
      lower.endsWith('followers.json') ||
      lower.endsWith('followers.html') ||
      lower.includes('followers_1')
    ) {
      const text = await entry.async('string');
      const users = parseFollowers(text);
      followersList.push(...users);
    } else if (
      lower.includes('following') &&
      !lower.includes('close_friends') &&
      !lower.includes('pending') &&
      !lower.includes('hashtag') &&
      (lower.endsWith('.json') || lower.endsWith('.html'))
    ) {
      const text = await entry.async('string');
      const users = parseFollowing(text);
      followingList.push(...users);
    }
  }

  // Deduplicate case-insensitively and filter only valid usernames
  const uniqueFollowers = Array.from(
    new Map(
      followersList
        .filter((u) => isValidInstagramUsername(u.username))
        .map((u) => [u.username.toLowerCase(), u])
    ).values()
  );

  const uniqueFollowing = Array.from(
    new Map(
      followingList
        .filter((u) => isValidInstagramUsername(u.username))
        .map((u) => [u.username.toLowerCase(), u])
    ).values()
  );

  if (uniqueFollowers.length === 0 && uniqueFollowing.length === 0) {
    throw new Error(
      'Could not find followers or following files inside this ZIP. Please ensure it is the archive from Instagram.'
    );
  }

  return {
    followers: uniqueFollowers,
    following: uniqueFollowing,
  };
}
