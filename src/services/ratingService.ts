import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, isFirebaseConfigured, handleFirestoreError, OperationType } from '../firebase';
import type { RatingReview } from '../types';

export const DEMO_RATINGS: RatingReview[] = [
  {
    id: 'demo_user_1_restaurant',
    slug: 'demo-bistro',
    uid: 'demo_user_1',
    itemKey: 'restaurant',
    stars: 5,
    name: 'Frieren M.',
    comment: 'The food was exceptional, the atmosphere was serene and every single dish exceeded our expectations.',
    createdAt: '2026-11-04T18:30:00Z',
  },
  {
    id: 'demo_user_2_restaurant',
    slug: 'demo-bistro',
    uid: 'demo_user_2',
    itemKey: 'restaurant',
    stars: 5,
    name: 'Christian P.',
    comment: 'One of the best dining experiences we have had. Beautiful presentation and incredible depth of flavor.',
    createdAt: '2026-11-03T20:15:00Z',
  },
  {
    id: 'demo_user_3_restaurant',
    slug: 'demo-bistro',
    uid: 'demo_user_3',
    itemKey: 'restaurant',
    stars: 5,
    name: 'Mikasa L.',
    comment: 'The Wagyu striploin and truffle pasta were unbelievable! Ordering via WhatsApp was seamless.',
    createdAt: '2026-11-02T14:40:00Z',
  },
  {
    id: 'demo_user_4_item_1',
    slug: 'demo-bistro',
    uid: 'demo_user_4',
    itemKey: 'item-1', // Truffle Burrata
    stars: 5,
    name: 'Elena R.',
    comment: 'Melt in your mouth burrata! The balsamic reduction was perfectly balanced.',
    createdAt: '2026-11-01T12:00:00Z',
  },
  {
    id: 'demo_user_5_item_3',
    slug: 'demo-bistro',
    uid: 'demo_user_5',
    itemKey: 'item-3', // Prime Wagyu
    stars: 5,
    name: 'Marcus K.',
    comment: 'A true 10/10 steak. Cooked to perfection with rich rosemary butter.',
    createdAt: '2026-10-31T19:20:00Z',
  },
  {
    id: 'demo_user_6_item_4',
    slug: 'demo-bistro',
    uid: 'demo_user_6',
    itemKey: 'item-4', // Tagliolini
    stars: 5,
    name: 'Chef Fenny',
    comment: 'Authentic handmade egg ribbons with generous fresh winter truffle shavings.',
    createdAt: '2026-10-30T17:10:00Z',
  },
];

export async function submitRating(
  slug: string,
  uid: string,
  itemKey: string,
  stars: number,
  comment = '',
  name = ''
): Promise<void> {
  const docId = `${uid}_${itemKey}`;

  if (!isFirebaseConfigured || !db) {
    // Store in localStorage for demo mode
    const stored = getLocalRatings(slug);
    const existingIndex = stored.findIndex((r) => r.id === docId);
    const newRating: RatingReview = {
      id: docId,
      slug,
      uid,
      itemKey,
      stars,
      comment: comment.trim().slice(0, 200),
      name: name.trim().slice(0, 60) || 'Verified Diner',
      createdAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      stored[existingIndex] = newRating;
    } else {
      stored.unshift(newRating);
    }
    saveLocalRatings(slug, stored);
    return;
  }

  const path = `restaurants/${slug}/ratings/${docId}`;
  try {
    const docRef = doc(db, 'restaurants', slug, 'ratings', docId);
    await setDoc(docRef, {
      id: docId,
      slug,
      uid,
      itemKey,
      stars: Math.max(1, Math.min(5, Math.floor(stars))),
      comment: comment.trim().slice(0, 200),
      name: name.trim().slice(0, 60) || 'Verified Diner',
      createdAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteRating(slug: string, ratingId: string): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    const stored = getLocalRatings(slug);
    const filtered = stored.filter((r) => r.id !== ratingId);
    saveLocalRatings(slug, filtered);
    return;
  }

  const path = `restaurants/${slug}/ratings/${ratingId}`;
  try {
    const docRef = doc(db, 'restaurants', slug, 'ratings', ratingId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export function subscribeToRatings(
  slug: string,
  onUpdate: (ratings: RatingReview[]) => void
): Unsubscribe {
  if (slug === 'demo-bistro') {
    const local = getLocalRatings(slug);
    const combined = [...local, ...DEMO_RATINGS.filter(d => !local.some(l => l.id === d.id))];
    onUpdate(combined);
    return () => {};
  }

  if (!isFirebaseConfigured || !db) {
    onUpdate(getLocalRatings(slug));
    return () => {};
  }

  const path = `restaurants/${slug}/ratings`;
  const colRef = collection(db, 'restaurants', slug, 'ratings');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: RatingReview[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as RatingReview);
      });
      onUpdate(items);
    },
    (err) => {
      console.warn('Ratings snapshot subscription warning:', err);
      onUpdate(getLocalRatings(slug));
    }
  );
}

// Local storage helpers for demo mode
function getLocalRatings(slug: string): RatingReview[] {
  try {
    const key = `menuqr_ratings_${slug}`;
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {}
  return slug === 'demo-bistro' ? [...DEMO_RATINGS] : [];
}

function saveLocalRatings(slug: string, ratings: RatingReview[]) {
  try {
    const key = `menuqr_ratings_${slug}`;
    localStorage.setItem(key, JSON.stringify(ratings));
  } catch {}
}
