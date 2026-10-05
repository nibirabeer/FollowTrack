import React, { useState } from 'react';
import {
  Upload,
  FileArchive,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Info,
  LoaderCircle,
} from 'lucide-react';
import { useSnapshots } from '../../contexts/SnapshotContext';
import { parseFollowers, parseFollowing, parseInstagramZip } from '../../lib/parser';
import { InstagramUser, Snapshot } from '../../types';
import { InstagramExportArchive } from '../../types/exportArchive';
import { saveExportArchive } from '../../lib/exportArchiveStorage';

export function SnapshotImport({ onClose }: { onClose?: () => void }) {
  const { addNewSnapshot, setError } = useSnapshots();

  const [label, setLabel] = useState('');
  const [activeTab, setActiveTab] = useState<'zip' | 'files' | 'paste'>('zip');
  
  // ZIP state
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Files state
  const [followersFile, setFollowersFile] = useState<File[]>([]);
  const [followingFile, setFollowingFile] = useState<File | null>(null);
  const [followersRaw, setFollowersRaw] = useState<string[]>([]);
  const [followingRaw, setFollowingRaw] = useState('');

  // Paste state
  const [pasteFollowers, setPasteFollowers] = useState('');
  const [pasteFollowing, setPasteFollowing] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReadingFiles, setIsReadingFiles] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const saveSnapshot = async (followers: InstagramUser[], following: InstagramUser[], archive?: InstagramExportArchive) => {
    const importedAt = new Date();
    const newSnapshot: Snapshot = {
      id: `snap-${Date.now()}`,
      date: importedAt.toISOString(),
      label: label.trim() || `Instagram export (${importedAt.toLocaleDateString()})`,
      followers,
      following,
      followerCount: followers.length,
      followingCount: following.length,
    };

    if (archive) {
      setStatusMessage('Saving your categorized export on this device…');
      try {
        await saveExportArchive(newSnapshot.id, archive);
        newSnapshot.hasExtendedData = true;
      } catch {
        addNewSnapshot(newSnapshot);
        setError('Follower analysis was saved, but the full export library could not be stored locally. Check your browser storage space and try importing again.');
        onClose?.();
        return;
      }
    }

    addNewSnapshot(newSnapshot);
    onClose?.();
  };

  const analyzeZip = async (file: File) => {
    if (isSubmitting) return;
    setError(null);
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setError('Choose the ZIP archive downloaded from your Instagram data export.');
      return;
    }

    setZipFile(file);
    setIsSubmitting(true);
    setStatusMessage('Opening your Instagram export…');
    try {
      const parsed = await parseInstagramZip(file, (completed, total) => {
        setStatusMessage(`Scanning your export files · ${completed.toLocaleString()} of ${total.toLocaleString()}…`);
      });
      setStatusMessage('Matching connections and organizing the rest of your export…');
      if (parsed.followers.length === 0 || parsed.following.length === 0) {
        throw new Error('This ZIP is missing a followers or following list. Download both lists in your Instagram export and try again.');
      }

      const recordCount = parsed.archive.categories.reduce(
        (total, category) => total + category.datasets.reduce((subtotal, dataset) => subtotal + dataset.records.length, 0),
        0
      );
      setStatusMessage(`Organized ${recordCount.toLocaleString()} records across ${parsed.archive.categories.length} categories. Saving on this device…`);
      await saveSnapshot(parsed.followers, parsed.following, parsed.archive);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to analyze this Instagram ZIP.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
      setStatusMessage('');
    }
  };

  const handleZipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) void analyzeZip(file);
  };

  const handleZipDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) void analyzeZip(file);
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'followers' | 'following'
  ) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (type === 'followers') {
      setFollowersFile(files);
      setIsReadingFiles(true);
      Promise.all(files.map((file) => file.text()))
        .then(setFollowersRaw)
        .catch(() => setError('Could not read one of the selected followers files.'))
        .finally(() => setIsReadingFiles(false));
    } else {
      const file = files[0];
      setFollowingFile(file);
      setIsReadingFiles(true);
      file.text()
        .then(setFollowingRaw)
        .catch(() => setError('Could not read the selected following file.'))
        .finally(() => setIsReadingFiles(false));
    }
    e.target.value = '';
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (activeTab === 'zip') {
      if (!zipFile) {
        setError('Choose your Instagram export ZIP to start automatic analysis.');
        return;
      }
      await analyzeZip(zipFile);
      return;
    }

    setIsSubmitting(true);
    setStatusMessage('Processing data...');

    try {
      let followers = [];
      let following = [];

      if (activeTab === 'files') {
        if (followersRaw.length === 0 || !followingRaw) {
          throw new Error('Please upload both followers and following JSON/HTML files.');
        }
        followers = Array.from(
          new Map(
            followersRaw
              .flatMap((raw) => parseFollowers(raw))
              .map((user) => [user.username.toLowerCase(), user] as const)
          ).values()
        );
        following = parseFollowing(followingRaw);
      } else {
        if (!pasteFollowers.trim() || !pasteFollowing.trim()) {
          throw new Error('Please paste both followers and following lists.');
        }
        followers = parseFollowers(pasteFollowers);
        following = parseFollowing(pasteFollowing);
      }

      if (followers.length === 0 || following.length === 0) {
        throw new Error('Both a followers list and a following list are required. Check your files and try again.');
      }

      await saveSnapshot(followers, following);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to import snapshot.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="glass-surface bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700/60 shadow-xl max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>Import Real Instagram Data</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              Safe & Private
            </span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Compare your real followers and find out who isn't following you back.
          </p>
        </div>
      </div>

      {/* Security Banner */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs mb-4 border border-emerald-100 dark:border-emerald-900/40">
        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
        <p>
          <strong>Private by design:</strong> No login, scraping, or password. Selected export data is processed in your browser and is not sent to our service.
        </p>
      </div>

      {/* Tabs */}
      <div className="import-tabs flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl mb-5 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('zip')}
          className={`flex items-center justify-center gap-1.5 flex-1 min-w-[120px] py-2 text-xs font-semibold rounded-lg transition ${
            activeTab === 'zip'
              ? 'bg-white dark:bg-gray-800 text-violet-600 dark:text-violet-400 shadow-xs'
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <FileArchive className="w-3.5 h-3.5" />
          <span>ZIP · Auto-analyze</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('files')}
          className={`flex items-center justify-center gap-1.5 flex-1 min-w-[120px] py-2 text-xs font-semibold rounded-lg transition ${
            activeTab === 'files'
              ? 'bg-white dark:bg-gray-800 text-violet-600 dark:text-violet-400 shadow-xs'
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>JSON / HTML Files</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('paste')}
          className={`flex items-center justify-center gap-1.5 flex-1 min-w-[120px] py-2 text-xs font-semibold rounded-lg transition ${
            activeTab === 'paste'
              ? 'bg-white dark:bg-gray-800 text-violet-600 dark:text-violet-400 shadow-xs'
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Paste Text / JSON</span>
        </button>

      </div>

      <form onSubmit={handleImport} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Snapshot Name
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. My Real Account (Oct 2026)"
              className="w-full text-xs sm:text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {activeTab === 'zip' && (
            <div className="space-y-3">
              <div
                className={`file-drop-zone ${zipFile ? 'has-file' : ''} ${isDragOver ? 'is-drag-over' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setIsDragOver(false);
                }}
                onDrop={handleZipDrop}
                aria-busy={isSubmitting}
              >
                <input
                  type="file"
                  accept=".zip,application/zip"
                  onChange={handleZipUpload}
                  disabled={isSubmitting}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="file-drop-content">
                  {isSubmitting ? (
                    <LoaderCircle className="file-drop-icon upload-spinner" />
                  ) : zipFile ? (
                    <CheckCircle2 className="file-drop-icon file-ready-icon" />
                  ) : (
                    <FileArchive className="file-drop-icon upload-icon" />
                  )}
                  <span className={`file-drop-title ${zipFile ? 'upload-file-enter' : ''}`}>
                    {isSubmitting ? 'Analyzing your Instagram export' : zipFile ? zipFile.name : 'Drop your Instagram export ZIP here'}
                  </span>
                  <span className="file-drop-caption">
                    {isSubmitting ? statusMessage : zipFile ? `${(zipFile.size / 1024 / 1024).toFixed(1)} MB · Select another ZIP to analyze again` : 'Drop a ZIP here or tap to browse · We’ll find both lists and calculate your results'}
                  </span>
                  {!isSubmitting && <span className="file-drop-browse">{zipFile ? 'Choose a different ZIP' : 'Browse files'}</span>}
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <Info className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                <span>
                  Works directly with your Instagram ZIP. Text records are stored on this device; photos and videos are indexed by filename, not copied into the library.
                </span>
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Followers Upload */}
                <div className={`file-choice-card ${followersFile.length ? 'has-file' : ''}`}>
                  <input
                    type="file"
                    accept=".json,.html"
                    multiple
                    onChange={(e) => handleFileUpload(e, 'followers')}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center">
                    {followersFile.length ? (
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                    ) : (
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    )}
                    <span className={`file-choice-name ${followersFile.length ? 'upload-file-enter' : ''}`}>
                      {followersFile.length ? followersFile.map((file) => file.name).join(', ') : 'Choose followers file(s)'}
                    </span>
                    <span className="file-choice-caption">
                      {followersFile.length ? `${followersFile.length} file${followersFile.length === 1 ? '' : 's'} selected` : 'followers_1.json · select all parts if split'}
                    </span>
                  </div>
                </div>

                {/* Following Upload */}
                <div className={`file-choice-card ${followingFile ? 'has-file' : ''}`}>
                  <input
                    type="file"
                    accept=".json,.html"
                    onChange={(e) => handleFileUpload(e, 'following')}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center">
                    {followingFile ? (
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                    ) : (
                      <FileText className="w-8 h-8 text-gray-400 mb-2" />
                    )}
                    <span className={`file-choice-name ${followingFile ? 'upload-file-enter' : ''}`}>
                      {followingFile ? followingFile.name : 'Choose following file'}
                    </span>
                    <span className="file-choice-caption">
                      {followingFile ? 'Following list selected' : 'following.json · or following.html'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Followers (JSON or 1 username per line)
                </label>
                <textarea
                  rows={5}
                  value={pasteFollowers}
                  onChange={(e) => setPasteFollowers(e.target.value)}
                  placeholder="Paste JSON or usernames:&#10;user_one&#10;user_two&#10;user_three"
                  className="w-full text-xs font-mono bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Following (JSON or 1 username per line)
                </label>
                <textarea
                  rows={5}
                  value={pasteFollowing}
                  onChange={(e) => setPasteFollowing(e.target.value)}
                  placeholder="Paste JSON or usernames:&#10;user_one&#10;user_two&#10;user_four"
                  className="w-full text-xs font-mono bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
          )}

          <div className="import-submit-row">
            <span className={`upload-status ${isSubmitting || isReadingFiles ? 'is-processing' : ''}`} aria-live="polite">
              {(isSubmitting || isReadingFiles) && <LoaderCircle size={15} className="upload-spinner" />}
              {isReadingFiles ? 'Reading your selected files…' : isSubmitting ? statusMessage || 'Preparing your lists…' : 'Export data remains in this browser.'}
            </span>

            <div className="import-submit-actions flex items-center gap-2">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750 rounded-xl transition"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting || isReadingFiles}
                className="import-submit-button px-6 py-2.5 bg-violet-600 hover:bg-violet-700 active:scale-95 text-white font-medium text-xs sm:text-sm rounded-xl transition shadow-md shadow-violet-500/20 disabled:opacity-50"
              >
                {isReadingFiles ? 'Reading files…' : isSubmitting ? activeTab === 'zip' ? 'Analyzing export…' : 'Analyzing lists…' : activeTab === 'zip' ? zipFile ? 'Try ZIP again' : 'Choose a ZIP to analyze' : 'Analyze my lists'}
              </button>
            </div>
          </div>
      </form>
    </div>
  );
}
