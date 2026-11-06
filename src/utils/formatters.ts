import type { MenuCategory, CartItem } from '../types';

export const CATEGORY_PHOTOS: Record<MenuCategory, string> = {
  Starters: '/images/starters.webp',
  Main: '/images/main.webp',
  Drinks: '/images/drinks.webp',
  Desserts: '/images/desserts.webp',
};

export const CATEGORIES: MenuCategory[] = ['Starters', 'Main', 'Drinks', 'Desserts'];

/**
 * Optimizes image URLs:
 * 1. Cloudinary: adds f_auto,q_auto and optional width constraint (e.g. w_400, w_800, w_1200)
 * 2. Local assets: serves modern .webp variant instead of heavy .jpg
 */
export function optimizeImageUrl(url: string, width?: number): string {
  if (!url) return '';
  const trimmed = url.trim();

  // Cloudinary optimization
  if (trimmed.includes('cloudinary.com') && trimmed.includes('/upload/')) {
    const transform = width ? `f_auto,q_auto,w_${width},c_limit` : 'f_auto,q_auto';
    // Avoid duplicate transformations
    if (!trimmed.includes('/upload/f_auto')) {
      return trimmed.replace('/upload/', `/upload/${transform}/`);
    }
    return trimmed;
  }

  // Local demo image optimization: route .jpg to .webp
  if (trimmed.startsWith('/images/') && trimmed.endsWith('.jpg')) {
    return trimmed.replace(/\.jpg$/, '.webp');
  }

  return trimmed;
}

export function getDishImage(dish: { image?: string; category: MenuCategory }, width?: number): string {
  if (dish.image && dish.image.trim()) {
    return optimizeImageUrl(dish.image.trim(), width);
  }
  const fallback = CATEGORY_PHOTOS[dish.category] || '/images/main.webp';
  return optimizeImageUrl(fallback, width);
}

export function formatPrice(price: number): string {
  return `$${Number(price || 0).toFixed(2)}`;
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}

export function buildWhatsAppOrderUrl(
  phone: string,
  restaurantName: string,
  items: CartItem[],
  total: number
): string {
  const cleanPhone = cleanPhoneNumber(phone);
  if (!cleanPhone) return '#';

  const orderLines = items
    .map(
      (c) =>
        `• ${c.quantity}x ${c.name} (${formatPrice(c.price)}) = ${formatPrice(c.price * c.quantity)}`
    )
    .join('\n');

  const message = [
    `👋 Hello ${restaurantName}!`,
    `I would like to place an order:`,
    '',
    orderLines,
    '',
    `Total: ${formatPrice(total)}`,
    '',
    `Thank you!`,
  ].join('\n');

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
