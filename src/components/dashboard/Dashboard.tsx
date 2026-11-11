import React, { useState, useEffect, useRef, useMemo } from 'react';
import QRCode from 'qrcode';
import {
  type Restaurant,
  type MenuItem,
  type MenuCategory,
  type ItemTag,
  type DashboardTab,
  type RatingReview,
} from '../../types';
import {
  getOwnerRestaurant,
  saveRestaurant,
  checkSlugAvailable,
  DEMO_RESTAURANT,
} from '../../services/restaurantService';
import {
  subscribeToRatings,
  deleteRating,
} from '../../services/ratingService';
import {
  CATEGORIES,
  getDishImage,
  generateSlug,
  formatPrice,
  cleanPhoneNumber,
  CURRENCY_OPTIONS,
} from '../../utils/formatters';
import { compressImage, uploadToCloudinary } from '../../utils/imageUpload';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import { CustomerMenu } from '../customer/CustomerMenu';
import {
  Sliders,
  UtensilsCrossed,
  Eye,
  QrCode,
  Star,
  Plus,
  Edit2,
  Trash2,
  Check,
  Copy,
  Download,
  Share2,
  ExternalLink,
  Save,
  AlertCircle,
  X,
  Upload,
  Loader2,
  User,
  LogOut,
  HelpCircle,
  Settings,
  ChevronDown,
  Coins,
} from 'lucide-react';

const ITEM_TAGS: ItemTag[] = ['Bestseller', "Chef's pick", 'Popular'];

interface Props {
  onOpenFirebaseConfig: () => void;
}

