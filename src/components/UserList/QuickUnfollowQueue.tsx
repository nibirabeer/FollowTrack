import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Shield,
  ShieldCheck,
  X,
} from 'lucide-react';
import { InstagramUser } from '../../types';
import { useSnapshots } from '../../contexts/SnapshotContext';

interface QuickUnfollowQueueProps {
  users: InstagramUser[];
  onClose: () => void;
}

export function QuickUnfollowQueue({ users, onClose }: QuickUnfollowQueueProps) {
  const { whitelistedUsers, unfollowedInSession, toggleWhitelist, toggleUnfollowed } = useSnapshots();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [queueUsers] = useState(() => {
    const kept = new Set(whitelistedUsers.map((username) => username.toLowerCase()));
    return users.filter((user) => !kept.has(user.username.toLowerCase()));
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [markedCount, setMarkedCount] = useState(0);
  const [keptCount, setKeptCount] = useState(0);

  const currentUser = queueUsers[currentIndex] || null;
  const isMarkedDone = currentUser
    ? unfollowedInSession.some((username) => username.toLowerCase() === currentUser.username.toLowerCase())
    : false;
  const isWhitelisted = currentUser
    ? whitelistedUsers.some((username) => username.toLowerCase() === currentUser.username.toLowerCase())
    : false;
  const isComplete = !currentUser;
  const progress = isComplete ? 100 : Math.round(((currentIndex + 1) / queueUsers.length) * 100);

  const handleNext = () => setCurrentIndex((index) => Math.min(index + 1, queueUsers.length));
  const handlePrev = () => setCurrentIndex((index) => Math.max(index - 1, 0));

  const handleMarkUnfollowed = () => {
    if (!currentUser) return;
    if (!isMarkedDone) {
      toggleUnfollowed(currentUser.username);
      setMarkedCount((count) => count + 1);
    }
    handleNext();
  };

  const handleKeep = () => {
    if (!currentUser) return;
    if (!isWhitelisted) {
      toggleWhitelist(currentUser.username);
      setKeptCount((count) => count + 1);
    }
    handleNext();
  };

  const handleOpenProfile = () => {
    if (!currentUser) return;
    window.open(currentUser.profileUrl, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      const target = event.target as HTMLElement;
      const isEditing = target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      if (!isEditing && event.key === 'ArrowRight') {
        event.preventDefault();
        handleNext();
      } else if (!isEditing && event.key === 'ArrowLeft') {
        event.preventDefault();
        handlePrev();
      }

      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, onClose, queueUsers.length]);

  return (
    <div
      className="queue-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className="queue-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="queue-title"
        aria-describedby="queue-description"
        tabIndex={-1}
      >
        <header className="queue-header">
          <div className="queue-brand-icon"><ShieldCheck size={19} strokeWidth={1.8} /></div>
          <div className="queue-heading">
            <span className="queue-eyebrow">MANUAL REVIEW</span>
            <h2 id="queue-title">Safe Unfollow Assistant</h2>
            <p id="queue-description">Review each account yourself. FollowTrack never unfollows anyone for you.</p>
          </div>
          <button className="queue-close" onClick={onClose} aria-label="Close review queue" title="Close queue">
            <X size={18} />
          </button>
        </header>

        <div className="queue-progress" aria-live="polite">
          <div className="queue-progress-copy">
            <span>{isComplete ? 'Review complete' : `Account ${currentIndex + 1} of ${queueUsers.length}`}</span>
              <span className="queue-progress-count"><Check size={13} /> {unfollowedInSession.length} marked done</span>
          </div>
          <div className="queue-progress-track" role="progressbar" aria-label="Review progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>

        {isComplete ? (
          <div className="queue-complete">
            <div className="queue-complete-mark"><CheckCircle2 size={25} /></div>
            <p className="queue-eyebrow">YOUR LIST IS REVIEWED</p>
            <h3>{queueUsers.length === 0 ? 'No accounts to review' : 'You’re at the end of the list'}</h3>
            <p className="queue-complete-copy">
              {queueUsers.length === 0
                ? 'Every account in this list is already on your keep list.'
                : 'You can close this queue or go back to revisit an account.'}
            </p>
            <div className="queue-result-summary">
              <span><strong>{markedCount}</strong> marked this review</span>
              <span><strong>{keptCount}</strong> added to keep list</span>
            </div>
            <button className="queue-primary queue-done-button" onClick={onClose}>
              Back to account list <ArrowRight size={16} />
            </button>
            {queueUsers.length > 0 && (
              <button className="queue-text-button" onClick={handlePrev}>Review the previous account</button>
            )}
          </div>
        ) : (
          <>
            <main className="queue-account">
              <div className="queue-account-topline">
                <span className="queue-index">{String(currentIndex + 1).padStart(2, '0')}</span>
                <span className="queue-reason">DOESN’T FOLLOW YOU BACK</span>
                {isMarkedDone && <span className="queue-state-tag"><Check size={12} /> MARKED DONE</span>}
                {isWhitelisted && <span className="queue-state-tag"><Shield size={12} /> ON KEEP LIST</span>}
              </div>

              <div className="queue-account-identity">
                <div className="queue-avatar" aria-hidden="true">{currentUser.username.charAt(0).toUpperCase()}</div>
                <h3>@{currentUser.username}</h3>
                <p>Check the profile before deciding what to do.</p>
              </div>

              <button className="queue-primary queue-open-button" onClick={handleOpenProfile}>
                Open Instagram profile <ArrowUpRight size={17} />
              </button>

              <p className="queue-manual-note">
                <ShieldCheck size={15} />
                <span>Instagram opens in a new tab. Return here to mark your choice.</span>
              </p>

              <div className="queue-divider"><span>YOUR NEXT STEP</span></div>
              <div className="queue-decisions">
                <button className="queue-keep-button" onClick={handleKeep}>
                  <Shield size={16} /> Keep account
                </button>
                <button className="queue-mark-button" onClick={handleMarkUnfollowed}>
                  <CheckCircle2 size={16} />
                  {isMarkedDone ? 'Already done · Next' : 'I unfollowed · Next'}
                </button>
              </div>
              <button className="queue-skip-button" onClick={handleNext}>Skip this account</button>
            </main>

            <footer className="queue-footer">
              <button className="queue-nav-button" onClick={handlePrev} disabled={currentIndex === 0}>
                <ChevronLeft size={16} /> Previous
              </button>
              <span className="queue-shortcuts"><kbd>←</kbd> Previous <kbd>→</kbd> Skip <kbd>Esc</kbd> Close</span>
              <button className="queue-nav-button" onClick={handleNext}>
                Skip <ChevronRight size={16} />
              </button>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}
