import {
  InstagramDataCategoryId,
  InstagramExportCategory,
  InstagramExportDataset,
  InstagramExportRecord,
} from '../types/exportArchive';

export const exportCategoryDefinitions: Omit<InstagramExportCategory, 'datasets'>[] = [
  { id: 'connections', title: 'Connections', description: 'Followers, following, requests, contacts and accounts you have limited or removed.' },
  { id: 'messages', title: 'Messages', description: 'Inbox, message requests and conversations. Message text is shown only after opening a chat.' },
  { id: 'content', title: 'Content & media', description: 'Posts, stories, reels and media files included in your export.' },
  { id: 'interactions', title: 'Interactions', description: 'Likes, comments, saved items and story responses.' },
  { id: 'activity', title: 'Search & activity', description: 'Searches, link history, viewed content and other account activity.' },
  { id: 'account', title: 'Profile & personal info', description: 'Profile details, profile changes and information associated with your account.' },
  { id: 'security', title: 'Security & login', description: 'Login activity, devices, account status changes and signup details.' },
  { id: 'ads', title: 'Ads & interests', description: 'Ad topics, advertisers, suggested profiles and advertising preferences.' },
  { id: 'apps', title: 'Apps & preferences', description: 'Connected apps, settings, consent and notification preferences.' },
  { id: 'insights', title: 'Insights', description: 'Audience, reach and content performance files available in this export.' },
  { id: 'other', title: 'Other export data', description: 'Additional files that do not fit the categories above.' },
];

export function classifyInstagramPath(path: string): InstagramDataCategoryId {
  const normalized = path.replace(/\\/g, '/').toLowerCase();
  const parts = normalized.split('/');

  if (parts.includes('messages')) return 'messages';
  if (parts[0] === 'connections') return 'connections';
  if (parts[0] === 'media' || parts.includes('media') || parts.includes('posts') || parts.includes('reels') || parts.includes('stories')) return 'content';
  if (parts[0] === 'personal_information' || parts.includes('personal_information') || parts.includes('information_about_you')) return 'account';
  if (parts[0] === 'security_and_login_information') return 'security';
  if (parts.includes('threads') && /^(followers|following|recently_unfollowed_profiles)\.html$/.test(parts.at(-1) || '')) return 'connections';
  if (parts.includes('threads')) return 'activity';
  if (parts.includes('past_instagram_insights')) return 'insights';
  if (parts[0] === 'ads_information' || parts.includes('your_topics')) return 'ads';
  if (parts[0] === 'preferences' || parts[0] === 'apps_and_websites_off_of_instagram') return 'apps';
  if (parts[0] === 'logged_information' || parts.includes('other_activity')) return 'activity';
  if (['likes', 'comments', 'saved', 'story_interactions'].some((part) => parts.includes(part))) return 'interactions';
  if (normalized === 'start_here.html') return 'other';
  return 'other';
}

function cleanText(value: string): string {
  return value.replace(/\u00a0/g, ' ').replace(/[\t\r\n ]+/g, ' ').trim();
}

function recordFromText(id: string, raw: string, fallbackTitle: string): InstagramExportRecord | null {
  const content = cleanText(raw);
  if (!content || /^(no data available|no data|there is no data)/i.test(content)) return null;
  const parts = content.split(/\s+\|\s+|\s+•\s+/).filter(Boolean);
  const title = (parts[0] || fallbackTitle).slice(0, 140);
  const timestamp = content.match(/\b(?:20\d{2}[-/]\d{1,2}[-/]\d{1,2}|\w{3,9}\s+\d{1,2},?\s+20\d{2})\b/)?.[0];
  return { id, title, content: content.slice(0, 12000), timestamp };
}

