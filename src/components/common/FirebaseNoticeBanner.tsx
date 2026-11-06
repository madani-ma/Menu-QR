import React, { useState } from 'react';
import { isFirebaseConfigured } from '../../firebase';
import { X } from 'lucide-react';

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
