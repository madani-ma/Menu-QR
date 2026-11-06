import React, { useState, useEffect } from 'react';
import { type RatingReview } from '../../types';
import { submitRating, subscribeToRatings } from '../../services/ratingService';
import { useAuth } from '../../context/AuthContext';
import { Star, MessageSquare, Plus, Check, X } from 'lucide-react';

interface Props {
  slug: string;
  ratings?: RatingReview[];
  onRatingAdded?: () => void;
}

export function ReviewsTab({ slug, ratings: initialRatings, onRatingAdded }: Props) {
  const { ensureAnonymousAuth } = useAuth();
  const [ratings, setRatings] = useState<RatingReview[]>(initialRatings || []);
  const [showForm, setShowForm] = useState(false);
  const [stars, setStars] = useState(5);
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Subscribe to real-time ratings
  useEffect(() => {
    const unsubscribe = subscribeToRatings(slug, (newRatings) => {
      setRatings(newRatings);
    });
    return () => unsubscribe();
  }, [slug]);

  // Lock body scroll when review modal open
  useEffect(() => {
    if (!showForm) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showForm]);

  // Calculate stats
  const totalCount = ratings.length;
  const avgRating =
    totalCount > 0
      ? ratings.reduce((sum, r) => sum + r.stars, 0) / totalCount
      : 4.9;

  const starCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  ratings.forEach((r) => {
    starCounts[r.stars] = (starCounts[r.stars] || 0) + 1;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setLoading(true);
    try {
      const user = await ensureAnonymousAuth();
      const uid = user?.uid || 'anon_reviewer';
      await submitRating(slug, uid, 'general_dining', stars, comment.trim(), name.trim());
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setShowForm(false);
        setComment('');
        setName('');
      }, 1600);
    } catch (err) {
      console.error('Review submit failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-28 text-left max-w-full">
      {/* Rating Summary Card */}
      <div className="glass-card p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-extrabold text-lg text-[#DAF1DE]">Guest Reviews</h3>
          <button
            onClick={() => setShowForm(true)}
            className="min-h-[44px] px-3.5 py-2 rounded-full btn-primary text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Write a review</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center pt-2 border-t border-[#235347]">
          {/* Big Average Score */}
          <div className="text-center sm:text-left flex flex-col items-center sm:items-start justify-center">
            <span className="font-heading font-extrabold text-4xl text-[#8EB69B]">
              {avgRating.toFixed(1)}
            </span>
            <div className="flex items-center gap-1 pt-1 text-[#8EB69B]">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-3.5 h-3.5 ${
                    s <= Math.round(avgRating) ? 'fill-[#8EB69B]' : 'text-[#DAF1DE]/20'
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] text-[#DAF1DE]/60 pt-1">
              {totalCount} verified reviews
            </span>
          </div>

          {/* Star Distribution Bars */}
          <div className="sm:col-span-2 space-y-1.5 text-xs text-[#DAF1DE]/80">
            {[5, 4, 3, 2, 1].map((s) => {
              const count = starCounts[s] || 0;
              const pct = totalCount > 0 ? (count / totalCount) * 100 : s === 5 ? 85 : 10;
              return (
                <div key={s} className="flex items-center gap-2">
                  <span className="w-6 text-[11px] font-mono font-medium">{s}★</span>
                  <div className="flex-1 h-2 rounded-full bg-[#163832] overflow-hidden">
                    <div
                      className="h-full bg-[#8EB69B] rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-[10px] text-[#DAF1DE]/60 font-mono">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Review Submission Modal Sheet */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#051F20]/85 backdrop-blur-md">
          <div className="bg-[#0B2B26] border border-[#235347] text-[#DAF1DE] w-full max-w-md rounded-t-[28px] sm:rounded-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-24px)] animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="shrink-0 px-4 py-3 border-b border-[#235347] flex items-center justify-between bg-[#0B2B26]">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#8EB69B]" />
                <h4 className="font-heading font-bold text-base text-[#DAF1DE]">Write a Review</h4>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="w-11 h-11 rounded-full flex items-center justify-center text-[#DAF1DE]/70 hover:text-[#DAF1DE] hover:bg-[#163832] transition-colors cursor-pointer"
                aria-label="Close review form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#163832] border border-[#235347]">
                <span className="text-xs font-semibold text-[#DAF1DE]">Overall rating</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStars(s)}
                      className="w-8 h-8 flex items-center justify-center cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          s <= stars ? 'text-[#8EB69B] fill-[#8EB69B]' : 'text-[#DAF1DE]/20'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#DAF1DE]">Your Name (optional)</label>
                <input
                  type="text"
                  maxLength={60}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex M."
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#163832] border border-[#235347] text-xs text-[#DAF1DE] placeholder:text-[#DAF1DE]/40 focus:outline-hidden focus:border-[#8EB69B]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#DAF1DE]">Your Review *</label>
                <textarea
                  rows={3}
                  maxLength={200}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details on food taste, presentation, and service (max 200 chars)..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#163832] border border-[#235347] text-xs text-[#DAF1DE] placeholder:text-[#DAF1DE]/40 focus:outline-hidden focus:border-[#8EB69B] resize-none"
                />
              </div>

              {success && (
                <div className="p-3 rounded-xl bg-[#163832] text-[#8EB69B] text-xs font-bold flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Review published! Thank you.</span>
                </div>
              )}
            </form>

            {/* Sticky Action Footer */}
            <div className="shrink-0 p-3 border-t border-[#235347] bg-[#0B2B26] flex gap-2 pb-[max(12px,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !comment.trim()}
                className="flex-1 min-h-[44px] py-2.5 rounded-full btn-primary text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Post Review'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="min-h-[44px] px-5 py-2.5 rounded-full btn-secondary text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-3">
        <h4 className="font-heading font-bold text-base text-[#DAF1DE]">
          Recent Diner Feedback
        </h4>

        {ratings.length === 0 ? (
          <div className="glass-card p-6 text-center text-xs text-[#DAF1DE]/60">
            No reviews yet. Be the first to share your experience!
          </div>
        ) : (
          ratings.map((rev) => (
            <div key={rev.id} className="glass-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#163832] border border-[#235347] flex items-center justify-center text-xs font-bold text-[#8EB69B]">
                    {rev.name ? rev.name.charAt(0).toUpperCase() : 'G'}
                  </div>
                  <div>
                    <p className="font-bold text-xs text-[#DAF1DE]">
                      {rev.name || 'Verified Diner'}
                    </p>
                    <p className="text-[10px] text-[#DAF1DE]/50 font-mono">
                      {rev.createdAt
                        ? new Date(rev.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Recent'}
                    </p>
                  </div>
                </div>

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
              </div>

              {rev.comment && (
                <p className="text-xs text-[#DAF1DE]/80 leading-relaxed italic pl-10">
                  "{rev.comment}"
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
