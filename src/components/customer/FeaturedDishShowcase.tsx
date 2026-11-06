import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { type MenuItem } from '../../types';
import { formatPrice, getDishImage } from '../../utils/formatters';
import {
  Star,
  ThumbsUp,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  Check,
  ShoppingBag,
  Info,
} from 'lucide-react';

interface Props {
  dishes: MenuItem[];
  onAddToCart: (dish: MenuItem) => void;
  onOpenDishDetail: (dish: MenuItem) => void;
}

export function FeaturedDishShowcase({ dishes, onAddToCart, onOpenDishDetail }: Props) {
  const prefersReducedMotion = useReducedMotion();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeCardTab, setActiveCardTab] = useState<'overview' | 'ingredients'>('overview');
  const [direction, setDirection] = useState<number>(1);
  const [justAdded, setJustAdded] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const plateRowRef = useRef<HTMLDivElement>(null);

  if (!dishes || dishes.length === 0) return null;

  const currentDish = dishes[selectedIndex] || dishes[0];

  // Helper to split title into light first word and bold second word
  const formatTitle = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length <= 1) {
      return { first: '', second: parts[0] };
    }
    const first = parts[0];
    const second = parts.slice(1).join(' ');
    return { first, second };
  };

  const { first, second } = formatTitle(currentDish.name);

  const handleSelect = (idx: number) => {
    if (idx === selectedIndex) return;
    setDirection(idx > selectedIndex ? 1 : -1);
    setSelectedIndex(idx);
    setIsDescExpanded(false);
    // Smooth-scroll plate row into view so the animation is always visible
    plateRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const handlePrev = () => {
    const nextIdx = selectedIndex > 0 ? selectedIndex - 1 : dishes.length - 1;
    handleSelect(nextIdx);
  };

  const handleNext = () => {
    const nextIdx = selectedIndex < dishes.length - 1 ? selectedIndex + 1 : 0;
    handleSelect(nextIdx);
  };

  const handleAdd = () => {
    onAddToCart(currentDish);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1600);
  };

  const flavors = currentDish.flavors || { spicy: 2, sweet: 2, savory: 4, tangy: 1 };
  const ingredients = currentDish.ingredients || ['Fresh Seasonings', 'Artisanal Herbs', 'Farm Produce'];
  const rating = currentDish.rating || 4.9;
  const likesCount = currentDish.likesCount || 112;

  const slideVariants = {
    enter: (dir: number) => ({
      x: prefersReducedMotion ? 0 : dir > 0 ? 30 : -30,
      rotate: prefersReducedMotion ? 0 : dir > 0 ? 25 : -25,
      opacity: 0,
      scale: 0.92,
    }),
    center: {
      x: 0,
      rotate: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: prefersReducedMotion ? 0.1 : 0.45,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
    exit: (dir: number) => ({
      x: prefersReducedMotion ? 0 : dir > 0 ? -30 : 30,
      rotate: prefersReducedMotion ? 0 : dir > 0 ? -25 : 25,
      opacity: 0,
      scale: 0.92,
      transition: {
        duration: prefersReducedMotion ? 0.1 : 0.35,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    }),
  };

  return (
    <div className="w-full space-y-3 text-left overflow-visible">
      {/* ROW 1: Complete circular plate on left (48-52% width, min 12px space) + slim glass panel on right */}
      <div
        ref={plateRowRef}
        className="flex items-center gap-3 overflow-visible pt-1 px-1"
      >
        {/* Left: Complete circular plate (aspect-ratio 1/1, border-radius 50%, no negative margins) */}
        <div className="w-[50%] max-w-[170px] aspect-square rounded-full relative shrink-0 flex items-center justify-center overflow-visible">
          {/* Ambient glow behind plate */}
          <div className="absolute inset-0 rounded-full bg-[#8EB69B]/15 blur-xl pointer-events-none" />

          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={currentDish.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full h-full cursor-pointer relative rounded-full"
              onClick={() => onOpenDishDetail(currentDish)}
            >
              <img
                src={getDishImage(currentDish, 800)}
                alt={currentDish.name}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                width={170}
                height={170}
                className="w-full h-full object-cover rounded-full shadow-[0_16px_36px_rgba(0,0,0,0.65)] border-2 border-[#235347] aspect-square"
              />
            </motion.div>
          </AnimatePresence>

          {/* Ranking badge neatly anchored at top of plate */}
          <span className="absolute -top-1 left-2 px-2.5 py-0.5 rounded-full bg-[#051F20]/95 border border-[#235347] text-[9px] font-bold text-[#8EB69B] shadow-md pointer-events-none z-10 whitespace-nowrap">
            #{selectedIndex + 1} Loved
          </span>
        </div>

        {/* Right: Slim glass panel with rating badge, small stars, likes count and prep time stacked */}
        <div className="flex-1 bg-[#0B2B26]/90 border border-[#235347] rounded-2xl p-2.5 sm:p-3 flex flex-col justify-center gap-1.5 shadow-md min-w-0">
          {/* Rating badge + small stars */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#8EB69B] text-[#051F20] font-heading font-black text-xs flex items-center justify-center shadow-xs shrink-0">
              {rating.toFixed(1)}
            </div>
            <div className="flex items-center gap-0.5 text-[#8EB69B]">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-3 h-3 ${
                    s <= Math.round(rating) ? 'fill-[#8EB69B]' : 'text-[#DAF1DE]/20'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Loved this count */}
          <div className="flex items-center gap-1.5 text-[11px] text-[#DAF1DE]/80 pt-0.5">
            <ThumbsUp className="w-3.5 h-3.5 text-[#8EB69B] shrink-0" />
            <span className="truncate">{likesCount} guests loved this</span>
          </div>

          {/* Prep time */}
          <div className="flex items-center gap-1.5 text-[11px] text-[#DAF1DE]/80">
            <Clock className="w-3.5 h-3.5 text-[#8EB69B] shrink-0" />
            <span className="truncate">{currentDish.prepTime || '15-20 min'}</span>
          </div>
        </div>
      </div>

      {/* ROW 2: Dish title, price right-aligned, and Order + Details buttons */}
      <div className="space-y-2 px-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-heading uppercase text-lg sm:text-xl text-[#DAF1DE] tracking-wide leading-tight truncate">
            {first && <span className="font-light opacity-80 mr-1.5">{first}</span>}
            <span className="font-extrabold text-[#DAF1DE]">{second}</span>
          </h2>
          <span className="font-mono font-bold text-base text-[#8EB69B] shrink-0">
            {formatPrice(currentDish.price)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAdd}
            className="flex-1 min-h-[44px] py-2 px-3 rounded-full btn-primary text-xs font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4" />
                <span>Added to order!</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Order ({formatPrice(currentDish.price)})</span>
              </>
            )}
          </button>
          <button
            onClick={() => onOpenDishDetail(currentDish)}
            className="min-h-[44px] px-4 py-2 rounded-full btn-secondary text-xs font-semibold hover:border-[#8EB69B] transition-colors cursor-pointer"
          >
            Details
          </button>
        </div>
      </div>

      {/* ROW 3: Thumbnail selector with arrows directly under title */}
      <div className="flex items-center gap-1.5 pt-0.5">
        <button
          onClick={handlePrev}
          className="w-9 h-9 rounded-full bg-[#163832] border border-[#235347] flex items-center justify-center text-[#DAF1DE] hover:border-[#8EB69B] active:scale-95 transition-all cursor-pointer shrink-0"
          aria-label="Previous dish"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {dishes.map((dish, idx) => {
            const isSel = idx === selectedIndex;
            return (
              <button
                key={dish.id}
                onClick={() => handleSelect(idx)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition-all cursor-pointer shrink-0 min-h-[36px] ${
                  isSel
                    ? 'bg-[#163832] border border-[#8EB69B] shadow-xs'
                    : 'bg-[#0B2B26]/60 border border-[#235347]/60 hover:border-[#235347]'
                }`}
              >
                <img
                  src={getDishImage(dish, 100)}
                  alt={dish.name}
                  loading="lazy"
                  decoding="async"
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-full object-cover border border-[#235347] shrink-0 aspect-square"
                />
                <span
                  className={`text-[10px] max-w-[70px] truncate ${
                    isSel ? 'text-[#8EB69B] font-bold' : 'text-[#DAF1DE]/70'
                  }`}
                >
                  {dish.name}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleNext}
          className="w-9 h-9 rounded-full bg-[#163832] border border-[#235347] flex items-center justify-center text-[#DAF1DE] hover:border-[#8EB69B] active:scale-95 transition-all cursor-pointer shrink-0"
          aria-label="Next dish"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ROW 4: Overview | Ingredients & Flavors tabs card, compact, clamped to 2 lines with "Show more" */}
      <div className="w-full glass-card p-3 space-y-2">
        {/* Tab switchers */}
        <div className="flex border-b border-[#235347] pb-1.5">
          <button
            onClick={() => setActiveCardTab('overview')}
            className={`flex-1 text-center py-1 text-xs font-semibold transition-colors cursor-pointer relative ${
              activeCardTab === 'overview' ? 'text-[#8EB69B]' : 'text-[#DAF1DE]/60 hover:text-[#DAF1DE]'
            }`}
          >
            Overview
            {activeCardTab === 'overview' && (
              <span className="absolute bottom-[-7px] left-1/4 right-1/4 h-[2px] bg-[#8EB69B]" />
            )}
          </button>
          <button
            onClick={() => setActiveCardTab('ingredients')}
            className={`flex-1 text-center py-1 text-xs font-semibold transition-colors cursor-pointer relative ${
              activeCardTab === 'ingredients' ? 'text-[#8EB69B]' : 'text-[#DAF1DE]/60 hover:text-[#DAF1DE]'
            }`}
          >
            Ingredients & Flavors
            {activeCardTab === 'ingredients' && (
              <span className="absolute bottom-[-7px] left-1/4 right-1/4 h-[2px] bg-[#8EB69B]" />
            )}
          </button>
        </div>

        {/* Tab content */}
        {activeCardTab === 'overview' ? (
          <div className="text-xs text-[#DAF1DE]/80 leading-relaxed space-y-1">
            <p className={isDescExpanded ? '' : 'line-clamp-2'}>
              {currentDish.description}
            </p>
            {currentDish.description && currentDish.description.length > 70 && (
              <button
                onClick={() => setIsDescExpanded(!isDescExpanded)}
                className="text-[11px] font-bold text-[#8EB69B] hover:text-[#DAF1DE] underline cursor-pointer pt-0.5"
              >
                {isDescExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2 text-xs">
            {/* Ingredients */}
            <div className="flex flex-wrap gap-1">
              {ingredients.map((ing) => (
                <span
                  key={ing}
                  className="px-2 py-0.5 rounded-full bg-[#163832] border border-[#235347] text-[10px] text-[#DAF1DE]"
                >
                  {ing}
                </span>
              ))}
            </div>

            {/* Compact flavor meters */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-[#DAF1DE]/80 pt-1 border-t border-[#235347]/50">
              <div className="flex items-center justify-between">
                <span>Spicy: {flavors.spicy}/5</span>
                <div className="w-12 h-1 rounded-full bg-[#163832] overflow-hidden ml-1">
                  <div className="h-full bg-[#8EB69B]" style={{ width: `${(flavors.spicy / 5) * 100}%` }} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Savory: {flavors.savory}/5</span>
                <div className="w-12 h-1 rounded-full bg-[#163832] overflow-hidden ml-1">
                  <div className="h-full bg-[#8EB69B]" style={{ width: `${(flavors.savory / 5) * 100}%` }} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Sweet: {flavors.sweet}/5</span>
                <div className="w-12 h-1 rounded-full bg-[#163832] overflow-hidden ml-1">
                  <div className="h-full bg-[#8EB69B]" style={{ width: `${(flavors.sweet / 5) * 100}%` }} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Tangy: {flavors.tangy}/5</span>
                <div className="w-12 h-1 rounded-full bg-[#163832] overflow-hidden ml-1">
                  <div className="h-full bg-[#8EB69B]" style={{ width: `${(flavors.tangy / 5) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
