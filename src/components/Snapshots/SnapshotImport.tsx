import React, { useState } from 'react';
import {
  Upload,
  FileArchive,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Code,
  Info,
  HelpCircle,
} from 'lucide-react';
import { useSnapshots } from '../../contexts/SnapshotContext';
import { parseFollowers, parseFollowing, parseInstagramZip } from '../../lib/parser';
import { Snapshot } from '../../types';

export function SnapshotImport({ onClose }: { onClose?: () => void }) {
  const { addNewSnapshot, setError } = useSnapshots();

  const [label, setLabel] = useState('');
  const [activeTab, setActiveTab] = useState<'zip' | 'files' | 'paste' | 'trick'>('zip');
  
  // ZIP state
  const [zipFile, setZipFile] = useState<File | null>(null);

  // Files state
  const [followersFile, setFollowersFile] = useState<File | null>(null);
  const [followingFile, setFollowingFile] = useState<File | null>(null);
  const [followersRaw, setFollowersRaw] = useState('');
  const [followingRaw, setFollowingRaw] = useState('');

  // Paste state
  const [pasteFollowers, setPasteFollowers] = useState('');
  const [pasteFollowing, setPasteFollowing] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleZipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setZipFile(file);
    }
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'followers' | 'following'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'followers') {
      setFollowersFile(file);
      const reader = new FileReader();
      reader.onload = (event) => setFollowersRaw((event.target?.result as string) || '');
      reader.readAsText(file);
    } else {
      setFollowingFile(file);
      const reader = new FileReader();
      reader.onload = (event) => setFollowingRaw((event.target?.result as string) || '');
      reader.readAsText(file);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage('Processing data...');

    try {
      let followers = [];
      let following = [];

      if (activeTab === 'zip') {
        if (!zipFile) {
          throw new Error('Please select an Instagram export ZIP file.');
        }
        setStatusMessage('Extracting files from ZIP archive...');
        const parsed = await parseInstagramZip(zipFile);
        followers = parsed.followers;
        following = parsed.following;
      } else if (activeTab === 'files') {
        if (!followersRaw || !followingRaw) {
          throw new Error('Please upload both followers and following JSON/HTML files.');
        }
        followers = parseFollowers(followersRaw);
        following = parseFollowing(followingRaw);
      } else {
        if (!pasteFollowers.trim() || !pasteFollowing.trim()) {
          throw new Error('Please paste both followers and following lists.');
        }
        followers = parseFollowers(pasteFollowers);
        following = parseFollowing(pasteFollowing);
      }

      if (followers.length === 0 && following.length === 0) {
        throw new Error('No user data could be found in the provided inputs.');
      }

      const newSnapshot: Snapshot = {
        id: `snap-${Date.now()}`,
        date: new Date().toISOString(),
        label: label.trim() || `Real ID Import (${new Date().toLocaleDateString()})`,
        followers,
        following,
        followerCount: followers.length,
        followingCount: following.length,
      };

      addNewSnapshot(newSnapshot);
      if (onClose) onClose();
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
          <strong>100% Account Safe:</strong> Never requires logging in, scraping, or your password. Your data is analyzed entirely in your browser.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl mb-5 overflow-x-auto">
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
          <span>Upload ZIP (Easiest)</span>
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

        <button
          type="button"
          onClick={() => setActiveTab('trick')}
          className={`flex items-center justify-center gap-1.5 flex-1 min-w-[130px] py-2 text-xs font-semibold rounded-lg transition ${
            activeTab === 'trick'
              ? 'bg-white dark:bg-gray-800 text-violet-600 dark:text-violet-400 shadow-xs'
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>Instant Browser Trick</span>
        </button>
      </div>

      {activeTab === 'trick' ? (
        <div className="space-y-4 text-xs text-gray-600 dark:text-gray-300">
          <div className="p-4 rounded-2xl bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900/30">
            <h3 className="font-bold text-violet-900 dark:text-violet-200 text-sm mb-2 flex items-center gap-2">
              <Code className="w-4 h-4 text-violet-600" />
              <span>Instant Trick: Grab Usernames without waiting for Meta Export</span>
            </h3>
            <p className="mb-2 text-gray-700 dark:text-gray-300">
              Instagram's official data export can sometimes take hours. If you want instant analysis right now:
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-gray-700 dark:text-gray-300">
              <li>
                Open <strong>instagram.com</strong> in Chrome/Safari on your computer and log in.
              </li>
              <li>
                Go to your profile and click on <strong>Following</strong> (the popup modal will appear).
              </li>
              <li>
                Press <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-mono">F12</kbd> (or Right Click &rarr; Inspect &rarr; <strong>Console</strong>).
              </li>
              <li>
                Paste this 1-line script into the console to copy all following usernames to your clipboard:
                <pre className="mt-1 p-2.5 rounded-xl bg-gray-900 text-gray-100 font-mono text-[11px] overflow-x-auto select-all cursor-pointer">
{`copy(Array.from(document.querySelectorAll('a[role="link"] span')).map(e=>e.innerText.trim()).filter(u=>u && !u.includes(' ') && !u.includes('\\n')).join('\\n'))`}
                </pre>
              </li>
              <li>
                Paste into the <strong>"Paste Text / JSON"</strong> tab here. Repeat the same for <strong>Followers</strong>.
              </li>
            </ol>
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition"
            >
              Go to Paste Tab &rarr;
            </button>
          </div>
        </div>
      ) : (
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
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-violet-500 dark:hover:border-violet-500 rounded-2xl p-6 text-center transition cursor-pointer relative bg-gray-50/50 dark:bg-gray-900/30">
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleZipUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center">
                  {zipFile ? (
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                  ) : (
                    <FileArchive className="w-10 h-10 text-violet-500 mb-2" />
                  )}
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {zipFile ? zipFile.name : 'Drop your Instagram .zip file here'}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    {zipFile ? `${(zipFile.size / 1024 / 1024).toFixed(1)} MB selected` : 'We automatically extract followers and following files from the zip'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <Info className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                <span>
                  Works directly with the ZIP file you downloaded from Instagram Settings &rarr; Accounts Center &rarr; Download your information.
                </span>
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Followers Upload */}
                <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-5 text-center hover:border-violet-500 transition cursor-pointer relative bg-gray-50/50 dark:bg-gray-900/30">
                  <input
                    type="file"
                    accept=".json,.html"
                    onChange={(e) => handleFileUpload(e, 'followers')}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center">
                    {followersFile ? (
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                    ) : (
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    )}
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-200 truncate max-w-full">
                      {followersFile ? followersFile.name : 'followers_1.json or .html'}
                    </span>
                    <span className="text-[11px] text-gray-500 mt-1">
                      Located in connections/followers_and_following/
                    </span>
                  </div>
                </div>

                {/* Following Upload */}
                <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-5 text-center hover:border-violet-500 transition cursor-pointer relative bg-gray-50/50 dark:bg-gray-900/30">
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
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-200 truncate max-w-full">
                      {followingFile ? followingFile.name : 'following.json or .html'}
                    </span>
                    <span className="text-[11px] text-gray-500 mt-1">
                      Located in connections/followers_and_following/
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

          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/50">
            <span className="text-xs text-violet-600 dark:text-violet-400 font-medium">
              {statusMessage}
            </span>

            <div className="flex items-center gap-2">
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
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 active:scale-95 text-white font-medium text-xs sm:text-sm rounded-xl transition shadow-md shadow-violet-500/20 disabled:opacity-50"
              >
                {isSubmitting ? 'Analyzing...' : 'Analyze My Account'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
