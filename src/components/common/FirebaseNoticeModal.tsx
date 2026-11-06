import React, { useState, useEffect } from 'react';
import { isFirebaseConfigured, saveManualFirebaseConfig, clearManualFirebaseConfig } from '../../firebase';
import { Key, X, Check, AlertCircle } from 'lucide-react';

export function FirebaseNoticeBanner({ onOpenModal }: { onOpenModal: () => void }) {
  const [dismissed, setDismissed] = useState(false);

  if (isFirebaseConfigured || dismissed) return null;

  return (
    <div className="bg-[#0B2B26] text-[#DAF1DE] text-[11px] px-3 py-1.5 flex items-center justify-between border-b border-[#235347] z-50">
      <div className="flex items-center gap-2 truncate">
        <span className="w-2 h-2 rounded-full bg-[#8EB69B] shrink-0" />
        <span className="truncate">Demo Mode (Cloud sync offline)</span>
        <button
          onClick={onOpenModal}
          className="underline text-[#8EB69B] hover:text-[#DAF1DE] cursor-pointer whitespace-nowrap min-h-[32px] flex items-center"
        >
          Setup
        </button>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="w-8 h-8 rounded-full flex items-center justify-center text-[#DAF1DE]/60 hover:text-[#DAF1DE] cursor-pointer shrink-0 ml-2"
        aria-label="Dismiss banner"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

interface Props {
  isOpen?: boolean;
  onClose?: () => void;
}

export function FirebaseNoticeModal({ isOpen, onClose }: Props) {
  const [apiKey, setApiKey] = useState('');
  const [authDomain, setAuthDomain] = useState('');
  const [projectId, setProjectId] = useState('');
  const [storageBucket, setStorageBucket] = useState('');
  const [messagingSenderId, setMessagingSenderId] = useState('');
  const [appId, setAppId] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [parseError, setParseError] = useState('');

  // Lock body scroll behind modal
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleParseJson = () => {
    setParseError('');
    try {
      const sanitized = jsonInput
        .replace(/const\s+firebaseConfig\s*=\s*/, '')
        .replace(/;/g, '')
        .trim();
      const parsed = JSON.parse(sanitized);
      if (parsed.apiKey) setApiKey(parsed.apiKey);
      if (parsed.authDomain) setAuthDomain(parsed.authDomain);
      if (parsed.projectId) setProjectId(parsed.projectId);
      if (parsed.storageBucket) setStorageBucket(parsed.storageBucket);
      if (parsed.messagingSenderId) setMessagingSenderId(parsed.messagingSenderId);
      if (parsed.appId) setAppId(parsed.appId);
    } catch {
      setParseError('Could not parse JSON. Please enter fields manually below.');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !projectId || !appId) {
      alert('Please fill in at least API Key, Project ID, and App ID.');
      return;
    }

    saveManualFirebaseConfig({
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim() || `${projectId.trim()}.firebasestorage.app`,
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#051F20]/85 backdrop-blur-md">
      <div className="bg-[#0B2B26] text-[#DAF1DE] w-full max-w-md rounded-t-[28px] sm:rounded-[28px] shadow-2xl border border-[#235347] overflow-hidden flex flex-col max-h-[calc(100dvh-24px)] animate-in slide-in-from-bottom duration-200">
        {/* Sticky Header */}
        <div className="shrink-0 px-4 py-3 border-b border-[#235347] flex items-center justify-between bg-[#0B2B26]">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-[#8EB69B]" />
            <h2 className="font-heading text-base font-bold text-[#DAF1DE]">Firebase Setup</h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-11 h-11 rounded-full flex items-center justify-center text-[#DAF1DE]/70 hover:text-[#DAF1DE] hover:bg-[#163832] transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4 text-xs text-[#DAF1DE]/80 text-left">
          <div className="bg-[#163832] p-3.5 rounded-xl border border-[#235347] space-y-1.5">
            <p className="font-semibold text-[#DAF1DE] text-xs">
              Vercel Deployment
            </p>
            <p className="text-[11px] text-[#DAF1DE]/70">
              Set these variables in your Vercel Project Settings:
            </p>
            <ul className="list-disc pl-4 space-y-0.5 font-mono text-[10px] text-[#8EB69B]">
              <li>VITE_FIREBASE_API_KEY</li>
              <li>VITE_FIREBASE_AUTH_DOMAIN</li>
              <li>VITE_FIREBASE_PROJECT_ID</li>
              <li>VITE_FIREBASE_STORAGE_BUCKET</li>
              <li>VITE_FIREBASE_MESSAGING_SENDER_ID</li>
              <li>VITE_FIREBASE_APP_ID</li>
            </ul>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#DAF1DE]">
              Or paste firebaseConfig JSON:
            </label>
            <textarea
              rows={2}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{ "apiKey": "...", "projectId": "...", "appId": "..." }'
              className="w-full text-xs font-mono p-2.5 rounded-xl border border-[#235347] bg-[#163832] text-[#DAF1DE] focus:outline-hidden focus:border-[#8EB69B]"
            />
            {parseError && <p className="text-red-400 text-[11px]">{parseError}</p>}
            <button
              type="button"
              onClick={handleParseJson}
              className="min-h-[44px] px-3.5 py-2 rounded-full border border-[#235347] bg-[#163832] text-[#DAF1DE] text-xs font-medium hover:border-[#8EB69B] transition-all cursor-pointer"
            >
              Autofill fields
            </button>
          </div>

          <form id="firebase-config-form" onSubmit={handleSave} className="space-y-3 pt-1">
            <div>
              <label className="block text-[11px] font-medium text-[#DAF1DE]">API Key *</label>
              <input
                type="text"
                required
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full min-h-[44px] p-2 text-xs rounded-lg border border-[#235347] bg-[#163832] text-[#DAF1DE] focus:outline-hidden focus:border-[#8EB69B] font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#DAF1DE]">Project ID *</label>
              <input
                type="text"
                required
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="my-restaurant-app"
                className="w-full min-h-[44px] p-2 text-xs rounded-lg border border-[#235347] bg-[#163832] text-[#DAF1DE] focus:outline-hidden focus:border-[#8EB69B] font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#DAF1DE]">App ID *</label>
              <input
                type="text"
                required
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="1:123456789:web:abcdef"
                className="w-full min-h-[44px] p-2 text-xs rounded-lg border border-[#235347] bg-[#163832] text-[#DAF1DE] focus:outline-hidden focus:border-[#8EB69B] font-mono"
              />
            </div>
          </form>
        </div>

        {/* Sticky Action Footer */}
        <div className="shrink-0 p-3 border-t border-[#235347] bg-[#0B2B26] flex gap-2 pb-[max(12px,env(safe-area-inset-bottom))]">
          <button
            type="submit"
            form="firebase-config-form"
            className="flex-1 min-h-[44px] py-2.5 rounded-full btn-primary text-xs font-bold cursor-pointer"
          >
            Save Credentials
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-5 py-2.5 rounded-full btn-secondary text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
