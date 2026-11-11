import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, auth, isFirebaseConfigured, handleFirestoreError, OperationType } from '../firebase';
import type { Restaurant, MenuItem, ItemTag } from '../types';

export const DEMO_RESTAURANT: Restaurant = {
  slug: 'demo-bistro',
  ownerUid: 'demo-owner',
  name: 'Bistro Noir',
  currency: 'Rs.',
  whatsapp: '14155552671',
  offer: 'Chef’s Autumn Tasting Menu · Complimentary artisanal dessert on orders over Rs. 45',
  address: '428 Mercer Street, New York, NY 10013',
  hours: 'Daily: 11:30 AM – 11:00 PM',
  instagram: 'https://instagram.com/bistronoir',
  facebook: 'https://facebook.com/bistronoir',
  heroImage: '/images/hero-1.webp',
  story: 'At Bistro Noir, we believe that culinary excellence begins with uncompromised integrity. Our kitchen partners with sustainable local farms to bring heritage produce and prime cuts straight to your table.',
  items: [
    {
      id: 'dish-1',
      name: 'Lotek Perkedel',
      description: 'Traditional spiced vegetable melange with roasted peanut dressing, hard-boiled egg, and crispy golden potato fritter.',
      price: 16.5,
      category: 'Starters',
      tag: "Chef's pick",
      image: '/images/plate-lotek.webp',
      ingredients: ['Water Spinach', 'Cabbage', 'Peanut Sauce', 'Perkedel Potato Fritter', 'Krupuk Crackers', 'Chili'],
      flavors: { spicy: 3, sweet: 4, savory: 5, tangy: 2 },
      prepTime: '12-15 mins',
      likesCount: 96,
      rating: 4.9,
      ratingCount: 42,
      available: true,
    },
    {
      id: 'dish-2',
      name: 'Lamb Steak Potato',
      description: 'Char-grilled prime cut steak with charred rosemary, golden shoestring potatoes, blistered vine tomatoes, and sea salt.',
      price: 36.0,
      category: 'Main',
      tag: 'Bestseller',
      image: '/images/plate-steak.webp',
      ingredients: ['Prime Lamb Cut', 'Shoestring Potatoes', 'Campari Tomatoes', 'Fresh Rosemary', 'Garlic Butter'],
      flavors: { spicy: 1, sweet: 1, savory: 5, tangy: 1 },
      prepTime: '20-25 mins',
      likesCount: 148,
      rating: 4.8,
      ratingCount: 68,
      available: true,
    },
    {
      id: 'dish-3',
      name: 'Tagliolini al Tartufo',
      description: 'House-extruded egg tagliolini pasta ribbons tossed with 24-month aged Parmigiano Reggiano and fresh winter truffles.',
      price: 28.0,
      category: 'Main',
      tag: 'Popular',
      image: '/images/plate-pasta.webp',
      ingredients: ['Semolina Egg Pasta', 'Black Winter Truffle', 'Vacche Rosse Parmigiano', 'Alpine Butter'],
      flavors: { spicy: 0, sweet: 1, savory: 5, tangy: 1 },
      prepTime: '15-18 mins',
      likesCount: 112,
      rating: 4.9,
      ratingCount: 54,
      available: true,
    },
    {
      id: 'dish-4',
      name: 'Salmon Herb Bowl',
      description: 'Pan-seared crisp skin king salmon over tender quinoa, organic watercress, watermelon radish, and herb vinaigrette.',
      price: 26.5,
      category: 'Main',
      tag: "Chef's pick",
      image: '/images/plate-salmon.webp',
      ingredients: ['King Salmon Fillet', 'Organic Quinoa', 'Watermelon Radish', 'Baby Arugula', 'Lemon Herb Dressing'],
      flavors: { spicy: 1, sweet: 2, savory: 4, tangy: 4 },
      prepTime: '16-20 mins',
      likesCount: 84,
      rating: 4.7,
      ratingCount: 39,
      available: true,
    },
    {
      id: 'dish-5',
      name: 'Truffle Burrata',
      description: 'Silky cream burrata with shaved black truffles, 12-year aged balsamico, and grilled wood-fired sourdough.',
      price: 18.5,
      category: 'Starters',
      tag: 'Bestseller',
      image: '/images/starters.webp',
      ingredients: ['Pugliese Burrata', 'Black Truffle', 'Modena Balsamic', 'Heirloom Sourdough'],
      flavors: { spicy: 0, sweet: 3, savory: 5, tangy: 3 },
      prepTime: '10-12 mins',
      likesCount: 130,
      rating: 4.9,
      ratingCount: 61,
      available: true,
    },
    {
      id: 'dish-6',
      name: 'The Obsidian Old Fashioned',
      description: 'Bourbon infused with Madagascar vanilla bean, Angostura bitters, orange zest, and hand-carved crystal ice sphere.',
      price: 16.0,
      category: 'Drinks',
      tag: 'Popular',
      image: '/images/drinks.webp',
      ingredients: ['Small Batch Bourbon', 'Vanilla Bean', 'Angostura Bitters', 'Orange Peel'],
      flavors: { spicy: 2, sweet: 4, savory: 2, tangy: 1 },
      prepTime: '5 mins',
      likesCount: 75,
      rating: 4.8,
      ratingCount: 29,
      available: true,
    },
    {
      id: 'dish-7',
      name: 'Valrhona Chocolate Fondant',
      description: 'Warm 70% Guanaja chocolate center with French cocoa dusting, edible gold flake, and vanilla mascarpone gelato.',
      price: 13.5,
      category: 'Desserts',
      tag: 'Bestseller',
      image: '/images/desserts.webp',
      ingredients: ['Valrhona 70% Chocolate', 'Farm Eggs', 'French Butter', 'Vanilla Gelato'],
      flavors: { spicy: 0, sweet: 5, savory: 3, tangy: 0 },
      prepTime: '15 mins',
      likesCount: 162,
      rating: 5.0,
      ratingCount: 83,
      available: true,
    },
  ],
};

