import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import {
  type Restaurant,
  type MenuItem,
  type CartItem,
  type MenuCategory,
  type CustomerTab,
  type RatingReview,
} from '../../types';
import {
  subscribeToRestaurant,
  DEMO_RESTAURANT,
} from '../../services/restaurantService';
import {
  subscribeToRatings,
} from '../../services/ratingService';
import {
  CATEGORIES,
  getDishImage,
  formatPrice,
  cleanPhoneNumber,
} from '../../utils/formatters';
import { CustomerHeader } from './CustomerHeader';
import { FeaturedDishShowcase } from './FeaturedDishShowcase';
import { CartBarAndModal } from './CartBarAndModal';
import { useRouter } from '../../context/RouterContext';
import {
  Star,
  Plus,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  Instagram,
  Facebook,
  ExternalLink,
  ChevronRight,
  Utensils,
  ArrowRight,
} from 'lucide-react';

// Lazy-load heavy modals & views to keep initial bundle ultra lean
const DishDetailModal = React.lazy(() =>
  import('./DishDetailModal').then((m) => ({ default: m.DishDetailModal }))
);
const QRScannerModal = React.lazy(() =>
  import('../common/QRScannerModal').then((m) => ({ default: m.QRScannerModal }))
);
const ReviewsTab = React.lazy(() =>
  import('./ReviewsTab').then((m) => ({ default: m.ReviewsTab }))
);

