import React, { useState, Suspense, lazy } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import {
  Camera,
  ArrowRight,
  Sparkles,
  Star,
  CheckCircle2,
  Menu as MenuIcon,
  X,
  Utensils,
  QrCode,
  MessageCircle,
  Clock,
  MapPin,
  ExternalLink,
} from 'lucide-react';

const QRScannerModal = lazy(() =>
  import('../common/QRScannerModal').then((m) => ({ default: m.QRScannerModal }))
);

interface Props {
  onOpenFirebaseConfig: () => void;
}

type LandingTab = 'overview' | 'signature' | 'how-it-works' | 'story' | 'reviews' | 'contact';

export function LandingPage({ onOpenFirebaseConfig }: Props) {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<LandingTab>('overview');
  const [isScanQROpen, setIsScanQROpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sampleDishes = [
    {
      name: 'Grilled Angus Steak',
      description: 'Char-grilled prime beef with herb butter and seasonal roasted vegetables.',
      price: '$36.00',
      image: '/images/plate-steak.webp',
      tag: 'Bestseller',
    },
    {
      name: 'Truffle Cream Tagliolini',
      description: 'House egg ribbons tossed in 24-month parmesan and fresh black winter truffle.',
      price: '$28.00',
      image: '/images/plate-pasta.webp',
      tag: "Chef's pick",
    },
    {
      name: 'Salmon Quinoa Salad',
      description: 'Crispy skin king salmon with fresh garden radishes, watercress, and herb dressing.',
      price: '$26.50',
      image: '/images/plate-salmon.webp',
      tag: 'Popular',
    },
    {
      name: 'Artisan Lotek Perkedel',
      description: 'Spiced vegetable melange with roasted peanut sauce and golden potato fritter.',
      price: '$16.50',
      image: '/images/plate-lotek.webp',
      tag: 'Special',
    },
  ];

  const guestReviews = [
    {
      name: 'Frieren M.',
      role: 'Food & Wine Critic',
      stars: 5,
      comment: 'The food was exceptional, the atmosphere was serene, and the digital WhatsApp menu ordering was delightfully fast.',
    },
    {
      name: 'Christian P.',
      role: 'Restaurateur',
      stars: 5,
      comment: 'One of the best dining experiences we have had. Beautiful presentation, zero app downloads needed for guests.',
    },
    {
      name: 'Mikasa L.',
      role: 'Culinary Enthusiast',
      stars: 5,
      comment: 'MenuQR increased our table ordering speed by 40%. Our guests adore scanning the QR code and ordering on WhatsApp.',
    },
  ];

  return (
    <div className="w-full flex-1 flex flex-col min-h-dvh overflow-x-hidden">
      {/* Top Navigation Bar: Logo | How it works | Demo menu | Scan QR | Login */}
      <header className="sticky top-0 z-40 bg-[#051F20]/95 backdrop-blur-md border-b border-[#235347] w-full">
        <div className="max-w-[480px] mx-auto px-4 py-3 flex items-center justify-between gap-2">
          {/* Brand Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('overview')}>
            <div className="w-8 h-8 rounded-full bg-[#163832] border border-[#235347] flex items-center justify-center font-heading font-extrabold text-sm text-[#8EB69B]">
              M
            </div>
            <span className="font-heading font-extrabold text-lg text-[#DAF1DE] tracking-wider">
              MenuQR
            </span>
          </div>

          {/* Right Header Navigation Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Scan QR Button */}
            <button
              onClick={() => setIsScanQROpen(true)}
              className="min-h-[44px] px-3 rounded-full bg-[#163832] border border-[#235347] text-xs font-bold text-[#8EB69B] hover:border-[#8EB69B] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Camera className="w-4 h-4 stroke-[2.2]" />
              <span className="hidden xs:inline">Scan QR</span>
            </button>

            {/* Login / Dashboard Button */}
            <button
              onClick={() => navigate(user ? '/dashboard' : '/login')}
              className="min-h-[44px] px-4 rounded-full btn-primary text-xs font-bold shadow-md cursor-pointer shrink-0 flex items-center justify-center"
            >
              {user ? 'Dashboard' : 'Login'}
            </button>

            {/* Hamburger Button (Minor items: How it works, Demo, Help) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-11 h-11 rounded-full bg-[#163832] border border-[#235347] flex items-center justify-center text-[#DAF1DE] hover:border-[#8EB69B] transition-colors cursor-pointer"
              aria-label="Navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Hamburger Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="max-w-[480px] mx-auto px-4 py-3 bg-[#0B2B26] border-t border-[#235347] space-y-2 animate-in fade-in duration-150 text-xs">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setActiveTab('overview');
              }}
              className="w-full text-left py-2 px-3 rounded-xl hover:bg-[#163832] text-[#DAF1DE] font-semibold cursor-pointer"
            >
              Home Overview
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setActiveTab('signature');
              }}
              className="w-full text-left py-2 px-3 rounded-xl hover:bg-[#163832] text-[#DAF1DE] font-semibold cursor-pointer"
            >
              Signature Collection
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setActiveTab('how-it-works');
              }}
              className="w-full text-left py-2 px-3 rounded-xl hover:bg-[#163832] text-[#DAF1DE] font-semibold cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/r/demo-bistro');
              }}
              className="w-full text-left py-2 px-3 rounded-xl hover:bg-[#163832] text-[#8EB69B] font-bold flex items-center justify-between cursor-pointer"
            >
              <span>Explore Demo Bistro</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setActiveTab('story');
              }}
              className="w-full text-left py-2 px-3 rounded-xl hover:bg-[#163832] text-[#DAF1DE] font-semibold cursor-pointer"
            >
              Our Story
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setActiveTab('reviews');
              }}
              className="w-full text-left py-2 px-3 rounded-xl hover:bg-[#163832] text-[#DAF1DE] font-semibold cursor-pointer"
            >
              Guest Reviews
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenFirebaseConfig();
              }}
              className="w-full text-left py-2 px-3 rounded-xl hover:bg-[#163832] text-[#DAF1DE]/70 font-medium cursor-pointer"
            >
              API & Cloud Setup
            </button>
          </div>
        )}

        {/* Horizontal Navigation Strip for sections */}
        <div className="max-w-[480px] mx-auto px-2 overflow-x-auto no-scrollbar border-t border-[#235347]/60">
          <div className="flex items-center space-x-1 py-0.5 min-w-max text-xs font-semibold uppercase tracking-wider">
            {[
              { id: 'overview', label: 'Home' },
              { id: 'signature', label: 'Signature' },
              { id: 'how-it-works', label: 'How It Works' },
              { id: 'story', label: 'Story' },
              { id: 'reviews', label: 'Reviews' },
              { id: 'contact', label: 'Contact' },
            ].map((t) => {
              const isSel = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as LandingTab)}
                  className={`min-h-[44px] px-3.5 transition-colors cursor-pointer relative flex items-center justify-center ${
                    isSel ? 'text-[#8EB69B] font-bold' : 'text-[#DAF1DE]/60 hover:text-[#DAF1DE]'
                  }`}
                >
                  {t.label}
                  {isSel && (
                    <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#8EB69B] rounded-full shadow-[0_0_8px_#8EB69B]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Landing View Content by Tab (No long scrolling page) */}
      <main className="w-full max-w-[480px] mx-auto px-4 py-4 space-y-6 flex-1 overflow-x-hidden pb-24">
        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW HERO (Inspired by attached Food_Landing_Page)             */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Hero Card */}
            <div className="glass-card p-5 space-y-5 border border-[#8EB69B]/40 relative overflow-hidden">
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8EB69B]">
                  Exceptional Gastronomy
                </span>
                <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#DAF1DE] leading-tight">
                  Taste Crafted <br />
                  to <span className="text-[#8EB69B]">Perfection</span>
                </h2>
                <p className="text-xs text-[#DAF1DE]/80 leading-relaxed max-w-sm">
                  Create a bespoke QR menu for your restaurant in 2 minutes. Diners scan and place itemized orders directly to your WhatsApp.
                </p>
              </div>

              {/* Large Top-Down Hero Plate on right / center */}
              <div className="relative w-44 h-44 sm:w-56 sm:h-56 mx-auto flex items-center justify-center aspect-square rounded-full overflow-visible shrink-0">
                <div className="absolute inset-0 rounded-full bg-[#8EB69B]/20 blur-2xl pointer-events-none" />
                <img
                  src="/images/plate-steak.webp"
                  alt="Signature grilled steak"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  width={224}
                  height={224}
                  className="w-full h-full object-cover rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.7)] border-2 border-[#235347] aspect-square"
                />
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2.5 pt-1">
                <button
                  onClick={() => navigate(user ? '/dashboard' : '/login')}
                  className="w-full py-3.5 rounded-full btn-primary text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xl active:scale-[0.99] transition-all cursor-pointer"
                >
                  <span>{user ? 'Open Owner Dashboard' : 'Create Free Restaurant Menu'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => navigate('/r/demo-bistro')}
                    className="py-2.5 rounded-full btn-secondary text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#8EB69B]" />
                    <span>Demo Menu</span>
                  </button>

                  <button
                    onClick={() => setIsScanQROpen(true)}
                    className="py-2.5 rounded-full btn-secondary text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#8EB69B]" />
                    <span>Scan a QR</span>
                  </button>
                </div>
              </div>

              {/* 3 Value markers */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#235347] text-center text-[10px] text-[#DAF1DE]/80">
                <div className="space-y-0.5">
                  <p className="font-bold text-[#8EB69B]">Zero Fees</p>
                  <p className="text-[#DAF1DE]/50">No commission</p>
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-[#8EB69B]">Instant Sync</p>
                  <p className="text-[#DAF1DE]/50">Live price edits</p>
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-[#8EB69B]">WhatsApp</p>
                  <p className="text-[#DAF1DE]/50">Direct table order</p>
                </div>
              </div>
            </div>

            {/* Featured dishes preview */}
            <div className="glass-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#8EB69B]">
                    Signature Dishes
                  </span>
                  <h3 className="font-heading font-extrabold text-base text-[#DAF1DE]">
                    Guest Favorites
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('signature')}
                  className="text-xs font-bold text-[#8EB69B] hover:text-[#DAF1DE] underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {sampleDishes.slice(0, 2).map((d) => (
                  <div key={d.name} className="p-2.5 rounded-2xl bg-[#163832] border border-[#235347] space-y-2">
                    <img
                      src={d.image}
                      alt={d.name}
                      loading="lazy"
                      decoding="async"
                      width={180}
                      height={96}
                      className="w-full h-24 object-cover rounded-xl border border-[#235347]"
                    />
                    <div>
                      <p className="font-heading font-bold text-xs text-[#DAF1DE] truncate">{d.name}</p>
                      <p className="font-mono text-xs font-bold text-[#8EB69B]">{d.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: SIGNATURE COLLECTION (Inspired by attached image)                 */}
        {/* ========================================================================= */}
        {activeTab === 'signature' && (
          <div className="space-y-4">
            <div className="glass-card p-5 space-y-1.5 border border-[#8EB69B]/40">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8EB69B]">
                Chef's Favorites
              </span>
              <h3 className="font-heading font-extrabold text-2xl text-[#DAF1DE]">
                Signature Collection
              </h3>
              <p className="text-xs text-[#DAF1DE]/70 leading-relaxed">
                Handpicked favorites from our curated kitchen, crafted with passion and designed to leave a lasting impression.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {sampleDishes.map((dish) => (
                <div
                  key={dish.name}
                  className="glass-card overflow-hidden p-3.5 space-y-3 border border-[#235347]"
                >
                  <div className="relative h-40 w-full rounded-xl overflow-hidden bg-[#051F20] border border-[#235347]">
                    <img
                      src={dish.image}
                      alt={dish.name}
                      loading="lazy"
                      decoding="async"
                      width={380}
                      height={160}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2.5 left-2.5 bg-[#8EB69B] text-[#051F20] text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                      {dish.tag}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-heading font-extrabold text-sm text-[#DAF1DE]">{dish.name}</h4>
                      <span className="font-mono font-bold text-xs text-[#8EB69B]">{dish.price}</span>
                    </div>
                    <p className="text-xs text-[#DAF1DE]/70 leading-relaxed line-clamp-2">
                      {dish.description}
                    </p>
                  </div>

                  <button
                    onClick={() => navigate('/r/demo-bistro')}
                    className="w-full py-2.5 rounded-full btn-primary text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <span>Explore in Live Bistro</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: HOW IT WORKS                                                       */}
        {/* ========================================================================= */}
        {activeTab === 'how-it-works' && (
          <div className="space-y-4">
            <div className="glass-card p-5 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8EB69B]">
                3 Simple Steps
              </span>
              <h3 className="font-heading font-extrabold text-2xl text-[#DAF1DE]">
                How MenuQR Works
              </h3>
              <p className="text-xs text-[#DAF1DE]/70">
                A seamless dining workflow built for restaurant independence.
              </p>
            </div>

            <div className="space-y-3">
              <div className="glass-card p-4 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-[#8EB69B] text-[#051F20] font-extrabold text-sm flex items-center justify-center shrink-0">
                  1
                </div>
                <div className="space-y-1">
                  <h4 className="font-heading font-bold text-sm text-[#DAF1DE]">Setup Dishes & Pricing</h4>
                  <p className="text-xs text-[#DAF1DE]/70 leading-relaxed">
                    Add your dishes with prices, photos, ingredients, and flavor profiles. Update instantly anytime.
                  </p>
                </div>
              </div>

              <div className="glass-card p-4 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-[#8EB69B] text-[#051F20] font-extrabold text-sm flex items-center justify-center shrink-0">
                  2
                </div>
                <div className="space-y-1">
                  <h4 className="font-heading font-bold text-sm text-[#DAF1DE]">Generate & Print Table QR</h4>
                  <p className="text-xs text-[#DAF1DE]/70 leading-relaxed">
                    Download your custom QR code PNG. Print on acrylic table stands, tent cards, or counter stickers.
                  </p>
                </div>
              </div>

              <div className="glass-card p-4 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-[#8EB69B] text-[#051F20] font-extrabold text-sm flex items-center justify-center shrink-0">
                  3
                </div>
                <div className="space-y-1">
                  <h4 className="font-heading font-bold text-sm text-[#DAF1DE]">Receive WhatsApp Orders</h4>
                  <p className="text-xs text-[#DAF1DE]/70 leading-relaxed">
                    Diners scan, tap "+" on items, and send pre-filled itemized orders straight to your staff WhatsApp.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate(user ? '/dashboard' : '/login')}
              className="w-full py-4 rounded-full btn-primary text-xs sm:text-sm font-bold shadow-xl cursor-pointer"
            >
              Get Started Free
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: OUR STORY                                                          */}
        {/* ========================================================================= */}
        {activeTab === 'story' && (
          <div className="space-y-4">
            <div className="glass-card p-5 space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8EB69B]">
                Behind the Pass
              </span>
              <h3 className="font-heading font-extrabold text-2xl text-[#DAF1DE]">
                Passion in Every Plate
              </h3>
              <p className="text-xs text-[#DAF1DE]/80 leading-relaxed">
                We believe great hospitality begins with honoring ingredients and respecting the connection between chef and diner. MenuQR empowers independent restaurants to retain their identity and delight guests.
              </p>

              <div className="relative h-44 rounded-2xl overflow-hidden border border-[#235347]">
                <img
                  src="/images/hero-2.webp"
                  alt="Chefs in kitchen"
                  loading="lazy"
                  decoding="async"
                  width={400}
                  height={176}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: REVIEWS                                                            */}
        {/* ========================================================================= */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <div className="glass-card p-5 space-y-1.5 border border-[#8EB69B]/40">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8EB69B]">
                Trusted by Top Diners
              </span>
              <h3 className="font-heading font-extrabold text-2xl text-[#DAF1DE]">
                Guest Accolades (4.9 ★)
              </h3>
              <p className="text-xs text-[#DAF1DE]/70">
                Feedback from guests and restaurant proprietors using MenuQR.
              </p>
            </div>

            <div className="space-y-3">
              {guestReviews.map((rev) => (
                <div key={rev.name} className="glass-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-heading font-bold text-xs text-[#DAF1DE]">{rev.name}</p>
                      <p className="text-[10px] text-[#DAF1DE]/50">{rev.role}</p>
                    </div>
                    <div className="flex items-center gap-0.5 text-[#8EB69B]">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="w-3.5 h-3.5 fill-[#8EB69B]" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-[#DAF1DE]/80 italic leading-relaxed">
                    "{rev.comment}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: CONTACT                                                            */}
        {/* ========================================================================= */}
        {activeTab === 'contact' && (
          <div className="glass-card p-5 space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8EB69B]">
              Get in Touch
            </span>
            <h3 className="font-heading font-extrabold text-2xl text-[#DAF1DE]">
              Support & Inquiries
            </h3>
            <p className="text-xs text-[#DAF1DE]/70 leading-relaxed">
              Have questions about integrating MenuQR with your dining venue or hardware? Our team is available 24/7.
            </p>

            <div className="space-y-2 text-xs text-[#DAF1DE]/80 pt-2 border-t border-[#235347]">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#8EB69B]" />
                <span>hello@menuqr.app</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#8EB69B]" />
                <span>Mon – Sun: 24h Support</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* QR Scanner Modal (Loaded lazily on demand) */}
      {isScanQROpen && (
        <Suspense fallback={null}>
          <QRScannerModal
            isOpen={isScanQROpen}
            onClose={() => setIsScanQROpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