export async function checkSlugAvailable(slug: string, currentOwnerUid?: string): Promise<boolean> {
  if (!isFirebaseConfigured || !db) return true;
  if (!slug || slug.trim().length < 2) return false;

  const targetSlug = slug.toLowerCase().trim();
  const path = `restaurants/${targetSlug}`;

  try {
    const docRef = doc(db, 'restaurants', targetSlug);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return true;

    const data = snap.data();
    if (currentOwnerUid && data.ownerUid === currentOwnerUid) {
      return true;
    }
    return false;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function getRestaurantBySlug(slug: string): Promise<Restaurant | null> {
  const targetSlug = slug.toLowerCase().trim();
  if (targetSlug === 'demo-bistro') {
    return DEMO_RESTAURANT;
  }

  if (!isFirebaseConfigured || !db) {
    return null;
  }

  const path = `restaurants/${targetSlug}`;
  try {
    const docRef = doc(db, 'restaurants', targetSlug);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as Restaurant;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export function subscribeToRestaurant(
  slug: string,
  onUpdate: (restaurant: Restaurant | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const targetSlug = slug.toLowerCase().trim();

  if (targetSlug === 'demo-bistro') {
    onUpdate(DEMO_RESTAURANT);
    return () => {};
  }

  if (!isFirebaseConfigured || !db) {
    onUpdate(null);
    return () => {};
  }

  const path = `restaurants/${targetSlug}`;
  const docRef = doc(db, 'restaurants', targetSlug);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as Restaurant);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.error('Restaurant snapshot error:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function getOwnerRestaurant(ownerUid: string): Promise<Restaurant | null> {
  if (!isFirebaseConfigured || !db) return null;

  const path = 'restaurants';
  try {
    const q = query(collection(db, 'restaurants'), where('ownerUid', '==', ownerUid));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as Restaurant;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function saveRestaurant(
  restaurant: Restaurant,
  previousSlug?: string
): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured. Please check your setup.');
  }

  const effectiveOwnerUid = (restaurant.ownerUid && restaurant.ownerUid !== 'temp-owner')
    ? restaurant.ownerUid
    : auth?.currentUser?.uid;

  if (!effectiveOwnerUid) {
    throw new Error('You must be logged in as a restaurant owner to save changes.');
  }

  const newSlug = restaurant.slug.toLowerCase().trim();
  if (!newSlug || newSlug.length < 2) {
    throw new Error('Restaurant URL slug must be at least 2 characters long.');
  }

  const path = `restaurants/${newSlug}`;

  // Sanitize all dishes: strip undefined and ensure required schema fields
  const sanitizedItems: MenuItem[] = (restaurant.items || []).map((item, idx) => ({
    id: item.id || `dish-${Date.now()}-${idx}`,
    name: (item.name || '').trim(),
    description: (item.description || '').trim(),
    price: typeof item.price === 'number' ? item.price : parseFloat(String(item.price)) || 0,
    category: item.category || 'Main',
    tag: (item.tag || '') as ItemTag,
    image: item.image || '',
    ingredients: Array.isArray(item.ingredients) ? item.ingredients.filter(Boolean) : [],
    flavors: {
      spicy: Number(item.flavors?.spicy ?? 2),
      sweet: Number(item.flavors?.sweet ?? 1),
      savory: Number(item.flavors?.savory ?? 4),
      tangy: Number(item.flavors?.tangy ?? 1),
    },
    prepTime: item.prepTime || '15-20 mins',
    likesCount: typeof item.likesCount === 'number' ? item.likesCount : 0,
    rating: typeof item.rating === 'number' ? item.rating : 4.8,
    ratingCount: typeof item.ratingCount === 'number' ? item.ratingCount : 1,
    available: item.available !== false,
  }));

  const dataToSave: Restaurant = {
    slug: newSlug,
    ownerUid: effectiveOwnerUid,
    name: (restaurant.name || '').trim(),
    currency: (!restaurant.currency || restaurant.currency === '$') ? 'Rs.' : restaurant.currency.trim(),
    whatsapp: (restaurant.whatsapp || '').trim(),
    offer: (restaurant.offer || '').trim(),
    address: (restaurant.address || '').trim(),
    hours: (restaurant.hours || '').trim(),
    instagram: (restaurant.instagram || '').trim(),
    facebook: (restaurant.facebook || '').trim(),
    heroImage: restaurant.heroImage || '/images/hero-1.webp',
    story: (restaurant.story || '').trim(),
    items: sanitizedItems,
    updatedAt: new Date().toISOString(),
  };

  try {
    // If slug was changed, safely check if the previous slug actually existed in Firestore and belongs to us
    if (
      previousSlug &&
      previousSlug.toLowerCase().trim() !== newSlug &&
      previousSlug.toLowerCase().trim() !== 'demo-bistro'
    ) {
      try {
        const oldDocRef = doc(db, 'restaurants', previousSlug.toLowerCase().trim());
        const oldSnap = await getDoc(oldDocRef);
        if (oldSnap.exists() && oldSnap.data()?.ownerUid === effectiveOwnerUid) {
          await deleteDoc(oldDocRef);
        }
      } catch (delErr) {
        console.warn('Could not clean up previous slug document:', delErr);
      }
    }

    const docRef = doc(db, 'restaurants', newSlug);
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}