// Memoized Dish Card Component to prevent full re-render on cart updates or tab switching
const MemoizedDishCard = React.memo(function DishCard({
  dish,
  inCartCount,
  onOpenDetail,
  onAddToCart,
  currency = 'Rs.',
}: {
  dish: MenuItem;
  inCartCount: number;
  onOpenDetail: (dish: MenuItem) => void;
  onAddToCart: (dish: MenuItem) => void;
  currency?: string;
}) {
  return (
    <div
      onClick={() => onOpenDetail(dish)}
      className="glass-card-interactive content-auto overflow-hidden flex flex-col sm:flex-row gap-3 p-3.5 cursor-pointer text-left"
    >
      {/* Photo Thumbnail with tag and explicit aspect ratio to prevent CLS */}
      <div className="relative h-44 sm:h-auto sm:w-36 rounded-xl bg-[#051F20] overflow-hidden shrink-0 border border-[#235347] aspect-video sm:aspect-square">
        <img
          src={getDishImage(dish, 400)}
          alt={dish.name}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          width={144}
          height={144}
        />
        {dish.tag && (
          <span className="absolute top-2 left-2 bg-[#8EB69B] text-[#051F20] text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
            {dish.tag}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between space-y-2 min-w-0">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-heading font-extrabold text-base text-[#DAF1DE] leading-snug">
              {dish.name}
            </h4>
            <span className="font-mono font-bold text-sm text-[#8EB69B] shrink-0">
              {formatPrice(dish.price, currency)}
            </span>
          </div>
          <p className="text-xs text-[#DAF1DE]/70 line-clamp-2 leading-relaxed">
            {dish.description}
          </p>
        </div>

        {/* Meta & Add to cart button */}
        <div className="pt-1 flex items-center justify-between border-t border-[#235347]/50">
          <div className="flex items-center gap-2 text-[11px] text-[#DAF1DE]/60">
            <span>{dish.category}</span>
            {dish.rating && (
              <span className="flex items-center gap-0.5 text-[#8EB69B] font-bold">
                <Star className="w-3 h-3 fill-[#8EB69B]" />
                <span>{dish.rating.toFixed(1)}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {inCartCount > 0 && (
              <span className="text-[10px] font-mono font-bold text-[#8EB69B] bg-[#163832] px-2 py-0.5 rounded-full border border-[#235347]">
                {inCartCount} in order
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(dish);
              }}
              className="w-8 h-8 rounded-full btn-primary flex items-center justify-center shadow-md active:scale-90 transition-all cursor-pointer"
              aria-label={`Add ${dish.name} to cart`}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

// Memoized Signature Card Component for Home Tab
const MemoizedSignatureCard = React.memo(function SignatureCard({
  dish,
  onOpenDetail,
  onAddToCart,
  currency = 'Rs.',
}: {
  dish: MenuItem;
  onOpenDetail: (dish: MenuItem) => void;
  onAddToCart: (dish: MenuItem) => void;
  currency?: string;
}) {
  return (
    <div
      onClick={() => onOpenDetail(dish)}
      className="glass-card-interactive content-auto overflow-hidden flex flex-col justify-between cursor-pointer group text-left"
    >
      <div className="relative h-28 w-full bg-[#051F20] overflow-hidden aspect-[4/3]">
        <img
          src={getDishImage(dish, 400)}
          alt={dish.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          decoding="async"
          width={200}
          height={112}
        />
        {dish.tag && (
          <span className="absolute top-2 left-2 bg-[#0B2B26]/90 backdrop-blur-md text-[#8EB69B] text-[8px] font-bold px-2 py-0.5 rounded-full uppercase border border-[#235347]">
            {dish.tag}
          </span>
        )}
      </div>

      <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
        <div className="space-y-0.5">
          <h4 className="font-heading font-bold text-xs text-[#DAF1DE] line-clamp-1">
            {dish.name}
          </h4>
          <p className="text-[10px] text-[#DAF1DE]/60 line-clamp-2 leading-relaxed">
            {dish.description}
          </p>
        </div>

        <div className="pt-1.5 flex items-center justify-between border-t border-[#235347]/50">
          <span className="font-mono font-bold text-xs text-[#8EB69B]">
            {formatPrice(dish.price, currency)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(dish);
            }}
            className="w-7 h-7 rounded-full bg-[#8EB69B] text-[#051F20] flex items-center justify-center hover:bg-[#DAF1DE] active:scale-90 transition-all shadow-xs cursor-pointer"
            aria-label={`Add ${dish.name} to order`}
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
});

interface Props {
  slug: string;
  onOpenFirebaseConfig: () => void;
  previewRestaurant?: Restaurant;
  isPreview?: boolean;
}

export function CustomerMenu({
  slug,
  previewRestaurant,
  isPreview = false,
}: Props) {
  const { navigate } = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(
    previewRestaurant || (slug === 'demo-bistro' ? DEMO_RESTAURANT : null)
  );
  const [loading, setLoading] = useState(!previewRestaurant && slug !== 'demo-bistro');
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<CustomerTab>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isScanQROpen, setIsScanQROpen] = useState(false);
  const [detailDish, setDetailDish] = useState<MenuItem | null>(null);
  const [ratings, setRatings] = useState<RatingReview[]>([]);

  // 200ms Search Debounce to keep input typing silky smooth on mobile
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Subscribe to real-time restaurant doc (single listener per screen, cleans up on unmount)
  useEffect(() => {
    if (previewRestaurant) {
      setRestaurant(previewRestaurant);
      setLoading(false);
      setNotFound(false);
      return;
    }

    if (slug === 'demo-bistro') {
      setRestaurant(DEMO_RESTAURANT);
      setLoading(false);
      setNotFound(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToRestaurant(
      slug,
      (data) => {
        if (data) {
          setRestaurant(data);
          setNotFound(false);
        } else {
          setRestaurant(null);
          setNotFound(true);
        }
        setLoading(false);
      },
      () => {
        setLoading(false);
        setNotFound(true);
      }
    );

    return () => unsubscribe();
  }, [slug, previewRestaurant]);

  // Subscribe to real-time ratings
  useEffect(() => {
    const unsub = subscribeToRatings(slug, (newRatings) => {
      setRatings(newRatings);
    });
    return () => unsub();
  }, [slug]);

  // Stabilized Cart operations via useCallback
  const addToCart = useCallback((dish: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === dish.id);
      if (existing) {
        return prev.map((c) => (c.id === dish.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [
        ...prev,
        {
          id: dish.id,
          name: dish.name,
          price: dish.price,
          quantity: 1,
          category: dish.category,
          image: getDishImage(dish, 160),
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.id === id) {
            const newQty = c.quantity + delta;
            return newQty > 0 ? { ...c, quantity: newQty } : null;
          }
          return c;
        })
        .filter(Boolean) as CartItem[]
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const items = useMemo(
    () => (restaurant?.items || []).filter((i) => i.available !== false),
    [restaurant?.items]
  );

  // Memoized search and category filtering
  const searchedItems = useMemo(() => {
    if (!debouncedSearch.trim()) return items;
    const q = debouncedSearch.toLowerCase();
    return items.filter(
      (dish) =>
        dish.name.toLowerCase().includes(q) ||
        dish.description.toLowerCase().includes(q) ||
        dish.category.toLowerCase().includes(q) ||
        (dish.ingredients && dish.ingredients.some((ing) => ing.toLowerCase().includes(q)))
    );
  }, [items, debouncedSearch]);

  const categoryFilteredItems = useMemo(() => {
    return selectedCategory === 'All'
      ? searchedItems
      : searchedItems.filter((i) => i.category === selectedCategory);
  }, [searchedItems, selectedCategory]);

  const specialItems = useMemo(() => {
    return items.filter(
      (i) => i.tag === 'Bestseller' || i.tag === "Chef's pick" || i.tag === 'Popular'
    );
  }, [items]);

  const totalCartCount = useMemo(() => {
    return cart.reduce((sum, i) => sum + i.quantity, 0);
  }, [cart]);

  // Fast lookup map for quantities in cart
  const cartQuantityMap = useMemo(() => {
    const map = new Map<string, number>();
    cart.forEach((c) => map.set(c.id, c.quantity));
    return map;
  }, [cart]);

  const handleOpenDetail = useCallback((dish: MenuItem) => {
    setDetailDish(dish);
  }, []);

  // Not Found State
  if (notFound && !loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#163832] border border-[#235347] flex items-center justify-center text-[#8EB69B]">
          <Utensils className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="font-heading font-extrabold text-2xl text-[#DAF1DE]">Menu Not Found</h2>
          <p className="text-xs text-[#DAF1DE]/70 max-w-xs leading-relaxed">
            The menu for <strong className="text-[#8EB69B]">"{slug}"</strong> is not active yet.
          </p>
        </div>
        <div className="pt-2 flex flex-col gap-2.5 w-full max-w-xs">
          <button
            onClick={() => navigate('/r/demo-bistro')}
            className="w-full py-3 rounded-full btn-primary text-xs font-bold shadow-lg cursor-pointer"
          >
            Explore Live Demo Bistro
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 rounded-full btn-secondary text-xs font-semibold cursor-pointer"
          >
            Create Your Free Menu
          </button>
        </div>
      </div>
    );
  }

  if (loading || !restaurant) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-3">
        <div className="w-6 h-6 border-2 border-[#8EB69B] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-[#DAF1DE]/60 font-mono">Loading dining experience...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative w-full overflow-x-hidden min-h-dvh pb-32">
      {/* Sticky Top Header with text tabs */}
      <CustomerHeader
        restaurantName={restaurant.name}
        restaurantLogo={restaurant.logo}
        restaurantSlug={restaurant.slug}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenScanQR={() => setIsScanQROpen(true)}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (q.trim() && activeTab !== 'menu') {
            setActiveTab('menu');
          }
        }}
      />

      {/* Main Tab Screen Switcher */}
      <main className="w-full max-w-[480px] mx-auto px-4 py-4 space-y-6 flex-1 overflow-x-hidden">
        {/* TAB 1: HOME SCREEN */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* 1. Featured Dish Showcase Animation */}
            <FeaturedDishShowcase
              dishes={specialItems.length > 0 ? specialItems : items}
              onAddToCart={addToCart}
              onOpenDishDetail={handleOpenDetail}
              currency={restaurant.currency || 'Rs.'}
            />

            {/* 2. Signature Collection Cards */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between px-1">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#8EB69B]">
                    Chef's Favorites
                  </span>
                  <h3 className="font-heading font-extrabold text-xl text-[#DAF1DE]">
                    Signature Collection
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('menu')}
                  className="text-xs font-bold text-[#8EB69B] hover:text-[#DAF1DE] underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(specialItems.length > 0 ? specialItems.slice(0, 4) : items.slice(0, 4)).map((dish) => (
                  <MemoizedSignatureCard
                    key={`sig-${dish.id}`}
                    dish={dish}
                    onOpenDetail={handleOpenDetail}
                    onAddToCart={addToCart}
                    currency={restaurant.currency || 'Rs.'}
                  />
                ))}
              </div>
            </div>

            {/* 3. Our Story Block */}
            <div className="glass-card content-auto p-5 space-y-4">
              <div className="relative h-40 rounded-2xl overflow-hidden border border-[#235347] aspect-[16/9]">
                <img
                  src="/images/hero-2.webp"
                  alt="Executive Chef"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  width={440}
                  height={160}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B2B26] via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 text-left">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#8EB69B]">
                    Our Heritage
                  </span>
                  <h4 className="font-heading font-extrabold text-base text-[#DAF1DE]">
                    Passion in Every Plate
                  </h4>
                </div>
              </div>

              <p className="text-xs text-[#DAF1DE]/80 leading-relaxed text-left">
                {restaurant.story ||
                  'Every dish is crafted with reverence for organic seasonal produce, culinary mastery, and the joy of sharing memorable moments.'}
              </p>

              {/* Stats badges */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#235347] text-center">
                <div className="p-2 rounded-xl bg-[#163832]">
                  <p className="font-heading font-extrabold text-base text-[#8EB69B]">12+</p>
                  <p className="text-[10px] text-[#DAF1DE]/60">Years Heritage</p>
                </div>
                <div className="p-2 rounded-xl bg-[#163832]">
                  <p className="font-heading font-extrabold text-base text-[#8EB69B]">50+</p>
                  <p className="text-[10px] text-[#DAF1DE]/60">Dishes</p>
                </div>
                <div className="p-2 rounded-xl bg-[#163832]">
                  <p className="font-heading font-extrabold text-base text-[#8EB69B]">10k+</p>
                  <p className="text-[10px] text-[#DAF1DE]/60">Happy Guests</p>
                </div>
              </div>
            </div>

            {/* 4. Guest Reviews Carousel Preview */}
            <div className="glass-card content-auto p-4 space-y-3 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#8EB69B]">
                    Guest Accolades
                  </span>
                  <h4 className="font-heading font-extrabold text-base text-[#DAF1DE]">
                    Unforgettable Experiences
                  </h4>
                </div>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className="text-xs font-bold text-[#8EB69B] hover:text-[#DAF1DE] underline cursor-pointer"
                >
                  See All ({ratings.length})
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-[#163832] border border-[#235347] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#DAF1DE]">
                    {ratings[0]?.name || 'Frieren M.'}
                  </span>
                  <div className="flex items-center gap-0.5 text-[#8EB69B]">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3 h-3 fill-[#8EB69B]" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-[#DAF1DE]/80 italic leading-relaxed">
                  "{ratings[0]?.comment || 'The food was exceptional, the atmosphere was serene and every single dish exceeded our expectations.'}"
                </p>
              </div>
            </div>

            {/* 5. Promotional Banner with Photo */}
            {restaurant.offer && (
              <div className="relative rounded-[22px] overflow-hidden p-5 text-[#DAF1DE] bg-[#0B2B26] border border-[#235347] shadow-xl min-h-[160px] flex flex-col justify-end text-left content-auto">
                <img
                  src="/images/promo.webp"
                  alt="Offer promo"
                  className="absolute inset-0 w-full h-full object-cover opacity-35"
                  loading="lazy"
                  decoding="async"
                  width={440}
                  height={160}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B2B26] via-[#0B2B26]/80 to-transparent" />
                <div className="relative z-10 space-y-1.5">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#8EB69B]/20 text-[#8EB69B] text-[10px] font-bold uppercase tracking-wider">
                    Today's Special
                  </span>
                  <h4 className="font-heading font-extrabold text-lg text-[#DAF1DE]">
                    {restaurant.offer}
                  </h4>
                  <button
                    onClick={() => setActiveTab('menu')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8EB69B] underline pt-1 cursor-pointer"
                  >
                    <span>Browse All Dishes</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MENU SCREEN */}
        {activeTab === 'menu' && (
          <div className="space-y-4">
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === 'All'
                    ? 'bg-[#8EB69B] text-[#051F20] shadow-md'
                    : 'bg-[#163832] text-[#DAF1DE]/80 border border-[#235347] hover:border-[#8EB69B]'
                }`}
              >
                All Dishes ({searchedItems.length})
              </button>
              {CATEGORIES.map((cat) => {
                const count = searchedItems.filter((i) => i.category === cat).length;
                const isSel = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSel
                        ? 'bg-[#8EB69B] text-[#051F20] shadow-md'
                        : 'bg-[#163832] text-[#DAF1DE]/80 border border-[#235347] hover:border-[#8EB69B]'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className="opacity-70 text-[10px]">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Dish List Cards with Memoized Rendering */}
            <div className="space-y-3">
              {categoryFilteredItems.length === 0 ? (
                <div className="glass-card p-8 text-center text-xs text-[#DAF1DE]/60 space-y-2">
                  <p>No dishes match your selected filter.</p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-xs font-bold text-[#8EB69B] underline cursor-pointer"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                categoryFilteredItems.map((dish) => (
                  <MemoizedDishCard
                    key={dish.id}
                    dish={dish}
                    inCartCount={cartQuantityMap.get(dish.id) || 0}
                    onOpenDetail={handleOpenDetail}
                    onAddToCart={addToCart}
                    currency={restaurant.currency || 'Rs.'}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: SPECIALS SCREEN */}
        {activeTab === 'specials' && (
          <div className="space-y-4">
            <div className="glass-card p-5 space-y-2 border border-[#8EB69B]/40 text-left">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8EB69B]">
                Exclusive Tasting
              </span>
              <h3 className="font-heading font-extrabold text-2xl text-[#DAF1DE]">
                Chef's Autumn Specials
              </h3>
              <p className="text-xs text-[#DAF1DE]/80 leading-relaxed">
                Handpicked dishes recommended by our executive chef, prepared with seasonal harvest specialties.
              </p>
            </div>

            <div className="space-y-3">
              {specialItems.map((dish) => (
                <div
                  key={`special-screen-${dish.id}`}
                  onClick={() => handleOpenDetail(dish)}
                  className="glass-card-interactive content-auto overflow-hidden p-4 space-y-3 cursor-pointer text-left"
                >
                  <div className="relative h-44 rounded-xl overflow-hidden border border-[#235347] aspect-video">
                    <img
                      src={getDishImage(dish, 800)}
                      alt={dish.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                      width={440}
                      height={176}
                    />
                    {dish.tag && (
                      <span className="absolute top-3 left-3 bg-[#8EB69B] text-[#051F20] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                        {dish.tag}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-heading font-extrabold text-lg text-[#DAF1DE]">
                        {dish.name}
                      </h4>
                      <span className="font-mono font-bold text-base text-[#8EB69B]">
                        {formatPrice(dish.price, restaurant.currency || 'Rs.')}
                      </span>
                    </div>
                    <p className="text-xs text-[#DAF1DE]/70 leading-relaxed">
                      {dish.description}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(dish);
                    }}
                    className="w-full min-h-[44px] py-2.5 rounded-full btn-primary text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Add to Order</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: REVIEWS SCREEN (Lazy Loaded) */}
        {activeTab === 'reviews' && (
          <Suspense
            fallback={
              <div className="p-8 text-center text-xs text-[#DAF1DE]/60">
                Loading verified reviews...
              </div>
            }
          >
            <ReviewsTab slug={restaurant.slug} ratings={ratings} />
          </Suspense>
        )}

        {/* TAB 5: ABOUT SCREEN */}
        {activeTab === 'about' && (
          <div className="space-y-5 text-left">
            <div className="glass-card p-5 space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8EB69B]">
                Culinary Philosophy
              </span>
              <h3 className="font-heading font-extrabold text-2xl text-[#DAF1DE]">
                About {restaurant.name}
              </h3>
              <p className="text-xs text-[#DAF1DE]/80 leading-relaxed">
                {restaurant.story ||
                  'Founded with an unrelenting pursuit of culinary innovation, we marry timeless gastronomy with artisanal ingredients sourced from local organic producers.'}
              </p>

              <div className="relative h-44 rounded-2xl overflow-hidden border border-[#235347] aspect-video">
                <img
                  src="/images/hero-1.webp"
                  alt="Atmosphere"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  width={440}
                  height={176}
                />
              </div>
            </div>

            <div className="glass-card p-5 space-y-3">
              <h4 className="font-heading font-bold text-base text-[#DAF1DE]">
                Operating Details
              </h4>
              <div className="space-y-2 text-xs text-[#DAF1DE]/80">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#8EB69B] shrink-0" />
                  <span>{restaurant.hours || 'Daily 11:30 AM – 11:00 PM'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#8EB69B] shrink-0" />
                  <span>{restaurant.address || 'Address provided upon request'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: CONTACT SCREEN */}
        {activeTab === 'contact' && (
          <div className="space-y-5 text-left">
            <div className="glass-card p-5 space-y-5">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8EB69B]">
                  Direct Hospitality
                </span>
                <h3 className="font-heading font-extrabold text-2xl text-[#DAF1DE]">
                  Contact & Location
                </h3>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                {restaurant.whatsapp && (
                  <a
                    href={`https://wa.me/${cleanPhoneNumber(restaurant.whatsapp)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] py-2.5 px-3 rounded-full btn-primary text-xs font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </a>
                )}

                {restaurant.whatsapp && (
                  <a
                    href={`tel:${cleanPhoneNumber(restaurant.whatsapp)}`}
                    className="min-h-[44px] py-2.5 px-3 rounded-full btn-secondary text-xs font-semibold flex items-center justify-center gap-2 hover:border-[#8EB69B] active:scale-95 transition-all cursor-pointer"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Staff</span>
                  </a>
                )}
              </div>

              {/* Address with Google Maps */}
              <div className="pt-3 border-t border-[#235347] space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-[#DAF1DE]">
                  <MapPin className="w-4 h-4 text-[#8EB69B]" />
                  <span>Restaurant Address</span>
                </div>
                <p className="text-xs text-[#DAF1DE]/70 pl-6 leading-relaxed">
                  {restaurant.address || '428 Mercer Street, New York, NY 10013'}
                </p>
                {restaurant.address && (
                  <div className="pl-6 pt-1">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        restaurant.address
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8EB69B] underline cursor-pointer"
                    >
                      <span>Open in Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Social Channels */}
              {(restaurant.instagram || restaurant.facebook) && (
                <div className="pt-3 border-t border-[#235347] space-y-2">
                  <span className="text-xs font-bold text-[#DAF1DE]">Social Connections</span>
                  <div className="flex flex-col gap-2">
                    {restaurant.instagram && (
                      <a
                        href={restaurant.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl bg-[#163832] border border-[#235347] text-xs text-[#DAF1DE] hover:border-[#8EB69B] cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Instagram className="w-4 h-4 text-[#8EB69B]" />
                          <span>Instagram</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#DAF1DE]/40" />
                      </a>
                    )}
                    {restaurant.facebook && (
                      <a
                        href={restaurant.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl bg-[#163832] border border-[#235347] text-xs text-[#DAF1DE] hover:border-[#8EB69B] cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Facebook className="w-4 h-4 text-[#8EB69B]" />
                          <span>Facebook</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#DAF1DE]/40" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Slim Sticky Bottom Cart Bar & Drawer */}
      <CartBarAndModal
        cart={cart}
        whatsappNumber={restaurant.whatsapp}
        restaurantName={restaurant.name}
        isOpen={isCartOpen}
        onOpen={() => setIsCartOpen(true)}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={updateQuantity}
        onClearCart={clearCart}
        currency={restaurant.currency || 'Rs.'}
      />

      {/* Dish Detail Sheet Modal (Lazy loaded when opened) */}
      {detailDish && (
        <Suspense fallback={null}>
          <DishDetailModal
            dish={detailDish}
            slug={restaurant.slug}
            onClose={() => setDetailDish(null)}
            onAddToCart={addToCart}
            currency={restaurant.currency || 'Rs.'}
          />
        </Suspense>
      )}

      {/* QR Scanner Modal (Lazy loaded only when user taps Scan QR) */}
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
