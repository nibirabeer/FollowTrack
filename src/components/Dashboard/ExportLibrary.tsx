import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Blocks,
  FileArchive,
  Heart,
  Image,
  MessageCircle,
  Megaphone,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { InstagramDataCategoryId, InstagramExportArchive, InstagramExportDataset } from '../../types/exportArchive';

const categoryIcons: Record<InstagramDataCategoryId, typeof UsersRound> = {
  connections: UsersRound,
  messages: MessageCircle,
  content: Image,
  interactions: Heart,
  activity: Activity,
  account: UserRound,
  security: ShieldCheck,
  ads: Megaphone,
  apps: Blocks,
  insights: BarChart3,
  other: FileArchive,
};

function countRecords(dataset: InstagramExportDataset) {
  return dataset.records.length;
}

export function ExportLibrary({ archive, snapshotLabel }: { archive: InstagramExportArchive; snapshotLabel: string }) {
  const [activeCategoryId, setActiveCategoryId] = useState<InstagramDataCategoryId | null>(null);
  const [activeDatasetId, setActiveDatasetId] = useState('');
  const [datasetSearch, setDatasetSearch] = useState('');
  const [recordSearch, setRecordSearch] = useState('');
  const [visibleRecords, setVisibleRecords] = useState(24);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const deferredDatasetSearch = useDeferredValue(datasetSearch.trim().toLowerCase());
  const deferredRecordSearch = useDeferredValue(recordSearch.trim().toLowerCase());

  useEffect(() => {
    const currentCategory = archive.categories.find((category) => category.id === activeCategoryId);
    if (!currentCategory) {
      const firstCategory = archive.categories.find((category) => category.id === 'interactions')
        || archive.categories.find((category) => category.id !== 'connections')
        || archive.categories[0];
      setActiveCategoryId(firstCategory?.id || null);
      setActiveDatasetId(firstCategory?.datasets[0]?.id || '');
      return;
    }
    if (!currentCategory.datasets.some((dataset) => dataset.id === activeDatasetId)) {
      setActiveDatasetId(currentCategory.datasets[0]?.id || '');
    }
  }, [archive, activeCategoryId, activeDatasetId]);

  const activeCategory = archive.categories.find((category) => category.id === activeCategoryId) || archive.categories[0];
  const datasets = activeCategory?.datasets || [];
  const activeDataset = datasets.find((dataset) => dataset.id === activeDatasetId) || datasets[0];
  const filteredDatasets = useMemo(
    () => datasets.filter((dataset) =>
      dataset.title.toLowerCase().includes(deferredDatasetSearch) ||
      (activeCategory?.id === 'messages' && dataset.records.some((record) => record.content.toLowerCase().includes(deferredDatasetSearch)))
    ),
    [datasets, activeCategory?.id, deferredDatasetSearch]
  );
  useEffect(() => {
    if (filteredDatasets.length > 0 && !filteredDatasets.some((dataset) => dataset.id === activeDatasetId)) {
      setActiveDatasetId(filteredDatasets[0].id);
    }
  }, [filteredDatasets, activeDatasetId]);
  const filteredRecords = useMemo(() => {
    if (!activeDataset) return [];
    if (!deferredRecordSearch) return activeDataset.records;
    return activeDataset.records.filter((record) =>
      `${record.title} ${record.content}`.toLowerCase().includes(deferredRecordSearch)
    );
  }, [activeDataset, deferredRecordSearch]);
  const totalRecords = archive.categories.reduce(
    (total, category) => total + category.datasets.reduce((subtotal, dataset) => subtotal + countRecords(dataset), 0),
    0
  );

  useEffect(() => {
    setVisibleRecords(24);
  }, [activeCategoryId, activeDatasetId, deferredRecordSearch]);

  const chooseCategory = (categoryId: InstagramDataCategoryId) => {
    const category = archive.categories.find((item) => item.id === categoryId);
    setActiveCategoryId(categoryId);
    setActiveDatasetId(category?.datasets[0]?.id || '');
    setDatasetSearch('');
    setRecordSearch('');
    setMobileThreadOpen(false);
  };

  const chooseDataset = (datasetId: string) => {
    setActiveDatasetId(datasetId);
    setRecordSearch('');
    if (activeCategory?.id === 'messages') setMobileThreadOpen(true);
  };

  const isMessages = activeCategory?.id === 'messages';
  const senderOrder = new Map<string, number>();
  activeDataset?.records.forEach((record) => {
    if (record.sender && !senderOrder.has(record.sender)) senderOrder.set(record.sender, senderOrder.size);
  });
  const renderMessage = (record: (typeof filteredRecords)[number], index: number) => {
    const senderIndex = record.sender ? senderOrder.get(record.sender) || 0 : index % 2;
    return (
      <article className={`export-chat-message${senderIndex % 2 ? ' is-outgoing' : ''}`} key={record.id}>
        <div className="export-chat-bubble">
          {record.sender && <span className="export-chat-sender">{record.sender}</span>}
          <p>{record.content}</p>
          {record.timestamp && <time>{record.timestamp}</time>}
        </div>
      </article>
    );
  };

  return (
    <section className="export-library" aria-labelledby="export-library-title">
      <div className="export-library-heading">
        <div>
          <span className="export-library-kicker"><FileArchive size={14} /> YOUR INSTAGRAM EXPORT</span>
          <h2 id="export-library-title">More than followers</h2>
          <p>Browse the other information from <strong>{snapshotLabel}</strong>. Everything here is saved only in this browser.</p>
        </div>
        <div className="export-library-metrics">
          <div className="export-library-total"><strong>{archive.totalFiles.toLocaleString()}</strong><span>files scanned</span></div>
          <div className="export-library-total"><strong>{totalRecords.toLocaleString()}</strong><span>records indexed</span></div>
        </div>
      </div>

      <div className="export-category-grid" aria-label="Export data categories">
        {archive.categories.map((category) => {
          const Icon = categoryIcons[category.id];
          const count = category.datasets.reduce((total, dataset) => total + countRecords(dataset), 0);
          const isActive = category.id === activeCategory?.id;
          return (
            <button
              key={category.id}
              type="button"
              className={`export-category-card${isActive ? ' is-active' : ''}`}
              onClick={() => chooseCategory(category.id)}
              aria-pressed={isActive}
            >
              <span className="export-category-icon"><Icon size={16} /></span>
              <span className="export-category-copy"><strong>{category.title}</strong><small>{category.datasets.length} {category.datasets.length === 1 ? 'file' : 'files'}</small></span>
              <span className="export-category-count">{count.toLocaleString()}</span>
            </button>
          );
        })}
      </div>

      {activeCategory && (
        <div className="export-browser">
          <div className="export-browser-heading">
            <div>
              <span className="export-browser-label">BROWSING CATEGORY</span>
              <h3>{activeCategory.title}</h3>
              <p>{activeCategory.description}</p>
            </div>
            <div className="export-category-summary"><strong>{activeCategory.datasets.length}</strong><span>datasets</span></div>
          </div>

          <label className="export-search">
            <Search size={15} />
            <input
              type="search"
              value={datasetSearch}
              onChange={(event) => setDatasetSearch(event.target.value)}
              placeholder={activeCategory.id === 'messages' ? 'Find a conversation…' : 'Find a dataset…'}
              aria-label={activeCategory.id === 'messages' ? 'Search conversations' : 'Search datasets'}
            />
          </label>

          <div className={`export-dataset-list${isMessages ? ' export-conversation-list' : ''}${mobileThreadOpen && isMessages ? ' is-mobile-hidden' : ''}`} aria-label={isMessages ? 'Conversations' : `${activeCategory.title} datasets`}>
            {filteredDatasets.map((dataset) => {
              const isSelected = dataset.id === activeDataset?.id;
              return (
                <button
                  key={dataset.id}
                  type="button"
                  className={`export-dataset-option${isSelected ? ' is-active' : ''}`}
                  onClick={() => chooseDataset(dataset.id)}
                  aria-pressed={isSelected}
                >
                  {isMessages && <span className="export-chat-avatar" aria-hidden="true">{dataset.title.replace(/^Chat · /, '').replace(/^Conversation\s+\d+$/i, 'IG').slice(0, 1).toUpperCase()}</span>}
                  <span><strong>{dataset.title}</strong><small>{isMessages ? `${countRecords(dataset).toLocaleString()} messages` : dataset.sourceType === 'media' ? 'Media files' : `${dataset.sourceType.toUpperCase()} export`}</small></span>
                  <b>{countRecords(dataset).toLocaleString()}</b>
                </button>
              );
            })}
            {filteredDatasets.length === 0 && <p className="export-empty-note">No datasets match that search.</p>}
          </div>

          {activeDataset && filteredDatasets.some((dataset) => dataset.id === activeDataset.id) && (
            <div className={`export-record-panel${isMessages ? ' export-chat-panel' : ''}${mobileThreadOpen && isMessages ? ' is-mobile-active' : ''}`}>
              <div className="export-record-heading">
                <div className="export-chat-title">
                  {isMessages && <button type="button" className="export-chat-back" onClick={() => setMobileThreadOpen(false)} aria-label="Back to conversations"><ArrowLeft size={17} /></button>}
                  <span className="export-chat-avatar" aria-hidden="true">{activeDataset.title.replace(/^Chat · /, '').replace(/^Conversation\s+\d+$/i, 'IG').slice(0, 1).toUpperCase()}</span>
                  <div><span className="export-browser-label">{isMessages ? 'CONVERSATION' : 'SELECTED DATASET'}</span><h4>{activeDataset.title}</h4></div>
                </div>
                <span>{filteredRecords.length.toLocaleString()} {deferredRecordSearch ? 'matches' : 'records'}</span>
              </div>
              <label className="export-search export-record-search">
                <Search size={15} />
                <input
                  type="search"
                  value={recordSearch}
                  onChange={(event) => setRecordSearch(event.target.value)}
                  placeholder="Search inside this dataset…"
                  aria-label="Search records in selected dataset"
                />
              </label>

              <div className={`export-record-list${isMessages ? ' export-chat-transcript' : ''}`} aria-label={isMessages ? 'Messages in conversation' : 'Records in dataset'}>
                {isMessages
                  ? filteredRecords.slice(0, visibleRecords).map(renderMessage)
                  : filteredRecords.slice(0, visibleRecords).map((record, index) => (
                    <details className="export-record" key={record.id}>
                      <summary>
                        <span className="export-record-index">{String(index + 1).padStart(2, '0')}</span>
                        <span className="export-record-title">{record.title}</span>
                        {record.timestamp && <time>{record.timestamp}</time>}
                      </summary>
                      <p>{record.content}</p>
                    </details>
                  ))}
                {filteredRecords.length === 0 && <p className="export-empty-note">No records match that search.</p>}
              </div>
              {visibleRecords < filteredRecords.length && (
                <button className="export-load-more" type="button" onClick={() => setVisibleRecords((count) => count + 24)}>
                  Show 24 more <span>({(filteredRecords.length - visibleRecords).toLocaleString()} remaining)</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="export-library-privacy"><ShieldCheck size={15} /><span>Private export data is processed locally. Open a conversation to read its messages.</span></div>
    </section>
  );
}
