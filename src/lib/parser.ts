import JSZip from 'jszip';
import { InstagramUser } from '../types';
import { createExportCategories, classifyInstagramPath, parseExportFileRecords } from './exportArchive';
import { InstagramDataCategoryId, InstagramExportArchive, InstagramExportDataset, InstagramExportRecord } from '../types/exportArchive';

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

function extractInstagramProfileUsername(rawUrl: string): string {
  if (!rawUrl.trim()) return '';

  try {
    const url = new URL(rawUrl, 'https://www.instagram.com');
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    if (hostname !== 'instagram.com') return '';

    const segments = url.pathname.split('/').filter(Boolean).map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    });
    if (segments[0]?.toLowerCase() === '_u') segments.shift();

    const candidate = segments[0] || '';
    const reservedRoutes = new Set(['accounts', 'explore', 'direct', 'about', 'developer', 'legal', 'p']);
    if (!candidate || reservedRoutes.has(candidate.toLowerCase())) return '';

    const username = normalizeUsername(candidate);
    return isValidInstagramUsername(username) ? username : '';
  } catch {
    return '';
  }
}

/**
 * Parses Instagram HTML export files from Instagram profile links and account labels.
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
        const text = (a.textContent || a.getAttribute('aria-label') || '').trim();
        const username = extractInstagramProfileUsername(href) || (!href ? normalizeUsername(text) : '');

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

  // Regex fallback for environments without DOMParser and HTML with unusual whitespace.
  const regex = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
  let match;
  while ((match = regex.exec(htmlString)) !== null) {
    const raw = match[1] || match[2] || match[3] || '';
    const username = extractInstagramProfileUsername(raw);
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
      throw new Error('No Instagram account links were found in this followers HTML file. Select followers_1.html from the original Instagram export, or upload the full ZIP instead.');
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
      throw new Error('No Instagram account links were found in this following HTML file. Select following.html from the original Instagram export, or upload the full ZIP instead.');
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
export async function parseInstagramZip(
  zipFile: File,
  onProgress?: (completed: number, total: number) => void
): Promise<{
  followers: InstagramUser[];
  following: InstagramUser[];
  archive: InstagramExportArchive;
}> {
  const zip = new JSZip();
  const contents = await zip.loadAsync(zipFile);

  const followersList: InstagramUser[] = [];
  const followingList: InstagramUser[] = [];
  const files = Object.keys(contents.files);
  const dataByCategory = new Map<InstagramDataCategoryId, Map<string, InstagramExportDataset>>();
  const mediaExtensions = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'mov', 'm4v', 'aac', 'ogg', 'mp3', 'srt']);
  const readableExtensions = new Set(['html', 'htm', 'json', 'txt', 'csv']);
  const coreConnectionTexts = new Map<string, string>();
  let messageThreadNumber = 0;

  // Validate the required lists before scanning the much larger media and message sections.
  for (const filename of files) {
    const lower = filename.replace(/\\/g, '/').toLowerCase();
    const basename = lower.split('/').pop() || '';
    const inConnectionFolder = /(^|\/)connections\/followers_and_following\//.test(lower);
    const isRootListFile = !lower.includes('/') && /^followers(?:_\d+)?\.(?:json|html)$|^following(?:_\d+)?\.(?:json|html)$/.test(basename);
    if ((!inConnectionFolder && !isRootListFile) || !/^followers(?:_\d+)?\.(?:json|html)$|^following(?:_\d+)?\.(?:json|html)$/.test(basename)) continue;
    const entry = contents.files[filename];
    if (entry.dir) continue;
    try {
      const text = await entry.async('string');
      coreConnectionTexts.set(filename, text);
      if (/^followers(?:_\d+)?\.(?:json|html)$/.test(basename)) followersList.push(...parseFollowers(text));
      else followingList.push(...parseFollowing(text));
    } catch {
      // Missing or malformed core lists are reported below with a clear recovery hint.
    }
  }

  const uniqueFollowers = Array.from(
    new Map(followersList.filter((user) => isValidInstagramUsername(user.username)).map((user) => [user.username.toLowerCase(), user])).values()
  );
  const uniqueFollowing = Array.from(
    new Map(followingList.filter((user) => isValidInstagramUsername(user.username)).map((user) => [user.username.toLowerCase(), user])).values()
  );

  if (uniqueFollowers.length === 0 || uniqueFollowing.length === 0) {
    const missing = [uniqueFollowers.length === 0 ? 'followers' : '', uniqueFollowing.length === 0 ? 'following' : ''].filter(Boolean).join(' and ');
    throw new Error(`This Instagram ZIP is missing a readable ${missing} list. Download both Followers and Following in JSON or HTML format.`);
  }

  const addDatasetRecords = (
    categoryId: InstagramDataCategoryId,
    datasetId: string,
    title: string,
    sourceType: InstagramExportDataset['sourceType'],
    records: InstagramExportRecord[]
  ) => {
    let datasets = dataByCategory.get(categoryId);
    if (!datasets) {
      datasets = new Map();
      dataByCategory.set(categoryId, datasets);
    }
    const existing = datasets.get(datasetId);
    if (existing) existing.records.push(...records);
    else datasets.set(datasetId, { id: datasetId, title, sourceType, records });
  };

  for (let index = 0; index < files.length; index += 1) {
    const filename = files[index];
    if (index % 24 === 0 || index === files.length - 1) onProgress?.(index + 1, files.length);
    const lower = filename.replace(/\\/g, '/').toLowerCase();
    const entry = contents.files[filename];
    if (entry.dir) continue;

    const basename = lower.split('/').pop() || '';
    const extension = basename.split('.').pop() || '';
    const normalizedPath = lower.replace(/^\.\//, '');
    const categoryId = classifyInstagramPath(normalizedPath);

    if (mediaExtensions.has(extension)) {
      const parent = normalizedPath.split('/').slice(0, -1).join('/') || 'media';
      const id = `media:${parent}`;
      const existing = dataByCategory.get('content')?.get(id);
      const sequence = (existing?.records.length || 0) + 1;
      const mediaType = ['mp4', 'mov', 'm4v'].includes(extension) ? 'Video' : ['aac', 'ogg', 'mp3'].includes(extension) ? 'Audio' : extension === 'srt' ? 'Caption file' : 'Image';
      addDatasetRecords('content', id, parent.split('/').map((part) => part.replace(/_/g, ' ')).join(' / '), 'media', [{
        id: `${id}:${sequence}`,
        title: basename,
        content: `${mediaType} file · .${extension}`,
      }]);
      continue;
    }

    if (!readableExtensions.has(extension)) continue;

    try {
      const text = coreConnectionTexts.get(filename) ?? await entry.async('string');

      if (/no-data\.(?:txt|html)$/i.test(basename) || /^\s*(?:no data available|no data)\s*$/i.test(text)) {
        continue;
      }

      const extensionType: InstagramExportDataset['sourceType'] = extension === 'json' ? 'json' : ['html', 'htm'].includes(extension) ? 'html' : 'text';
      const messagePath = normalizedPath.includes('/messages/');
      const isMessageChunk = messagePath && /^message_\d+\.html$/.test(basename);
      let datasetId = normalizedPath;
      let title = basename.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

      if (isMessageChunk) {
        const parent = normalizedPath.split('/').slice(0, -1).join('/');
        datasetId = `conversation:${parent}`;
        const existing = dataByCategory.get('messages')?.get(datasetId);
        if (existing) {
          title = existing.title;
        } else {
          messageThreadNumber += 1;
          const folder = parent.split('/').pop() || '';
          const label = folder.replace(/^instagramuser_?/i, '').replace(/_\d+$/, '').replace(/and(\d+)others/gi, ' + $1 others').replace(/_/g, ' ').trim();
          title = label && !/^\d+$/.test(label) ? `Chat · ${label}` : `Conversation ${String(messageThreadNumber).padStart(3, '0')}`;
        }
      } else if (messagePath && basename === 'chats.html') {
        title = 'Conversation list';
      } else {
        title = basename.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
      }

      const records = parseExportFileRecords(text, normalizedPath).map((record, recordIndex) =>
        isMessageChunk ? { ...record, title: `Message ${recordIndex + 1}` } : record
      );
      addDatasetRecords(categoryId, datasetId, title, extensionType, records);
    } catch {
      // Keep scanning the rest of the archive if one export document is malformed.
    }

  }

  const datasets = new Map<InstagramDataCategoryId, InstagramExportDataset[]>(
    Array.from(dataByCategory, ([category, items]) => [category, Array.from(items.values())])
  );

  return {
    followers: uniqueFollowers,
    following: uniqueFollowing,
    archive: {
      sourceName: zipFile.name,
      analyzedAt: new Date().toISOString(),
      totalFiles: files.filter((filename) => !contents.files[filename].dir).length,
      categories: createExportCategories(datasets),
    },
  };
}
