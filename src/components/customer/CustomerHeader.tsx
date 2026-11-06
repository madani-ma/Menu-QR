import React, { useState } from 'react';
import { type CustomerTab } from '../../types';
import { ShoppingBag, Search, Share2, Camera, X } from 'lucide-react';

interface Props {
  restaurantName: string;
  restaurantLogo?: string;
  restaurantSlug: string;
  activeTab: CustomerTab;
  onSelectTab: (tab: CustomerTab) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenScanQR: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function CustomerHeader({
  restaurantName,
  restaurantLogo,
  activeTab,
  onSelectTab,
  cartCount,
  onOpenCart,
  onOpenScanQR,
  searchQuery,
  onSearchChange,
}: Props) {
  const [showSearch, setShowSearch] = useState(false);
  const [copied, setCopied] = useState(false);

  const tabs: { id: CustomerTab; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'menu', label: 'Menu' },
    { id: 'specials', label: 'Specials' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' },
  ];

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: restaurantName,
          text: `Explore the digital menu for ${restaurantName}`,
          url,
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#051F20]/95 backdrop-blur-md border-b border-[#235347] w-full">
      {/* Top Header Row with >= 44px touch targets */}
      <div className="max-w-[480px] mx-auto px-4 py-2 flex items-center justify-between gap-2">
        {/* Left: Restaurant Logo / Name */}
        <div className="flex items-center gap-2.5 truncate min-h-[44px]">
          {restaurantLogo ? (
            <img
              src={restaurantLogo}
              alt={restaurantName}
              className="w-8 h-8 rounded-full object-cover border border-[#235347] shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#163832] border border-[#235347] flex items-center justify-center font-heading font-extrabold text-xs text-[#8EB69B] shrink-0">
              {restaurantName.charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className="font-heading font-extrabold text-sm sm:text-base tracking-wide text-[#DAF1DE] truncate">
            {restaurantName}
          </h1>
        </div>

        {/* Right Action Icons: Scan QR, Search, Share, Cart (touch target >= 44px) */}
        <div className="flex items-center gap-0.5 shrink-0 text-[#DAF1DE]">
          {/* Scan QR button */}
          <button
            onClick={onOpenScanQR}
            className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-[#163832] text-[#8EB69B] active:scale-95 transition-all cursor-pointer"
            title="Scan restaurant QR"
            aria-label="Scan QR code"
          >
            <Camera className="w-5 h-5 stroke-[2]" />
          </button>

          {/* Search Toggle button */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-[#163832] text-[#DAF1DE]/80 hover:text-[#DAF1DE] active:scale-95 transition-all cursor-pointer"
            aria-label="Search dishes"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-[#163832] text-[#DAF1DE]/80 hover:text-[#DAF1DE] active:scale-95 transition-all cursor-pointer relative"
            aria-label="Share menu"
          >
            <Share2 className="w-5 h-5" />
            {copied && (
              <span className="absolute -bottom-6 right-0 text-[10px] bg-[#8EB69B] text-[#051F20] px-1.5 py-0.5 rounded-md font-bold whitespace-nowrap shadow-md">
                Copied!
              </span>
            )}
          </button>

          {/* Cart Icon with count badge */}
          <button
            onClick={onOpenCart}
            className="w-11 h-11 rounded-full flex items-center justify-center text-[#DAF1DE] hover:bg-[#163832] active:scale-95 transition-all cursor-pointer relative"
            aria-label="View Order"
          >
            <div className="w-9 h-9 rounded-full bg-[#163832] border border-[#235347] flex items-center justify-center relative">
              <ShoppingBag className="w-4 h-4 stroke-[2]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-[#8EB69B] text-[#051F20] text-[9px] font-mono font-extrabold flex items-center justify-center shadow-md">
                  {cartCount}
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Expandable Search Input */}
      {showSearch && (
        <div className="max-w-[480px] mx-auto px-4 pb-2 pt-1 animate-in fade-in duration-150">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8EB69B] absolute left-3.5 top-3" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search dishes or ingredients..."
              className="w-full min-h-[44px] pl-10 pr-9 py-2 rounded-xl bg-[#163832] border border-[#235347] text-xs text-[#DAF1DE] placeholder:text-[#DAF1DE]/40 focus:outline-hidden focus:border-[#8EB69B]"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="w-9 h-9 absolute right-1 top-1 text-[#DAF1DE]/50 hover:text-[#DAF1DE] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Horizontal Sticky Tab Strip with >= 44px touch targets */}
      <div className="max-w-[480px] mx-auto px-2 overflow-x-auto no-scrollbar border-t border-[#235347]/60">
        <div className="flex items-center space-x-1 py-0.5 min-w-max">
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`min-h-[44px] px-3.5 text-xs font-semibold uppercase tracking-wider relative transition-all cursor-pointer whitespace-nowrap flex items-center justify-center ${
                  isSelected
                    ? 'text-[#8EB69B] font-bold'
                    : 'text-[#DAF1DE]/60 hover:text-[#DAF1DE]'
                }`}
              >
                {tab.label}
                {isSelected && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#8EB69B] rounded-full shadow-[0_0_8px_#8EB69B]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
