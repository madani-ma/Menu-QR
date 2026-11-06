import React, { useEffect } from 'react';
import { type CartItem } from '../../types';
import { formatPrice, buildWhatsAppOrderUrl } from '../../utils/formatters';
import {
  ShoppingBag,
  MessageCircle,
  X,
  Plus,
  Minus,
} from 'lucide-react';

interface Props {
  cart: CartItem[];
  whatsappNumber: string;
  restaurantName: string;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onClearCart: () => void;
}

export function CartBarAndModal({
  cart,
  whatsappNumber,
  restaurantName,
  isOpen,
  onOpen,
  onClose,
  onUpdateQuantity,
  onClearCart,
}: Props) {
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const whatsappUrl = buildWhatsAppOrderUrl(whatsappNumber, restaurantName, cart, totalPrice);

  // Lock body scroll behind modal
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  return (
    <>
      {/* Slim Sticky Bottom Bar (when cart has items and modal is closed) */}
      {totalCount > 0 && !isOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-30 p-3 bg-gradient-to-t from-[#051F20] via-[#051F20]/95 to-transparent pointer-events-none pb-[max(12px,env(safe-area-inset-bottom))]">
          <div className="max-w-[480px] mx-auto pointer-events-auto">
            <div className="glass-card p-2 sm:p-2.5 flex items-center justify-between gap-2 shadow-2xl border border-[#8EB69B]/40 bg-[#0B2B26]/95">
              {/* Left: View order summary */}
              <button
                onClick={onOpen}
                className="flex items-center gap-2 pl-2 text-left cursor-pointer group min-w-0 flex-1 min-h-[44px]"
              >
                <div className="w-8 h-8 rounded-full bg-[#163832] border border-[#235347] flex items-center justify-center text-[#8EB69B] shrink-0 group-hover:border-[#8EB69B]">
                  <ShoppingBag className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div className="truncate text-left">
                  <p className="text-xs font-bold text-[#DAF1DE] truncate">
                    Order ({totalCount}) · {formatPrice(totalPrice)}
                  </p>
                  <p className="text-[10px] text-[#8EB69B]">Review items</p>
                </div>
              </button>

              {/* Right: Order on WhatsApp */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-3.5 py-2.5 rounded-full btn-primary text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Order on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Full Order Drawer / Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#051F20]/85 backdrop-blur-md">
          <div className="bg-[#0B2B26] border border-[#235347] text-[#DAF1DE] w-full max-w-md rounded-t-[28px] sm:rounded-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-24px)] animate-in slide-in-from-bottom duration-200">
            {/* Sticky Header */}
            <div className="shrink-0 px-4 py-3 border-b border-[#235347] flex items-center justify-between bg-[#0B2B26]">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#8EB69B]" />
                <h3 className="font-heading font-extrabold text-base text-[#DAF1DE]">
                  Your Order ({totalCount})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <button
                    onClick={onClearCart}
                    className="text-[11px] text-[#DAF1DE]/60 hover:text-red-400 underline cursor-pointer min-h-[44px] flex items-center px-2"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-11 h-11 rounded-full flex items-center justify-center text-[#DAF1DE]/70 hover:text-[#DAF1DE] hover:bg-[#163832] transition-colors cursor-pointer"
                  aria-label="Close cart"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body (Scrolls internally) */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-[#163832] border border-[#235347] flex items-center justify-center mx-auto text-[#8EB69B]">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-[#DAF1DE]/70">Your cart is currently empty.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-[#163832] border border-[#235347] flex items-center justify-between gap-3 text-left"
                    >
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 rounded-xl object-cover border border-[#235347] shrink-0"
                        />
                      )}

                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p className="font-bold text-xs text-[#DAF1DE] truncate">{item.name}</p>
                        <p className="text-[11px] text-[#8EB69B] font-mono">
                          {formatPrice(item.price)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {/* Quantity Counter */}
                        <div className="flex items-center border border-[#235347] rounded-full p-0.5 bg-[#0B2B26]">
                          <button
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#163832] active:scale-90 text-[#DAF1DE] cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-mono font-bold text-[#DAF1DE]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#163832] active:scale-90 text-[#DAF1DE] cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Price right-aligned */}
                        <span className="w-14 text-right text-xs font-bold font-mono text-[#DAF1DE]">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Subtotal summary */}
              {cart.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-[#163832]/60 border border-[#235347] space-y-1 mt-3">
                  <div className="flex justify-between text-xs text-[#DAF1DE]/70">
                    <span>Subtotal</span>
                    <span className="font-mono">{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#DAF1DE]/70">
                    <span>Tax & billing</span>
                    <span>Paid at restaurant</span>
                  </div>
                  <div className="h-px bg-[#235347] my-1" />
                  <div className="flex justify-between text-sm font-bold text-[#DAF1DE]">
                    <span>Total</span>
                    <span className="font-mono text-base text-[#8EB69B]">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Action Footer */}
            {cart.length > 0 && (
              <div className="shrink-0 p-3 border-t border-[#235347] bg-[#0B2B26] space-y-2 pb-[max(12px,env(safe-area-inset-bottom))]">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[44px] py-3 rounded-full btn-primary text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xl active:scale-[0.99] transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 stroke-[2.2]" />
                  <span>Send order to WhatsApp ({formatPrice(totalPrice)})</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
