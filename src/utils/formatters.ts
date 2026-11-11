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

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  country: string;
  flag: string;
}

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  // 1. Rupees and South Asian Currencies (Prominently listed first)
  { code: 'INR-RS', symbol: 'Rs.', name: 'Rupees - Rs. (India / South Asia)', country: 'India & South Asia', flag: '🇮🇳' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee - ₹', country: 'India', flag: '🇮🇳' },
  { code: 'PKR', symbol: 'Rs.', name: 'Pakistani Rupee - Rs.', country: 'Pakistan', flag: '🇵🇰' },
  { code: 'NPR', symbol: 'Rs.', name: 'Nepalese Rupee - Rs.', country: 'Nepal', flag: '🇳🇵' },
  { code: 'LKR', symbol: 'Rs.', name: 'Sri Lankan Rupee - Rs.', country: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka - ৳', country: 'Bangladesh', flag: '🇧🇩' },

  // 2. Middle East & GCC Currencies
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham - AED', country: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal - SAR', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'QAR', symbol: 'QAR', name: 'Qatari Riyal - QAR', country: 'Qatar', flag: '🇶🇦' },
  { code: 'KWD', symbol: 'KD', name: 'Kuwaiti Dinar - KD', country: 'Kuwait', flag: '🇰🇼' },
  { code: 'BHD', symbol: 'BD', name: 'Bahraini Dinar - BD', country: 'Bahrain', flag: '🇧🇭' },
  { code: 'OMR', symbol: 'OMR', name: 'Omani Rial - OMR', country: 'Oman', flag: '🇴🇲' },

  // 3. Americas & Global Currencies
  { code: 'USD', symbol: '$', name: 'US Dollar - $', country: 'United States', flag: '🇺🇸' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar - CA$', country: 'Canada', flag: '🇨🇦' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso - MX$', country: 'Mexico', flag: '🇲🇽' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real - R$', country: 'Brazil', flag: '🇧🇷' },
  { code: 'COP', symbol: 'COL$', name: 'Colombian Peso - $', country: 'Colombia', flag: '🇨🇴' },
  { code: 'ARS', symbol: 'AR$', name: 'Argentine Peso - $', country: 'Argentina', flag: '🇦🇷' },
  { code: 'CLP', symbol: 'CL$', name: 'Chilean Peso - $', country: 'Chile', flag: '🇨🇱' },

  // 4. Europe & UK Currencies
  { code: 'EUR', symbol: '€', name: 'Euro - €', country: 'European Union', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound - £', country: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc - CHF', country: 'Switzerland', flag: '🇨🇭' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira - ₺', country: 'Turkey', flag: '🇹🇷' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona - kr', country: 'Sweden', flag: '🇸🇪' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone - kr', country: 'Norway', flag: '🇳🇴' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone - kr', country: 'Denmark', flag: '🇩🇰' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Złoty - zł', country: 'Poland', flag: '🇵🇱' },

  // 5. Asia & Pacific Currencies
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar - A$', country: 'Australia', flag: '🇦🇺' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar - NZ$', country: 'New Zealand', flag: '🇳🇿' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar - S$', country: 'Singapore', flag: '🇸🇬' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit - RM', country: 'Malaysia', flag: '🇲🇾' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah - Rp', country: 'Indonesia', flag: '🇮🇩' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso - ₱', country: 'Philippines', flag: '🇵🇭' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht - ฿', country: 'Thailand', flag: '🇹🇭' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong - ₫', country: 'Vietnam', flag: '🇻🇳' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen - ¥', country: 'Japan', flag: '🇯🇵' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan - ¥', country: 'China', flag: '🇨🇳' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won - ₩', country: 'South Korea', flag: '🇰🇷' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar - HK$', country: 'Hong Kong', flag: '🇭🇰' },
  { code: 'TWD', symbol: 'NT$', name: 'New Taiwan Dollar - NT$', country: 'Taiwan', flag: '🇹🇼' },

  // 6. Africa Currencies
  { code: 'ZAR', symbol: 'R', name: 'South African Rand - R', country: 'South Africa', flag: '🇿🇦' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira - ₦', country: 'Nigeria', flag: '🇳🇬' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling - KSh', country: 'Kenya', flag: '🇰🇪' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound - E£', country: 'Egypt', flag: '🇪🇬' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi - GH₵', country: 'Ghana', flag: '🇬🇭' },
  { code: 'MAD', symbol: 'MAD', name: 'Moroccan Dirham - MAD', country: 'Morocco', flag: '🇲🇦' },
];

export function formatPrice(price: number, currency: string = 'Rs.'): string {
  const num = Number(price || 0);
  // Format numbers cleanly with commas (e.g. "Rs. 1,500", "Rs. 36", "Rs. 16.50")
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });

  const rawCurr = (currency || 'Rs.').trim();
  // Ensure "$" is replaced with "Rs." so dollar amounts never appear anywhere
  const curr = (!rawCurr || rawCurr === '$') ? 'Rs.' : rawCurr;

  return `${curr} ${formatted}`;
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
  total: number,
  currency: string = 'Rs.'
): string {
  const cleanPhone = cleanPhoneNumber(phone);
  if (!cleanPhone) return '#';

  const orderLines = items
    .map(
      (c) =>
        `• ${c.quantity}x ${c.name} (${formatPrice(c.price, currency)}) = ${formatPrice(c.price * c.quantity, currency)}`
    )
    .join('\n');

  const message = [
    `👋 Hello ${restaurantName}!`,
    `I would like to place an order:`,
    '',
    orderLines,
    '',
    `Total: ${formatPrice(total, currency)}`,
    '',
    `Thank you!`,
  ].join('\n');

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