export function Dashboard({ onOpenFirebaseConfig }: Props) {
  const { user, logout } = useAuth();
  const { navigate } = useRouter();

  const [activeTab, setActiveTab] = useState<DashboardTab>('setup');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Restaurant state
  const [restaurant, setRestaurant] = useState<Restaurant>({
    slug: '',
    ownerUid: user?.uid || 'temp-owner',
    name: '',
    currency: 'Rs.',
    whatsapp: '',
    offer: '',
    address: '',
    hours: '',
    instagram: '',
    facebook: '',
    heroImage: '/images/hero-1.webp',
    story: '',
    items: [],
  });

  const [originalSlug, setOriginalSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Ratings for Owner Reviews tab
  const [ratings, setRatings] = useState<RatingReview[]>([]);

  // Hero upload
  const [uploadingHero, setUploadingHero] = useState(false);
  const [heroUploadError, setHeroUploadError] = useState<string | null>(null);

  // Dish modal state
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [editingDishId, setEditingDishId] = useState<string | null>(null);
  const [uploadingDishPhoto, setUploadingDishPhoto] = useState(false);
  const [dishPhotoError, setDishPhotoError] = useState<string | null>(null);

  const [dishForm, setDishForm] = useState<{
    name: string;
    description: string;
    price: string;
    category: MenuCategory;
    tag: ItemTag;
    image?: string;
    ingredientsStr: string;
    prepTime: string;
    spicy: number;
    sweet: number;
    savory: number;
    tangy: number;
    available: boolean;
  }>({
    name: '',
    description: '',
    price: '',
    category: 'Main',
    tag: '',
    image: '',
    ingredientsStr: '',
    prepTime: '',
    spicy: 2,
    sweet: 1,
    savory: 4,
    tangy: 1,
    available: true,
  });

  const [dishCategoryFilter, setDishCategoryFilter] = useState<string>('All');
  const [dishStatusFilter, setDishStatusFilter] = useState<'All' | 'Active' | 'Paused'>('All');

  // QR Code canvas ref
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [shared, setShared] = useState(false);

  // Lock body scroll when dish modal is open
  useEffect(() => {
    if (!isDishModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isDishModalOpen]);

  // Ref to track if we already loaded data for this user to avoid re-fetching on typing or minor re-renders
  const loadedOwnerUidRef = useRef<string | null>(null);

  // Load owner's restaurant once per user session
  useEffect(() => {
    async function loadData() {
      if (!user) {
        setLoading(false);
        return;
      }

      // Do not re-fetch if we already loaded this user's data; prevents resetting user input fields
      if (loadedOwnerUidRef.current === user.uid) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const existing = await getOwnerRestaurant(user.uid);
        if (existing) {
          setRestaurant({
            ...existing,
            currency: (!existing.currency || existing.currency === '$') ? 'Rs.' : existing.currency,
          });
          setOriginalSlug(existing.slug);
          setSlugManuallyEdited(true);
        } else {
          const defaultName = user.displayName ? `${user.displayName}'s Restaurant` : 'My Restaurant';
          const defaultSlug = generateSlug(defaultName) || `menu-${user.uid.slice(0, 6)}`;
          setRestaurant({
            slug: defaultSlug,
            ownerUid: user.uid,
            name: defaultName,
            currency: 'Rs.',
            whatsapp: '',
            offer: 'Welcome! Complimentary dessert on orders over Rs. 40',
            address: '',
            hours: 'Daily: 11:30 AM – 11:00 PM',
            instagram: '',
            facebook: '',
            heroImage: '/images/hero-1.webp',
            story: '',
            items: DEMO_RESTAURANT.items.map((i) => ({
              ...i,
              id: `dish-${Math.random().toString(36).slice(2, 9)}`,
              available: true,
            })),
          });
          setOriginalSlug(defaultSlug);
        }
        loadedOwnerUidRef.current = user.uid;
      } catch (err) {
        console.error('Failed to load restaurant:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user?.uid]);

  // Subscribe to ratings for Reviews tab
  useEffect(() => {
    if (!originalSlug || activeTab !== 'reviews') return;
    const unsub = subscribeToRatings(originalSlug, (data) => {
      setRatings(data);
    });
    return () => unsub();
  }, [originalSlug, activeTab]);

  // Generate QR code when on QR tab
  const menuUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/r/${restaurant.slug || 'my-menu'}`
    : `https://menuqr.app/r/${restaurant.slug || 'my-menu'}`;

  useEffect(() => {
    if (activeTab === 'qr' && qrCanvasRef.current && restaurant.slug) {
      QRCode.toCanvas(
        qrCanvasRef.current,
        menuUrl,
        {
          width: 250,
          margin: 2,
          color: {
            dark: '#051F20',
            light: '#DAF1DE',
          },
        },
        (err) => {
          if (err) console.error('QR generation error:', err);
        }
      );
    }
  }, [activeTab, restaurant.slug, menuUrl]);

  const handleNameChange = (name: string) => {
    setRestaurant((prev) => {
      const updated: Restaurant = { ...prev, name };
      if (!slugManuallyEdited || !prev.slug) {
        updated.slug = generateSlug(name);
      }
      return updated;
    });
  };

  const handleHeroPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingHero(true);
    setHeroUploadError(null);

    try {
      const compressed = await compressImage(file, 1200, 800, 0.85);
      const res = await uploadToCloudinary(compressed);
      setRestaurant((prev) => ({ ...prev, heroImage: res.url }));
      setStatusMessage({ type: 'success', text: 'Hero photo updated! Click Save Settings.' });
    } catch (err: any) {
      setHeroUploadError(err?.message || 'Upload failed.');
    } finally {
      setUploadingHero(false);
    }
  };

  const handleSaveSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant.name.trim() || !restaurant.slug.trim()) {
      setStatusMessage({ type: 'error', text: 'Restaurant name and URL slug are required.' });
      return;
    }

    setSaving(true);
    setStatusMessage(null);

    try {
      const cleanSlug = generateSlug(restaurant.slug);
      if (!cleanSlug || cleanSlug.length < 2) {
        setStatusMessage({ type: 'error', text: 'Please enter a valid slug (at least 2 letters or numbers).' });
        setSaving(false);
        return;
      }

      // Check slug uniqueness only if changed
      if (cleanSlug !== originalSlug) {
        const available = await checkSlugAvailable(cleanSlug, user?.uid);
        if (!available) {
          setStatusMessage({ type: 'error', text: `Slug "${cleanSlug}" is already taken by another restaurant.` });
          setSaving(false);
          return;
        }
      }

      const updated: Restaurant = {
        ...restaurant,
        slug: cleanSlug,
        ownerUid: user?.uid || restaurant.ownerUid,
      };

      await saveRestaurant(updated, originalSlug);
      setRestaurant(updated);
      setOriginalSlug(cleanSlug);
      setStatusMessage({ type: 'success', text: 'Restaurant settings saved to database successfully!' });
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err: any) {
      console.error('Save setup failed:', err);
      setStatusMessage({ type: 'error', text: err?.message || 'Save failed. Please check your connection.' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDishAvailability = async (id: string) => {
    const updatedItems = restaurant.items.map((i) =>
      i.id === id ? { ...i, available: i.available === false } : i
    );
    const updated = { ...restaurant, items: updatedItems };
    setRestaurant(updated);

    try {
      await saveRestaurant(updated, originalSlug);
      const targetDish = updatedItems.find((i) => i.id === id);
      setStatusMessage({
        type: 'success',
        text: `"${targetDish?.name}" is now ${targetDish?.available !== false ? 'Available' : 'Paused / Out of stock'}.`,
      });
      setTimeout(() => setStatusMessage(null), 2500);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to update dish availability.' });
    }
  };

  // Dish modal handlers
  const handleOpenAddDish = () => {
    setEditingDishId(null);
    setDishPhotoError(null);
    setDishForm({
      name: '',
      description: '',
      price: '',
      category: 'Main',
      tag: '',
      image: '',
      ingredientsStr: '',
      prepTime: '15-20 mins',
      spicy: 2,
      sweet: 1,
      savory: 4,
      tangy: 1,
      available: true,
    });
    setIsDishModalOpen(true);
  };

  const handleOpenEditDish = (dish: MenuItem) => {
    setEditingDishId(dish.id);
    setDishPhotoError(null);
    setDishForm({
      name: dish.name,
      description: dish.description,
      price: dish.price.toString(),
      category: dish.category,
      tag: dish.tag || '',
      image: dish.image || '',
      ingredientsStr: dish.ingredients ? dish.ingredients.join(', ') : '',
      prepTime: dish.prepTime || '15-20 mins',
      spicy: dish.flavors?.spicy ?? 2,
      sweet: dish.flavors?.sweet ?? 1,
      savory: dish.flavors?.savory ?? 4,
      tangy: dish.flavors?.tangy ?? 1,
      available: dish.available !== false,
    });
    setIsDishModalOpen(true);
  };

  const handleDishPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDishPhoto(true);
    setDishPhotoError(null);

    try {
      const compressed = await compressImage(file, 900, 900, 0.82);
      const res = await uploadToCloudinary(compressed);
      setDishForm((prev) => ({ ...prev, image: res.url }));
    } catch (err: any) {
      setDishPhotoError(err?.message || 'Upload failed.');
    } finally {
      setUploadingDishPhoto(false);
    }
  };

  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishForm.name.trim()) return;

    const parsedPrice = parseFloat(dishForm.price) || 0;
    const parsedIngredients = dishForm.ingredientsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    let updatedItems: MenuItem[] = [];

    if (editingDishId) {
      updatedItems = restaurant.items.map((i) =>
        i.id === editingDishId
          ? {
              ...i,
              name: dishForm.name.trim(),
              description: dishForm.description.trim(),
              price: parsedPrice,
              category: dishForm.category,
              tag: dishForm.tag,
              image: dishForm.image?.trim() || undefined,
              ingredients: parsedIngredients.length > 0 ? parsedIngredients : undefined,
              prepTime: dishForm.prepTime.trim() || undefined,
              flavors: {
                spicy: dishForm.spicy,
                sweet: dishForm.sweet,
                savory: dishForm.savory,
                tangy: dishForm.tangy,
              },
              available: dishForm.available,
            }
          : i
      );
    } else {
      const newDish: MenuItem = {
        id: `dish-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: dishForm.name.trim(),
        description: dishForm.description.trim(),
        price: parsedPrice,
        category: dishForm.category,
        tag: dishForm.tag,
        image: dishForm.image?.trim() || undefined,
        ingredients: parsedIngredients.length > 0 ? parsedIngredients : undefined,
        prepTime: dishForm.prepTime.trim() || undefined,
        flavors: {
          spicy: dishForm.spicy,
          sweet: dishForm.sweet,
          savory: dishForm.savory,
          tangy: dishForm.tangy,
        },
        rating: 4.8,
        ratingCount: 1,
        available: dishForm.available,
      };
      updatedItems = [...restaurant.items, newDish];
    }

    const updatedRestaurant = { ...restaurant, items: updatedItems };
    setRestaurant(updatedRestaurant);
    setIsDishModalOpen(false);

    try {
      await saveRestaurant(updatedRestaurant, originalSlug);
      setStatusMessage({ type: 'success', text: editingDishId ? 'Dish updated!' : 'New dish added!' });
      setTimeout(() => setStatusMessage(null), 2500);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Error: ' + err.message });
    }
  };

  const handleDeleteDish = async (id: string) => {
    const dishToDelete = restaurant.items.find((i) => i.id === id);
    if (!dishToDelete) return;
    if (!confirm(`Delete "${dishToDelete.name}"?`)) return;

    const updatedItems = restaurant.items.filter((i) => i.id !== id);
    const updated = { ...restaurant, items: updatedItems };
    setRestaurant(updated);

    try {
      await saveRestaurant(updated, originalSlug);
      setStatusMessage({ type: 'success', text: `Deleted "${dishToDelete.name}".` });
      setTimeout(() => setStatusMessage(null), 2000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      await deleteRating(restaurant.slug, reviewId);
      setRatings((prev) => prev.filter((r) => r.id !== reviewId));
      setStatusMessage({ type: 'success', text: 'Review removed.' });
      setTimeout(() => setStatusMessage(null), 2000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Failed to delete review: ' + err.message });
    }
  };

  const handleDownloadQr = () => {
    if (!qrCanvasRef.current) return;
    const url = qrCanvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.download = `menuqr-${restaurant.slug || 'menu'}.png`;
    a.href = url;
    a.click();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(menuUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: restaurant.name,
          text: `Check out our digital menu on MenuQR`,
          url: menuUrl,
        });
      } catch {}
    } else {
      handleCopyLink();
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  const displayedDishes = useMemo(() => {
    return restaurant.items.filter((i) => {
      const matchCat = dishCategoryFilter === 'All' || i.category === dishCategoryFilter;
      const matchStatus =
        dishStatusFilter === 'All'
          ? true
          : dishStatusFilter === 'Active'
          ? i.available !== false
          : i.available === false;
      return matchCat && matchStatus;
    });
  }, [restaurant.items, dishCategoryFilter, dishStatusFilter]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-3">
        <div className="w-6 h-6 border-2 border-[#8EB69B] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-[#DAF1DE]/60 font-mono">Loading owner dashboard...</p>
      </div>
    );
  }

  const navTabs: { id: DashboardTab; label: string; icon: any }[] = [
    { id: 'setup', label: 'Setup', icon: Sliders },
    { id: 'dishes', label: 'Dishes', icon: UtensilsCrossed },
    { id: 'preview', label: 'Preview', icon: Eye },
    { id: 'qr', label: 'QR & Share', icon: QrCode },
    { id: 'reviews', label: 'Reviews', icon: Star },
  ];

  return (
    <div className="flex-1 flex flex-col relative w-full overflow-x-hidden min-h-dvh pb-24">
      {/* Top Bar with Labelled Profile Menu */}
      <header className="sticky top-0 z-40 bg-[#051F20]/95 backdrop-blur-md border-b border-[#235347] w-full">
        <div className="max-w-[480px] mx-auto px-4 py-3 flex items-center justify-between gap-2">
          {/* Brand */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="w-8 h-8 rounded-full bg-[#163832] border border-[#235347] flex items-center justify-center text-[#8EB69B] font-extrabold text-xs">
              QR
            </div>
            <h1 className="font-heading font-extrabold text-base text-[#DAF1DE] tracking-wide">
              {restaurant.name || 'Owner Dashboard'}
            </h1>
          </div>

          {/* Labelled Profile Menu: Avatar + Name / Email */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#163832] border border-[#235347] hover:border-[#8EB69B] transition-colors cursor-pointer text-[#DAF1DE]"
            >
              <div className="w-6 h-6 rounded-full bg-[#8EB69B] text-[#051F20] font-bold text-xs flex items-center justify-center">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'O'}
              </div>
              <span className="text-xs font-semibold max-w-[80px] truncate hidden sm:inline">
                {user?.displayName || user?.email?.split('@')[0] || 'Account'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8EB69B]" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0B2B26] border border-[#235347] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                <div className="p-2 border-b border-[#235347] space-y-0.5">
                  <p className="font-bold text-[#DAF1DE] truncate">{user?.displayName || 'Restaurant Owner'}</p>
                  <p className="text-[10px] text-[#DAF1DE]/60 truncate font-mono">{user?.email}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenFirebaseConfig();
                    }}
                    className="w-full px-3 py-2 text-left rounded-lg hover:bg-[#163832] text-[#DAF1DE] flex items-center gap-2.5 cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-[#8EB69B]" />
                    <span>Firebase Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      window.open('https://wa.me/', '_blank');
                    }}
                    className="w-full px-3 py-2 text-left rounded-lg hover:bg-[#163832] text-[#DAF1DE] flex items-center gap-2.5 cursor-pointer"
                  >
                    <HelpCircle className="w-4 h-4 text-[#8EB69B]" />
                    <span>Help & Guidance</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-[#235347]">
                  <button
                    onClick={async () => {
                      setShowProfileMenu(false);
                      await logout();
                      navigate('/');
                    }}
                    className="w-full px-3 py-2 text-left rounded-lg hover:bg-red-500/20 text-red-300 font-semibold flex items-center gap-2.5 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-red-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Clearly Visible Top Tab Bar with Icon + Text Label */}
        <div className="max-w-[480px] mx-auto px-2 overflow-x-auto no-scrollbar border-t border-[#235347]/60">
          <div className="flex items-center space-x-1 py-1.5 min-w-max">
            {navTabs.map((t) => {
              const Icon = t.icon;
              const isSel = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                    isSel
                      ? 'bg-[#163832] text-[#8EB69B] border border-[#8EB69B]/40 shadow-xs'
                      : 'text-[#DAF1DE]/60 hover:text-[#DAF1DE] hover:bg-[#163832]/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Global Status Banner */}
      {statusMessage && (
        <div
          className={`px-4 py-2 text-xs flex items-center gap-2 border-b ${
            statusMessage.type === 'success'
              ? 'bg-[#163832] text-[#8EB69B] border-[#8EB69B]/30'
              : 'bg-red-950/70 text-red-200 border-red-500/30'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <Check className="w-4 h-4 text-[#8EB69B] shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Content View per Tab */}
      <main className="w-full max-w-[480px] mx-auto px-4 py-4 flex-1 overflow-x-hidden">
        {/* ========================================================================= */}
        {/* 1. SETUP TAB                                                              */}
        {/* ========================================================================= */}
        {activeTab === 'setup' && (
          <form onSubmit={handleSaveSetup} className="space-y-4">
            <div className="glass-card p-4 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8EB69B]">
                Restaurant Media
              </span>
              <div className="relative h-32 rounded-xl overflow-hidden bg-[#051F20] border border-[#235347]">
                <img
                  src={restaurant.heroImage || '/images/hero-1.webp'}
                  alt="Hero Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <label className="px-4 py-2 rounded-full btn-primary text-xs font-bold cursor-pointer shadow-lg flex items-center gap-2">
                    {uploadingHero ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#051F20]" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span>{uploadingHero ? 'Compressing...' : 'Upload Hero Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleHeroPhotoUpload}
                      disabled={uploadingHero}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              {heroUploadError && <p className="text-[11px] text-red-400">{heroUploadError}</p>}
            </div>

            {/* Profile Fields */}
            <div className="glass-card p-4 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#DAF1DE]">Restaurant Name *</label>
                <input
                  type="text"
                  required
                  value={restaurant.name ?? ''}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Bistro Noir"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#163832] border border-[#235347] text-xs text-[#DAF1DE] placeholder:text-[#DAF1DE]/40 focus:outline-hidden focus:border-[#8EB69B] focus:ring-1 focus:ring-[#8EB69B]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#DAF1DE]">URL Slug *</label>
                <div className="flex items-center rounded-xl bg-[#163832] border border-[#235347] overflow-hidden focus-within:border-[#8EB69B] focus-within:ring-1 focus-within:ring-[#8EB69B]">
                  <span className="pl-3 pr-1 text-xs text-[#DAF1DE]/50 font-mono">/r/</span>
                  <input
                    type="text"
                    required
                    value={restaurant.slug ?? ''}
                    onChange={(e) => {
                      setSlugManuallyEdited(true);
                      const live = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                      setRestaurant((prev) => ({ ...prev, slug: live }));
                    }}
                    onBlur={() => {
                      if (restaurant.slug) {
                        setRestaurant((prev) => ({ ...prev, slug: generateSlug(prev.slug) }));
                      }
                    }}
                    placeholder="my-bistro"
                    className="w-full pr-3 py-2.5 text-xs text-[#DAF1DE] font-mono focus:outline-hidden bg-transparent placeholder:text-[#DAF1DE]/30"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#DAF1DE]">
                  WhatsApp Number * (Country code + phone)
                </label>
                <input
                  type="text"
                  required
                  value={restaurant.whatsapp ?? ''}
                  onChange={(e) => setRestaurant((prev) => ({ ...prev, whatsapp: e.target.value }))}
                  placeholder="e.g. 14155552671"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#163832] border border-[#235347] text-xs text-[#DAF1DE] font-mono placeholder:text-[#DAF1DE]/40 focus:outline-hidden focus:border-[#8EB69B] focus:ring-1 focus:ring-[#8EB69B]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#DAF1DE]">Promotional Offer Banner</label>
                <input
                  type="text"
                  value={restaurant.offer ?? ''}
                  onChange={(e) => setRestaurant((prev) => ({ ...prev, offer: e.target.value }))}
                  placeholder="e.g. Chef's Autumn Tasting Menu · Complimentary dessert with orders over Rs. 45"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#163832] border border-[#235347] text-xs text-[#DAF1DE] placeholder:text-[#DAF1DE]/40 focus:outline-hidden focus:border-[#8EB69B] focus:ring-1 focus:ring-[#8EB69B]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#DAF1DE]">Our Story Narrative</label>
                <textarea
                  rows={3}
                  value={restaurant.story ?? ''}
                  onChange={(e) => setRestaurant((prev) => ({ ...prev, story: e.target.value }))}
                  placeholder="Tell your guests about your heritage, chefs, and sustainable farm sourcing..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#163832] border border-[#235347] text-xs text-[#DAF1DE] placeholder:text-[#DAF1DE]/40 focus:outline-hidden focus:border-[#8EB69B] focus:ring-1 focus:ring-[#8EB69B] resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#DAF1DE]">Physical Address</label>
                <input
                  type="text"
                  value={restaurant.address ?? ''}
                  onChange={(e) => setRestaurant((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="e.g. 428 Mercer Street, New York, NY 10013"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#163832] border border-[#235347] text-xs text-[#DAF1DE] placeholder:text-[#DAF1DE]/40 focus:outline-hidden focus:border-[#8EB69B] focus:ring-1 focus:ring-[#8EB69B]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#DAF1DE]">Opening Hours</label>
                <input
                  type="text"
                  value={restaurant.hours ?? ''}
                  onChange={(e) => setRestaurant((prev) => ({ ...prev, hours: e.target.value }))}
                  placeholder="e.g. Daily: 11:30 AM – 11:00 PM"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#163832] border border-[#235347] text-xs text-[#DAF1DE] placeholder:text-[#DAF1DE]/40 focus:outline-hidden focus:border-[#8EB69B] focus:ring-1 focus:ring-[#8EB69B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#DAF1DE]">Instagram Link</label>
                  <input
                    type="text"
                    value={restaurant.instagram ?? ''}
                    onChange={(e) => setRestaurant((prev) => ({ ...prev, instagram: e.target.value }))}
                    placeholder="https://instagram.com/..."
                    className="w-full px-3 py-2 rounded-xl bg-[#163832] border border-[#235347] text-xs text-[#DAF1DE] placeholder:text-[#DAF1DE]/40 focus:outline-hidden focus:border-[#8EB69B]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#DAF1DE]">Facebook Link</label>
                  <input
                    type="text"
                    value={restaurant.facebook ?? ''}
                    onChange={(e) => setRestaurant((prev) => ({ ...prev, facebook: e.target.value }))}
                    placeholder="https://facebook.com/..."
                    className="w-full px-3 py-2 rounded-xl bg-[#163832] border border-[#235347] text-xs text-[#DAF1DE] placeholder:text-[#DAF1DE]/40 focus:outline-hidden focus:border-[#8EB69B]"
                  />
                </div>
              </div>
            </div>

            {/* Money / Currency Section */}
            <div className="glass-card p-4 space-y-3.5 border border-[#235347]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#163832] border border-[#235347] flex items-center justify-center text-[#8EB69B]">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#8EB69B]">
                      Money & Currency
                    </span>
                    <h3 className="font-heading font-extrabold text-base text-[#DAF1DE]">
                      Pricing Currency
                    </h3>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-[#163832] border border-[#235347] text-xs font-mono font-bold text-[#8EB69B]">
                  Active: {restaurant.currency || 'Rs.'}
                </div>
              </div>

              <p className="text-xs text-[#DAF1DE]/70 leading-relaxed">
                Choose your menu currency. All dish prices, cart totals, and WhatsApp orders will display in this currency. Default is Pakistani Rupees (Rs.).
              </p>

              {/* Fast Pick Pills with Rs. (Pakistani Rupees) featured first */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-[#DAF1DE]/80 uppercase tracking-wider">
                  Select Currency
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '🇵🇰 Pakistani Rupees (Rs.)', symbol: 'Rs.' },
                    { label: '🇮🇳 Indian Rupee (₹)', symbol: '₹' },
                    { label: '🇦🇪 UAE Dirham (AED)', symbol: 'AED' },
                    { label: '🇸🇦 Saudi Riyal (SAR)', symbol: 'SAR' },
                    { label: '🇬🇧 British Pound (£)', symbol: '£' },
                    { label: '🇪🇺 Euro (€)', symbol: '€' },
                  ].map((preset) => {
                    const isSelected = (restaurant.currency || 'Rs.').trim() === preset.symbol;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setRestaurant((prev) => ({ ...prev, currency: preset.symbol }))}
                        className={`min-h-[36px] px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-[#8EB69B] text-[#051F20] border-[#8EB69B] shadow-sm ring-1 ring-[#8EB69B]'
                            : 'bg-[#163832] text-[#DAF1DE]/80 border-[#235347] hover:border-[#8EB69B]'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* All Countries Dropdown Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#DAF1DE]">
                  All Countries & Currencies List
                </label>
                <select
                  value={
                    CURRENCY_OPTIONS.find((c) => c.symbol === (restaurant.currency || 'Rs.'))?.code || 'custom'
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    const match = CURRENCY_OPTIONS.find((c) => c.code === val);
                    if (match) {
                      setRestaurant((prev) => ({ ...prev, currency: match.symbol }));
                    }
                  }}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#163832] border border-[#235347] text-xs text-[#DAF1DE] focus:outline-hidden focus:border-[#8EB69B] cursor-pointer"
                >
                  <optgroup label="🇵🇰 / 🇮🇳 Rupees & South Asia" className="bg-[#0B2B26] text-[#8EB69B] font-bold">
                    <option value="PKR" className="bg-[#0B2B26] text-[#DAF1DE]">
                      🇵🇰 Pakistan — Pakistani Rupee (Rs.)
                    </option>
                    <option value="INR-RS" className="bg-[#0B2B26] text-[#DAF1DE]">
                      🇮🇳 India & South Asia — Rupees (Rs.)
                    </option>
                    <option value="INR" className="bg-[#0B2B26] text-[#DAF1DE]">
                      🇮🇳 India — Indian Rupee (₹)
                    </option>
                    <option value="NPR" className="bg-[#0B2B26] text-[#DAF1DE]">
                      🇳🇵 Nepal — Nepalese Rupee (Rs.)
                    </option>
                    <option value="LKR" className="bg-[#0B2B26] text-[#DAF1DE]">
                      🇱🇰 Sri Lanka — Sri Lankan Rupee (Rs.)
                    </option>
                    <option value="BDT" className="bg-[#0B2B26] text-[#DAF1DE]">
                      🇧🇩 Bangladesh — Bangladeshi Taka (৳)
                    </option>
                  </optgroup>
                  <optgroup label="🌍 Global Currencies" className="bg-[#0B2B26] text-[#8EB69B] font-bold">
                    {CURRENCY_OPTIONS.filter(
                      (c) => !['PKR', 'INR-RS', 'INR', 'NPR', 'LKR', 'BDT', 'USD'].includes(c.code)
                    ).map((c) => (
                      <option key={c.code} value={c.code} className="bg-[#0B2B26] text-[#DAF1DE]">
                        {c.flag} {c.country} — {c.name} ({c.symbol})
                      </option>
                    ))}
                  </optgroup>
                  <option value="custom" className="bg-[#0B2B26] text-[#8EB69B]">
                    ✏️ Custom / Type Your Own Symbol (Rs., R.s, etc.)
                  </option>
                </select>
              </div>

              {/* Custom Symbol / Code Input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#DAF1DE]">
                  Custom Currency Display (e.g. "Rs." or "R.s")
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={restaurant.currency ?? 'Rs.'}
                    onChange={(e) => setRestaurant((prev) => ({ ...prev, currency: e.target.value }))}
                    placeholder="e.g. Rs., R.s, ₹, AED"
                    maxLength={15}
                    className="flex-1 min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#163832] border border-[#235347] text-xs text-[#DAF1DE] font-mono font-bold focus:outline-hidden focus:border-[#8EB69B] focus:ring-1 focus:ring-[#8EB69B]"
                  />
                  <div className="px-3 py-2.5 rounded-xl bg-[#163832] border border-[#235347] text-xs font-mono font-bold text-[#8EB69B] shrink-0">
                    Example: {formatPrice(1500, restaurant.currency || 'Rs.')}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 rounded-full btn-primary text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xl active:scale-[0.99] transition-all cursor-pointer"
            >
              {saving ? (
                <span>Saving to Database...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Restaurant Settings</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ========================================================================= */}
        {/* 2. DISHES TAB                                                             */}
        {/* ========================================================================= */}
        {activeTab === 'dishes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="font-heading font-extrabold text-xl text-[#DAF1DE]">Dishes & Recipes</h3>
                <p className="text-xs text-[#DAF1DE]/60">{restaurant.items.length} total menu dishes</p>
              </div>
              <button
                onClick={handleOpenAddDish}
                className="py-2.5 px-4 rounded-full btn-primary text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Dish</span>
              </button>
            </div>

            {/* Status breakdown & filter cards */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDishStatusFilter('All')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  dishStatusFilter === 'All'
                    ? 'bg-[#163832] border-[#8EB69B] shadow-sm'
                    : 'bg-[#0B2B26] border-[#235347] hover:border-[#8EB69B]/50'
                }`}
              >
                <div className="text-[10px] text-[#DAF1DE]/60 font-semibold uppercase tracking-wider">All Dishes</div>
                <div className="text-base sm:text-lg font-heading font-extrabold text-[#DAF1DE]">
                  {restaurant.items.length}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDishStatusFilter('Active')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  dishStatusFilter === 'Active'
                    ? 'bg-[#163832] border-[#8EB69B] shadow-sm'
                    : 'bg-[#0B2B26] border-[#235347] hover:border-[#8EB69B]/50'
                }`}
              >
                <div className="text-[10px] text-[#8EB69B] font-semibold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8EB69B]" /> In Menu
                </div>
                <div className="text-base sm:text-lg font-heading font-extrabold text-[#8EB69B]">
                  {restaurant.items.filter((i) => i.available !== false).length}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDishStatusFilter('Paused')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  dishStatusFilter === 'Paused'
                    ? 'bg-[#163832] border-amber-400 shadow-sm'
                    : 'bg-[#0B2B26] border-[#235347] hover:border-[#8EB69B]/50'
                }`}
              >
                <div className="text-[10px] text-amber-300/80 font-semibold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Paused
                </div>
                <div className="text-base sm:text-lg font-heading font-extrabold text-amber-300">
                  {restaurant.items.filter((i) => i.available === false).length}
                </div>
              </button>
            </div>

            {/* Category Filter pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <button
                onClick={() => setDishCategoryFilter('All')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                  dishCategoryFilter === 'All'
                    ? 'bg-[#8EB69B] text-[#051F20]'
                    : 'bg-[#163832] text-[#DAF1DE]/80 border border-[#235347]'
                }`}
              >
                All Categories ({restaurant.items.length})
              </button>
              {CATEGORIES.map((cat) => {
                const count = restaurant.items.filter((i) => i.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setDishCategoryFilter(cat)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                      dishCategoryFilter === cat
                        ? 'bg-[#8EB69B] text-[#051F20]'
                        : 'bg-[#163832] text-[#DAF1DE]/80 border border-[#235347]'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className="opacity-70 text-[10px]">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Dishes list */}
            <div className="space-y-3">
              {displayedDishes.length === 0 ? (
                <div className="glass-card p-8 text-center space-y-2">
                  <p className="text-sm font-semibold text-[#DAF1DE]">No dishes match your filter.</p>
                  <p className="text-xs text-[#DAF1DE]/50">
                    Switch to "All Dishes" or add a new dish to get started.
                  </p>
                </div>
              ) : (
                displayedDishes.map((dish: MenuItem) => (
                  <div
                    key={dish.id}
                    className={`glass-card p-3.5 flex items-center gap-3 transition-opacity ${
                      dish.available === false ? 'opacity-75 bg-[#0B2B26]/80' : ''
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={getDishImage(dish)}
                        alt={dish.name}
                        className="w-16 h-16 rounded-xl object-cover border border-[#235347]"
                      />
                      {dish.available === false && (
                        <span className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center text-[9px] font-bold text-amber-300 uppercase tracking-wider">
                          Paused
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-heading font-bold text-sm text-[#DAF1DE] truncate">{dish.name}</h4>
                        {dish.tag && (
                          <span className="px-2 py-0.5 rounded-full bg-[#163832] text-[9px] font-bold text-[#8EB69B] border border-[#235347]">
                            {dish.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#DAF1DE]/60 line-clamp-1">{dish.description}</p>
                      <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                        <span className="text-xs font-bold text-[#8EB69B] font-mono">
                          {formatPrice(dish.price, restaurant.currency || 'Rs.')}
                        </span>
                        <span className="text-[10px] text-[#DAF1DE]/40">· {dish.category}</span>
                        {/* Responsive Keep/Pause Toggle Pill */}
                        <button
                          type="button"
                          onClick={() => handleToggleDishAvailability(dish.id)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all border cursor-pointer ${
                            dish.available !== false
                              ? 'bg-[#8EB69B]/15 text-[#8EB69B] border-[#8EB69B]/40 hover:bg-[#8EB69B]/30'
                              : 'bg-amber-400/10 text-amber-300 border-amber-400/40 hover:bg-amber-400/20'
                          }`}
                          title={dish.available !== false ? 'Click to pause / hide from menu' : 'Click to keep / show in menu'}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              dish.available !== false ? 'bg-[#8EB69B]' : 'bg-amber-400'
                            }`}
                          />
                          <span>{dish.available !== false ? 'In Menu' : 'Paused (Hidden)'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEditDish(dish)}
                        className="w-10 h-10 rounded-full bg-[#163832] border border-[#235347] flex items-center justify-center text-[#DAF1DE] hover:border-[#8EB69B] active:scale-95 transition-all cursor-pointer"
                        aria-label={`Edit ${dish.name}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDish(dish.id)}
                        className="w-10 h-10 rounded-full bg-[#163832] border border-[#235347] flex items-center justify-center text-red-300 hover:border-red-400 active:scale-95 transition-all cursor-pointer"
                        aria-label={`Delete ${dish.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. PREVIEW TAB                                                            */}
        {/* ========================================================================= */}
        {activeTab === 'preview' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-[#163832] border border-[#235347] flex items-center justify-between text-xs">
              <span className="font-bold text-[#DAF1DE]">Live Customer View (Synced)</span>
              <a
                href={menuUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8EB69B] underline font-semibold flex items-center gap-1"
              >
                <span>Open in New Tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <CustomerMenu
              slug={restaurant.slug}
              previewRestaurant={restaurant}
              isPreview={true}
              onOpenFirebaseConfig={onOpenFirebaseConfig}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. QR & SHARE TAB (Big visible buttons!)                                   */}
        {/* ========================================================================= */}
        {activeTab === 'qr' && (
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <h3 className="font-heading font-extrabold text-2xl text-[#DAF1DE]">
                Scan & Share Your Menu
              </h3>
              <p className="text-xs text-[#DAF1DE]/70">
                Point any smartphone camera to view your digital menu instantly.
              </p>
            </div>

            {/* Canvas Card */}
            <div className="glass-card p-6 flex flex-col items-center justify-center space-y-4">
              <div className="p-4 bg-[#DAF1DE] rounded-2xl shadow-xl border border-[#235347]">
                <canvas ref={qrCanvasRef} className="rounded-lg" />
              </div>

              <div className="text-center space-y-1">
                <p className="font-heading font-extrabold text-base text-[#DAF1DE]">{restaurant.name}</p>
                <p className="text-xs font-mono text-[#8EB69B] select-all break-all">{menuUrl}</p>
              </div>

              {/* Big Visible Action Buttons */}
              <div className="w-full flex flex-col gap-2.5 pt-2">
                <button
                  onClick={handleDownloadQr}
                  className="w-full py-4 rounded-full btn-primary text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download QR Code (High-Res PNG)</span>
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={handleCopyLink}
                    className="py-3 px-3 rounded-full btn-secondary text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-[#8EB69B]" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="py-3 px-3 rounded-full btn-secondary text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                  >
                    {shared ? <Check className="w-4 h-4 text-[#8EB69B]" /> : <Share2 className="w-4 h-4" />}
                    <span>{shared ? 'Shared!' : 'Share Menu'}</span>
                  </button>
                </div>

                <a
                  href={menuUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-full bg-[#163832] border border-[#235347] text-xs font-semibold text-[#DAF1DE] flex items-center justify-center gap-2 hover:border-[#8EB69B] cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Public Menu in Browser</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. REVIEWS TAB (All reviews + Delete button for abusive ones)             */}
        {/* ========================================================================= */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <div className="glass-card p-5 space-y-2 border border-[#8EB69B]/40">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8EB69B]">
                Moderation & Accolades
              </span>
              <h3 className="font-heading font-extrabold text-2xl text-[#DAF1DE]">
                Guest Reviews ({ratings.length})
              </h3>
              <p className="text-xs text-[#DAF1DE]/70">
                Monitor live diner feedback. Remove inappropriate or spam submissions with one click.
              </p>
            </div>

            <div className="space-y-3">
              {ratings.length === 0 ? (
                <div className="glass-card p-8 text-center text-xs text-[#DAF1DE]/60">
                  No guest reviews submitted yet.
                </div>
              ) : (
                ratings.map((rev) => (
                  <div key={rev.id} className="glass-card p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#163832] border border-[#235347] flex items-center justify-center text-xs font-bold text-[#8EB69B]">
                          {rev.name ? rev.name.charAt(0).toUpperCase() : 'G'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#DAF1DE]">{rev.name || 'Anonymous Diner'}</p>
                          <p className="text-[10px] text-[#DAF1DE]/50">
                            {rev.createdAt ? new Date(rev.createdAt).toLocaleString() : 'Recent'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-0.5 text-[#8EB69B]">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= rev.stars ? 'fill-[#8EB69B]' : 'text-[#DAF1DE]/20'
                              }`}
                            />
                          ))}
                        </div>

                        <button
                          onClick={() => handleDeleteReview(rev.id)}
                          className="p-1.5 rounded-lg bg-red-950/40 text-red-300 hover:bg-red-900/60 border border-red-500/20 cursor-pointer"
                          title="Delete abusive review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {rev.comment && (
                      <p className="text-xs text-[#DAF1DE]/80 leading-relaxed italic pl-9">
                        "{rev.comment}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Dish Add/Edit Modal */}
      {isDishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#051F20]/85 backdrop-blur-md">
          <div className="bg-[#0B2B26] border border-[#235347] text-[#DAF1DE] w-full max-w-md rounded-t-[28px] sm:rounded-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-24px)] animate-in slide-in-from-bottom duration-200">
            {/* Sticky Header */}
            <div className="shrink-0 px-4 py-3 border-b border-[#235347] flex items-center justify-between bg-[#0B2B26]">
              <h3 className="font-heading text-base font-bold text-[#DAF1DE]">
                {editingDishId ? 'Edit Dish Recipe' : 'Add New Dish'}
              </h3>
              <button
                type="button"
                onClick={() => setIsDishModalOpen(false)}
                className="w-11 h-11 rounded-full flex items-center justify-center text-[#DAF1DE]/70 hover:text-[#DAF1DE] hover:bg-[#163832] transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="dish-editor-form" onSubmit={handleSaveDish} className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4 text-left">
              {/* Photo Upload */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#DAF1DE]">Dish Photo</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-[#051F20] overflow-hidden shrink-0 border border-[#235347] relative">
                    <img
                      src={dishForm.image || getDishImage({ category: dishForm.category })}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-1">
                    <label className="min-h-[44px] inline-flex items-center gap-2 px-3.5 py-2 rounded-full btn-primary text-xs font-bold cursor-pointer shadow-md">
                      {uploadingDishPhoto ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>{uploadingDishPhoto ? 'Compressing...' : 'Upload photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleDishPhotoUpload}
                        disabled={uploadingDishPhoto}
                        className="hidden"
                      />
                    </label>

                    {dishForm.image && (
                      <button
                        type="button"
                        onClick={() => setDishForm((prev) => ({ ...prev, image: '' }))}
                        className="block text-[11px] text-[#DAF1DE]/60 hover:text-[#DAF1DE] underline cursor-pointer"
                      >
                        Reset to default photo
                      </button>
                    )}
                  </div>
                </div>
                {dishPhotoError && <p className="text-[11px] text-red-400">{dishPhotoError}</p>}
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#DAF1DE]">Dish Name *</label>
                <input
                  type="text"
                  required
                  value={dishForm.name}
                  onChange={(e) => setDishForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Handmade Truffle Tagliolini"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#163832] border border-[#235347] text-xs text-[#DAF1DE] focus:outline-hidden focus:border-[#8EB69B]"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#DAF1DE]">Description</label>
                <textarea
                  rows={2}
                  value={dishForm.description}
                  onChange={(e) => setDishForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Taste notes, ingredients, preparation..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#163832] border border-[#235347] text-xs text-[#DAF1DE] focus:outline-hidden focus:border-[#8EB69B] resize-none"
                />
              </div>

              {/* Menu Availability / Status Option (Keep in Menu vs Pause / Remove) */}
              <div className="space-y-1.5 p-3 rounded-xl bg-[#163832] border border-[#235347]">
                <label className="block text-xs font-bold text-[#DAF1DE]">Menu Status & Availability</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDishForm((prev) => ({ ...prev, available: true }))}
                    className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border cursor-pointer ${
                      dishForm.available
                        ? 'bg-[#8EB69B] text-[#051F20] border-[#8EB69B] shadow-md ring-1 ring-[#8EB69B]'
                        : 'bg-[#0B2B26] text-[#DAF1DE]/70 border-[#235347] hover:border-[#8EB69B]'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Keep in Menu</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDishForm((prev) => ({ ...prev, available: false }))}
                    className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border cursor-pointer ${
                      !dishForm.available
                        ? 'bg-amber-400 text-[#051F20] border-amber-400 shadow-md ring-1 ring-amber-400'
                        : 'bg-[#0B2B26] text-[#DAF1DE]/70 border-[#235347] hover:border-[#8EB69B]'
                    }`}
                  >
                    <span>Pause (Hidden)</span>
                  </button>
                </div>
                <p className="text-[10px] text-[#DAF1DE]/60 pt-0.5">
                  {dishForm.available
                    ? '✓ Active: Guests will see and order this dish from the digital menu.'
                    : '⏸ Paused: Dish is kept in your recipe book, but temporarily hidden from diners.'}
                </p>
              </div>

              {/* Price & Category Selection */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#DAF1DE]">
                    Price ({(!restaurant.currency || restaurant.currency === '$') ? 'Rs.' : restaurant.currency}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={dishForm.price ?? ''}
                    onChange={(e) => setDishForm((prev) => ({ ...prev, price: e.target.value }))}
                    placeholder="1500"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#163832] border border-[#235347] text-xs text-[#DAF1DE] font-mono font-bold focus:outline-hidden focus:border-[#8EB69B]"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#DAF1DE]">Category *</label>
                    <span className="text-[10px] text-[#8EB69B] font-semibold">Selected: {dishForm.category}</span>
                  </div>

                  {/* High-visibility Category Pill Options */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {CATEGORIES.map((cat) => {
                      const isSelected = dishForm.category === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setDishForm((prev) => ({ ...prev, category: cat }))}
                          className={`min-h-[40px] px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center transition-all border cursor-pointer ${
                            isSelected
                              ? 'bg-[#8EB69B] text-[#051F20] border-[#8EB69B] shadow-sm ring-1 ring-[#8EB69B]'
                              : 'bg-[#163832] text-[#DAF1DE]/70 border-[#235347] hover:border-[#8EB69B]'
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>

                  {/* Styled fallback dropdown menu */}
                  <select
                    value={dishForm.category}
                    onChange={(e) => setDishForm((prev) => ({ ...prev, category: e.target.value as MenuCategory }))}
                    className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-[#163832] border border-[#235347] text-xs text-[#DAF1DE] focus:outline-hidden focus:border-[#8EB69B] cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-[#0B2B26] text-[#DAF1DE] py-1">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ingredients */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#DAF1DE]">
                  Ingredients (Comma-separated)
                </label>
                <input
                  type="text"
                  value={dishForm.ingredientsStr}
                  onChange={(e) => setDishForm((prev) => ({ ...prev, ingredientsStr: e.target.value }))}
                  placeholder="e.g. Truffles, Parmigiano, Fresh Rosemary"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#163832] border border-[#235347] text-xs text-[#DAF1DE] focus:outline-hidden focus:border-[#8EB69B]"
                />
              </div>

              {/* Prep time */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#DAF1DE]">Preparation Time</label>
                <input
                  type="text"
                  value={dishForm.prepTime}
                  onChange={(e) => setDishForm((prev) => ({ ...prev, prepTime: e.target.value }))}
                  placeholder="e.g. 15-20 mins"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#163832] border border-[#235347] text-xs text-[#DAF1DE] focus:outline-hidden focus:border-[#8EB69B]"
                />
              </div>

              {/* Flavor Levels (0 - 5) */}
              <div className="space-y-2 pt-1 border-t border-[#235347]">
                <label className="block text-xs font-semibold text-[#DAF1DE]">Flavor Levels (0 - 5)</label>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-[#DAF1DE]/70">Spicy: {dishForm.spicy}</span>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      value={dishForm.spicy}
                      onChange={(e) => setDishForm((prev) => ({ ...prev, spicy: parseInt(e.target.value) }))}
                      className="w-full accent-[#8EB69B]"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-[#DAF1DE]/70">Savory: {dishForm.savory}</span>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      value={dishForm.savory}
                      onChange={(e) => setDishForm((prev) => ({ ...prev, savory: parseInt(e.target.value) }))}
                      className="w-full accent-[#8EB69B]"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-[#DAF1DE]/70">Sweet: {dishForm.sweet}</span>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      value={dishForm.sweet}
                      onChange={(e) => setDishForm((prev) => ({ ...prev, sweet: parseInt(e.target.value) }))}
                      className="w-full accent-[#8EB69B]"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-[#DAF1DE]/70">Tangy: {dishForm.tangy}</span>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      value={dishForm.tangy}
                      onChange={(e) => setDishForm((prev) => ({ ...prev, tangy: parseInt(e.target.value) }))}
                      className="w-full accent-[#8EB69B]"
                    />
                  </div>
                </div>
              </div>

              {/* Tag */}
              <div className="space-y-1 pt-1 border-t border-[#235347]">
                <label className="block text-xs font-semibold text-[#DAF1DE]">Highlight Tag</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setDishForm((prev) => ({ ...prev, tag: '' }))}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all border ${
                      !dishForm.tag
                        ? 'bg-[#8EB69B] text-[#051F20] border-[#8EB69B] shadow-sm ring-1 ring-[#8EB69B]'
                        : 'bg-[#163832] border-[#235347] text-[#DAF1DE]/70 hover:border-[#8EB69B]'
                    }`}
                  >
                    None
                  </button>
                  {ITEM_TAGS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setDishForm((prev) => ({ ...prev, tag: t }))}
                      className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all border ${
                        dishForm.tag === t
                          ? 'bg-[#8EB69B] text-[#051F20] border-[#8EB69B] shadow-sm ring-1 ring-[#8EB69B]'
                          : 'bg-[#163832] border-[#235347] text-[#DAF1DE]/70 hover:border-[#8EB69B]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </form>

            {/* Sticky Action Footer */}
            <div className="shrink-0 p-3 border-t border-[#235347] bg-[#0B2B26] flex gap-2 pb-[max(12px,env(safe-area-inset-bottom))]">
              <button
                type="submit"
                form="dish-editor-form"
                className="flex-1 min-h-[44px] py-2.5 rounded-full btn-primary text-xs font-bold cursor-pointer"
              >
                {editingDishId ? 'Save Recipe' : 'Add to Menu'}
              </button>
              <button
                type="button"
                onClick={() => setIsDishModalOpen(false)}
                className="min-h-[44px] px-5 py-2.5 rounded-full btn-secondary text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
