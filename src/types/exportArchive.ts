export type InstagramDataCategoryId =
  | 'connections'
  | 'messages'
  | 'content'
  | 'interactions'
  | 'activity'
  | 'account'
  | 'security'
  | 'ads'
  | 'apps'
  | 'insights'
  | 'other';

export interface InstagramExportRecord {
  id: string;
  title: string;
  content: string;
  timestamp?: string;
  sender?: string;
}

export interface InstagramExportDataset {
  id: string;
  title: string;
  sourceType: 'html' | 'json' | 'text' | 'media';
  records: InstagramExportRecord[];
}

export interface InstagramExportCategory {
  id: InstagramDataCategoryId;
  title: string;
  description: string;
  datasets: InstagramExportDataset[];
}

export interface InstagramExportArchive {
  sourceName: string;
  analyzedAt: string;
  totalFiles: number;
  categories: InstagramExportCategory[];
}