function parseHtmlRecords(raw: string, sourceName: string): InstagramExportRecord[] {
  if (typeof DOMParser === 'undefined') {
    const text = raw.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ');
    const record = recordFromText(`${sourceName}:1`, text, sourceName);
    return record ? [record] : [];
  }

  const document = new DOMParser().parseFromString(raw, 'text/html');
  document.querySelectorAll('script, style, head, meta, link, noscript, svg').forEach((element) => element.remove());
  const allBlocks = Array.from(document.querySelectorAll('._a6-g'));
  const blocks = allBlocks.filter((element) => !element.parentElement?.closest('._a6-g'));
  let texts: string[] = [];

  if (blocks.length > 0) {
    return blocks.flatMap((element, index) => {
      const sender = cleanText(element.querySelector('._a6-h')?.textContent || '');
      const bodyElement = element.querySelector('._a6-p');
      const timestamp = cleanText(element.querySelector('._a6-o')?.textContent || '');
      const body = cleanText((bodyElement as HTMLElement | null)?.innerText || bodyElement?.textContent || '');
      const content = body || cleanText((element as HTMLElement).innerText || element.textContent || '');
      if (!content) return [];
      return [{
        id: `${sourceName}:${index + 1}`,
        title: `Message ${index + 1}`,
        content: content.slice(0, 12000),
        timestamp: timestamp || undefined,
        sender: sender || undefined,
      }];
    });
  } else {
    const rows = Array.from(document.querySelectorAll('tr')).filter((row) => row.querySelectorAll('tr').length === 0);
    if (rows.length > 0) {
      texts = rows.map((row) => Array.from(row.children).map((cell) => cell.textContent || '').join(' | '));
    } else {
      const anchors = Array.from(document.querySelectorAll('a')).filter((anchor) => cleanText(anchor.textContent || ''));
      if (anchors.length > 0) {
        texts = anchors.map((anchor) => `${anchor.textContent || ''} | ${anchor.getAttribute('href') || ''}`);
      } else {
        const bodyText = document.body?.innerText || document.body?.textContent || '';
        texts = bodyText.split(/\n{2,}/);
      }
    }
  }

  return texts.flatMap((text, index) => {
    const record = recordFromText(`${sourceName}:${index + 1}`, text, `Record ${index + 1}`);
    return record ? [record] : [];
  });
}

function parseJsonRecords(raw: string, sourceName: string): InstagramExportRecord[] {
  const data: unknown = JSON.parse(raw);
  const records: InstagramExportRecord[] = [];
  const visit = (value: unknown, path: string[]) => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (item && typeof item === 'object') {
          records.push({
            id: `${sourceName}:${records.length + 1}`,
            title: `${path.at(-1) || sourceName} ${index + 1}`,
            content: JSON.stringify(item).slice(0, 12000),
          });
        } else {
          visit(item, [...path, String(index + 1)]);
        }
      });
      return;
    }
    if (value && typeof value === 'object') {
      Object.entries(value as Record<string, unknown>).forEach(([key, child]) => visit(child, [...path, key]));
      return;
    }
    if (path.length > 0 && value !== null && value !== undefined) {
      records.push({
        id: `${sourceName}:${records.length + 1}`,
        title: path.at(-1) || sourceName,
        content: `${path.join(' · ')}: ${String(value)}`.slice(0, 12000),
      });
    }
  };
  visit(data, []);
  return records;
}

export function parseExportFileRecords(raw: string, filename: string): InstagramExportRecord[] {
  const extension = filename.split('.').pop()?.toLowerCase();
  if (extension === 'html' || extension === 'htm') return parseHtmlRecords(raw, filename);
  if (extension === 'json') {
    try {
      return parseJsonRecords(raw, filename);
    } catch {
      const record = recordFromText(`${filename}:1`, raw, filename);
      return record ? [record] : [];
    }
  }
  return raw.split(/\r?\n/).flatMap((line, index) => {
    const record = recordFromText(`${filename}:${index + 1}`, line, `Row ${index + 1}`);
    return record ? [record] : [];
  });
}

export function createExportCategories(datasets: Map<InstagramDataCategoryId, InstagramExportDataset[]>) {
  return exportCategoryDefinitions
    .map((definition) => ({ ...definition, datasets: datasets.get(definition.id) || [] }))
    .filter((category) => category.datasets.length > 0);
}
