import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, ShoppingBag, ExternalLink, Copy, Check, LogOut, Settings, Share2, QrCode } from 'lucide-react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  title?: string;
  restaurantSlug?: string;
  cartCount?: number;
  onOpenCart?: () => void;
  onOpenSettings?: () => void;
}

export function Header({
  title = 'MenuQR',
  restaurantSlug,
  cartCount = 0,
  onOpenCart,
  onOpenSettings,
}: HeaderProps) {
  const { navigate, route } = useRouter();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyLink = () => {
    const url = restaurantSlug
      ? `${window.location.origin}/r/${restaurantSlug}`
      : window.location.origin;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setMenuOpen(false);
  };

  const handleShare = async () => {
    const url = restaurantSlug
      ? `${window.location.origin}/r/${restaurantSlug}`
      : window.location.origin;
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Check out our digital menu on MenuQR`,
          url: url,
        });
      } catch {
        // Dismissed
      }
    } else {
      handleCopyLink();
    }
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-black/[0.05] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
      <div className="max-w-[480px] mx-auto px-4 py-3 flex items-center justify-between gap-2">
        {/* LEFT: Three-dots (⋮) Menu Button */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-neutral-100 active:scale-95 transition-all text-black cursor-pointer"
            aria-label="Menu options"
          >
            <MoreVertical className="w-5 h-5 stroke-[2.2]" />
          </button>

          {menuOpen && (
            <div className="absolute left-0 mt-2 w-56 bg-white rounded-[22px] shadow-2xl border border-black/10 py-2.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              {restaurantSlug && (
                <>
                  <button
                    onClick={handleShare}
                    className="w-full px-4 py-2.5 text-left text-xs font-medium text-black hover:bg-neutral-50 flex items-center gap-3 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-neutral-600" />
                    Share Menu
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="w-full px-4 py-2.5 text-left text-xs font-medium text-black hover:bg-neutral-50 flex items-center gap-3 cursor-pointer"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-black" />
                    ) : (
                      <Copy className="w-4 h-4 text-neutral-600" />
                    )}
                    {copied ? 'Link Copied!' : 'Copy Menu Short Link'}
                  </button>
                  <div className="h-px bg-neutral-100 my-1.5" />
                </>
              )}

              {user ? (
                <>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('/dashboard');
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-medium text-black hover:bg-neutral-50 flex items-center gap-3 cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-neutral-600" />
                    Owner Dashboard
                  </button>
                  <div className="h-px bg-neutral-100 my-1.5" />
                  <button
                    onClick={async () => {
                      setMenuOpen(false);
                      await logout();
                      navigate('/');
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-medium text-black hover:bg-neutral-50 flex items-center gap-3 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-neutral-600" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('/login');
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-medium text-black hover:bg-neutral-50 flex items-center gap-3 cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 text-neutral-600" />
                    Create Free Restaurant Menu
                  </button>
                  {route.name !== 'landing' && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        navigate('/');
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-medium text-black hover:bg-neutral-50 flex items-center gap-3 cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4 text-neutral-600" />
                      About MenuQR
                    </button>
                  )}
                </>
              )}

              {onOpenSettings && (
                <>
                  <div className="h-px bg-neutral-100 my-1.5" />
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full px-4 py-2 text-left text-[11px] text-neutral-500 hover:bg-neutral-50 flex items-center gap-2.5 cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-neutral-400" />
                    API & Firebase Setup
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* CENTER: Restaurant Name in spaced-out Georgia serif */}
        <div
          onClick={() => {
            if (route.name === 'menu') return;
            navigate(user ? '/dashboard' : '/');
          }}
          className={`flex-1 text-center px-2 overflow-hidden ${route.name !== 'menu' ? 'cursor-pointer' : ''}`}
        >
          <h1 className="font-heading text-sm sm:text-base font-bold tracking-[0.2em] uppercase text-black truncate leading-none">
            {title}
          </h1>
        </div>

        {/* RIGHT: Cart icon with black count badge */}
        <div className="shrink-0 flex items-center justify-end w-10">
          <button
            onClick={() => {
              if (onOpenCart) {
                onOpenCart();
              } else if (route.name === 'menu') {
                // If in menu view but no handler passed, toggle cart
              } else {
                navigate(user ? '/dashboard' : '/login');
              }
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-neutral-100 active:scale-95 transition-all text-black cursor-pointer relative"
            aria-label="View Cart"
          >
            <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-black text-white text-[10px] font-bold font-mono flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
