import React, { useState, useEffect } from 'react';
import { type MenuItem } from '../../types';
import { formatPrice, getDishImage } from '../../utils/formatters';
import { submitRating } from '../../services/ratingService';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Star,
  Clock,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Props {
  dish: MenuItem | null;
  slug: string;
  onClose: () => void;
  onAddToCart: (dish: MenuItem) => void;
  currency?: string;
}

export function DishDetailModal({ dish, slug, onClose, onAddToCart, currency = 'Rs.' }: Props) {
  const { ensureAnonymousAuth } = useAuth();
  const [justAdded, setJustAdded] = useState(false);

  // Review form state
  const [showRateForm, setShowRateForm] = useState(false);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState(false);

  // Lock body scroll behind modal
  useEffect(() => {
    if (!dish) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [dish]);

  if (!dish) return null;

  const flavors = dish.flavors || { spicy: 2, sweet: 1, savory: 4, tangy: 1 };
  const ingredients = dish.ingredients || ['Fresh Seasonings', 'Artisanal Herbs'];
  const rating = dish.rating || 4.8;
  const ratingCount = dish.ratingCount || 34;

  const handleAdd = () => {
    onAddToCart(dish);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1600);
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingRating(true);
    try {
      const user = await ensureAnonymousAuth();
      const uid = user?.uid || 'anon_guest';
      await submitRating(slug, uid, dish.id, stars, comment, reviewerName);
      setRatingSuccess(true);
      setTimeout(() => {
        setShowRateForm(false);
        setRatingSuccess(false);
      }, 1800);
    } catch (err) {
      console.error('Rating submission failed:', err);
    } finally {
      setSubmittingRating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#051F20]/85 backdrop-blur-md">
      <div className="bg-[#0B2B26] border border-[#235347] text-[#DAF1DE] w-full max-w-md rounded-t-[28px] sm:rounded-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-24px)]">
        {/* Sticky Header with Title and Close */}
        <div className="shrink-0 px-4 py-3 border-b border-[#235347] flex items-center justify-between bg-[#0B2B26]">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8EB69B]">
              {dish.category}
            </span>
            <span className="text-[#DAF1DE]/40">·</span>
            <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#DAF1DE] truncate">
              {dish.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 rounded-full flex items-center justify-center text-[#DAF1DE]/70 hover:text-[#DAF1DE] hover:bg-[#163832] transition-colors cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Scrolls internally) */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4">
          {/* Photo banner */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-[#051F20] border border-[#235347] shrink-0">
            <img
              src={getDishImage(dish)}
              alt={dish.name}
              className="w-full h-full object-cover"
            />
            {dish.tag && (
              <span className="absolute top-3 left-3 bg-[#8EB69B] text-[#051F20] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                {dish.tag}
              </span>
            )}
            <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-[#051F20]/90 backdrop-blur-md border border-[#235347] text-sm font-mono font-bold text-[#8EB69B]">
              {formatPrice(dish.price, currency)}
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-[#DAF1DE]/80 leading-relaxed text-left">
            {dish.description}
          </p>

          {/* Rating Summary Bar */}
          <div className="p-3 rounded-2xl bg-[#163832] border border-[#235347] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-[#8EB69B]">
                <Star className="w-4 h-4 fill-[#8EB69B]" />
                <span className="font-bold text-sm font-heading">{rating.toFixed(1)}</span>
              </div>
              <span className="text-[11px] text-[#DAF1DE]/60">({ratingCount} reviews)</span>
            </div>

            <button
              onClick={() => setShowRateForm(!showRateForm)}
              className="text-[11px] font-bold text-[#8EB69B] hover:text-[#DAF1DE] underline cursor-pointer min-h-[44px] flex items-center"
            >
              {showRateForm ? 'Cancel review' : 'Rate this dish'}
            </button>
          </div>

          {/* Inline Rate Form */}
          {showRateForm && (
            <form onSubmit={handleSubmitRating} className="p-3.5 rounded-2xl bg-[#163832] border border-[#8EB69B]/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#DAF1DE]">Your score</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((starVal) => (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => setStars(starVal)}
                      className="w-8 h-8 flex items-center justify-center cursor-pointer"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          starVal <= stars ? 'text-[#8EB69B] fill-[#8EB69B]' : 'text-[#DAF1DE]/30'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="text"
                maxLength={60}
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                placeholder="Your name (optional)"
                className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#0B2B26] border border-[#235347] text-xs text-[#DAF1DE] placeholder:text-[#DAF1DE]/40 focus:outline-hidden focus:border-[#8EB69B]"
              />

              <textarea
                rows={2}
                maxLength={200}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you like about this dish? (max 200 chars)"
                className="w-full px-3 py-2 rounded-xl bg-[#0B2B26] border border-[#235347] text-xs text-[#DAF1DE] placeholder:text-[#DAF1DE]/40 focus:outline-hidden focus:border-[#8EB69B] resize-none"
              />

              {ratingSuccess ? (
                <div className="p-2 text-center text-xs text-[#8EB69B] font-bold flex items-center justify-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>Rating submitted!</span>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={submittingRating}
                  className="w-full min-h-[44px] py-2 rounded-full btn-primary text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {submittingRating ? 'Saving...' : 'Submit rating'}
                </button>
              )}
            </form>
          )}

          {/* Prep time */}
          {dish.prepTime && (
            <div className="flex items-center gap-2 text-xs text-[#DAF1DE]/70">
              <Clock className="w-4 h-4 text-[#8EB69B]" />
              <span>Prep time: <strong className="text-[#DAF1DE]">{dish.prepTime}</strong></span>
            </div>
          )}

          {/* Ingredients */}
          <div className="space-y-1.5 text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#DAF1DE]/70">
              Ingredients
            </span>
            <div className="flex flex-wrap gap-1.5">
              {ingredients.map((ing) => (
                <span
                  key={ing}
                  className="px-2.5 py-1 rounded-full bg-[#163832] border border-[#235347] text-xs text-[#DAF1DE]"
                >
                  {ing}
                </span>
              ))}
            </div>
          </div>

          {/* Flavor Profile Bars */}
          <div className="space-y-2 pt-2 border-t border-[#235347]/60 text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#DAF1DE]/70">
              Flavor profile (0 - 5)
            </span>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-[#DAF1DE]/80">
                  <span>Spicy</span>
                  <span className="font-mono">{flavors.spicy}/5</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#163832] overflow-hidden">
                  <div
                    className="h-full bg-[#8EB69B] rounded-full"
                    style={{ width: `${(flavors.spicy / 5) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-[#DAF1DE]/80">
                  <span>Savory</span>
                  <span className="font-mono">{flavors.savory}/5</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#163832] overflow-hidden">
                  <div
                    className="h-full bg-[#8EB69B] rounded-full"
                    style={{ width: `${(flavors.savory / 5) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-[#DAF1DE]/80">
                  <span>Sweet</span>
                  <span className="font-mono">{flavors.sweet}/5</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#163832] overflow-hidden">
                  <div
                    className="h-full bg-[#8EB69B] rounded-full"
                    style={{ width: `${(flavors.sweet / 5) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-[#DAF1DE]/80">
                  <span>Tangy</span>
                  <span className="font-mono">{flavors.tangy}/5</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#163832] overflow-hidden">
                  <div
                    className="h-full bg-[#8EB69B] rounded-full"
                    style={{ width: `${(flavors.tangy / 5) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="shrink-0 p-3 border-t border-[#235347] bg-[#0B2B26] flex gap-2 pb-[max(12px,env(safe-area-inset-bottom))]">
          <button
            onClick={handleAdd}
            className="flex-1 min-h-[44px] py-2.5 px-4 rounded-full btn-primary text-xs font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4" />
                <span>Added to order!</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add to order · {formatPrice(dish.price, currency)}</span>
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="min-h-[44px] px-5 py-2.5 rounded-full btn-secondary text-xs font-semibold hover:border-[#8EB69B] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
