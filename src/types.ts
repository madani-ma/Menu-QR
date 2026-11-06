export type MenuCategory = 'Starters' | 'Main' | 'Drinks' | 'Desserts';

export type ItemTag = 'Bestseller' | "Chef's pick" | 'Popular' | '';

export interface FlavorLevels {
  spicy: number; // 0 - 5
  sweet: number; // 0 - 5
  savory: number; // 0 - 5
  tangy: number; // 0 - 5
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  tag?: ItemTag;
  image?: string;
  ingredients?: string[];
  flavors?: FlavorLevels;
  prepTime?: string;
  likesCount?: number;
  rating?: number;
  ratingCount?: number;
  available?: boolean;
}

export interface Restaurant {
  slug: string;
  ownerUid: string;
  name: string;
  whatsapp: string; // e.g. "14155552671"
  offer: string;
  address: string;
  hours: string;
  instagram: string;
  facebook: string;
  logo?: string;
  heroImage?: string;
  story?: string;
  items: MenuItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: MenuCategory;
  image?: string;
}

export interface RatingReview {
  id: string;
  slug: string;
  uid: string;
  itemKey: string; // "restaurant" or dish id
  stars: number; // 1 to 5
  comment?: string;
  name?: string;
  createdAt: string;
}

export type CustomerTab = 'home' | 'menu' | 'specials' | 'reviews' | 'about' | 'contact';
export type DashboardTab = 'setup' | 'dishes' | 'preview' | 'qr' | 'reviews';
