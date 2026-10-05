import { useState } from 'react';
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  AtSign,
  Check,
  CircleHelp,
  CloudUpload,
  FileArchive,
  FolderDown,
  MousePointer2,
  Settings2,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';

const steps = [
  {
    eyebrow: 'STEP 01 · REQUEST YOUR EXPORT',
    title: 'Open Accounts Center',
    description: 'In Instagram, open your profile menu and go to Settings and activity → Accounts Center. Choose “Your information and permissions,” then “Export your information.”',
    icon: Settings2,
    scene: 'settings',
  },
  {
    eyebrow: 'STEP 02 · PICK THE RIGHT DATA',
    title: 'Select followers and following',
    description: 'Choose your Instagram profile and “Some of your information.” Select “Followers and following,” set the date range to All time, and choose JSON if offered. FollowTrack can also read Instagram’s HTML ZIP export.',
    icon: UsersRound,
    scene: 'data',
  },
  {
    eyebrow: 'STEP 03 · DOWNLOAD THE ZIP',
    title: 'Wait for Instagram to prepare it',
    description: 'Create the export. When Instagram says it is ready, download the ZIP file to your device. Keep it zipped—there is no need to open or extract it.',
    icon: FolderDown,
    scene: 'download',
  },
  {
    eyebrow: 'STEP 04 · ANALYZE IN FOLLOWTRACK',
    title: 'Drop the ZIP here',
    description: 'Choose “Upload your export” below, then select the ZIP you downloaded. FollowTrack reads the follower and following lists and shows your analysis automatically.',
    icon: CloudUpload,
    scene: 'upload',
  },
] as const;

function Scene({ scene }: { scene: (typeof steps)[number]['scene'] }) {
  if (scene === 'settings') {
    return (
      <div className="walk-screen walk-settings" aria-hidden="true">
        <div className="walk-screen-top"><span className="walk-app-mark"><AtSign size={15} /></span><span>Accounts Center</span><span className="walk-avatar">Y</span></div>
        <div className="walk-screen-caption">Account settings</div>
        <div className="walk-menu-row"><span className="walk-mini-icon"><ShieldCheck size={14} /></span><span><b>Password and security</b><small>Protect your account</small></span></div>
        <div className="walk-menu-row walk-highlight"><span className="walk-mini-icon"><FolderDown size={14} /></span><span><b>Your information and permissions</b><small>Access and manage your information</small></span><ArrowRight size={14} /></div>
        <span className="walk-pointer"><MousePointer2 size={23} fill="currentColor" /></span>
      </div>
    );
  }
  if (scene === 'data') {
    return (
      <div className="walk-screen walk-data" aria-hidden="true">
        <div className="walk-screen-top"><span className="walk-mini-icon"><UsersRound size={14} /></span><span>Choose information</span><span className="walk-step-chip">2 of 3</span></div>
        <div className="walk-choice"><span className="walk-radio" /><span><b>All available information</b><small>A larger export with everything</small></span></div>
        <div className="walk-choice walk-choice-selected"><span className="walk-radio"><Check size={11} /></span><span><b>Some of your information</b><small>Choose only what you need</small></span></div>
        <div className="walk-selected-data"><Check size={13} /><span>Followers and following</span><span className="walk-selected-count">selected</span></div>
        <div className="walk-format"><span>Format</span><b>JSON <span>⌄</span></b></div>
      </div>
    );
  }
  if (scene === 'download') {
    return (
      <div className="walk-screen walk-download" aria-hidden="true">
        <div className="walk-ready-icon"><FileArchive size={27} /></div>
        <span className="walk-ready-label">YOUR DOWNLOAD IS READY</span>
        <strong>instagram-data.zip</strong>
        <span className="walk-file-detail">ZIP archive <i /> Ready to download</span>
        <div className="walk-download-button"><ArrowDownToLine size={15} /> Download</div>
        <span className="walk-download-spark">✦</span>
      </div>
    );
  }
  return (
    <div className="walk-screen walk-upload" aria-hidden="true">
      <div className="walk-upload-orbit"><CloudUpload size={26} /></div>
      <strong>Drop your Instagram ZIP here</strong>
      <span>or choose a file from your device</span>
      <div className="walk-zip-file"><FileArchive size={18} /><span><b>instagram-data.zip</b><small>ZIP archive · ready to analyze</small></span><Check size={16} /></div>
      <div className="walk-analysis-pills"><span><UsersRound size={12} /> Followers</span><span><UsersRound size={12} /> Following</span></div>
    </div>
  );
}

export function ExportWalkthrough({ onUpload }: { onUpload: () => void }) {
  const [activeStep, setActiveStep] = useState(0);
  const step = steps[activeStep];
  const StepIcon = step.icon;

  return (
    <section className="export-guide glass-surface" aria-labelledby="export-guide-title">
      <div className="export-guide-heading">
        <div>
          <span className="guide-kicker"><ShieldCheck size={14} /> PRIVATE BY DESIGN</span>
          <h2 id="export-guide-title">Get your Instagram export</h2>
          <p>Your follower and following lists come from your own Instagram export. FollowTrack analyzes the ZIP in your browser.</p>
        </div>
        <button className="guide-cta" onClick={onUpload}>
          <span>Upload your export</span><ArrowRight size={16} />
        </button>
      </div>

      <div className="walkthrough" aria-label="Instagram export walkthrough">
        <div className="walk-progress" aria-label={`Step ${activeStep + 1} of ${steps.length}`}>
          {steps.map((item, index) => (
            <button
              key={item.eyebrow}
              className={`walk-progress-step${index === activeStep ? ' is-active' : ''}${index < activeStep ? ' is-done' : ''}`}
              onClick={() => setActiveStep(index)}
              aria-label={`Go to step ${index + 1}: ${item.title}`}
              aria-current={index === activeStep ? 'step' : undefined}
            >
              <span>{index < activeStep ? <Check size={12} /> : `0${index + 1}`}</span>
              <i />
            </button>
          ))}
        </div>

        <div className="walk-content" key={activeStep}>
          <div className="walk-copy">
            <span className="walk-eyebrow"><StepIcon size={13} /> {step.eyebrow}</span>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
            <div className="walk-controls">
              <button className="walk-back" onClick={() => setActiveStep((current) => Math.max(0, current - 1))} disabled={activeStep === 0}>
                <ArrowLeft size={15} /> Back
              </button>
              <span className="walk-step-count">{activeStep + 1} <i>/</i> {steps.length}</span>
              {activeStep < steps.length - 1 ? (
                <button className="walk-next" onClick={() => setActiveStep((current) => Math.min(steps.length - 1, current + 1))}>
                  Next step <ArrowRight size={15} />
                </button>
              ) : (
                <button className="walk-next" onClick={onUpload}>
                  Upload ZIP <ArrowRight size={15} />
                </button>
              )}
            </div>
          </div>
          <div className="walk-scene-wrap">
            <div className="walk-scene-label"><span /> PREVIEW</div>
            <Scene scene={step.scene} />
          </div>
        </div>
      </div>

      <div className="export-guide-footnote">
        <CircleHelp size={15} />
        <span>Instagram’s menus can vary by device. If you already have the ZIP, skip straight to <button type="button" className="walk-inline-link" onClick={onUpload}>Upload your export</button>. FollowTrack supports JSON exports and never needs your Instagram password.</span>
      </div>
    </section>
  );
}
