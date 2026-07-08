/**
 * Lightweight client-side "saved listings" bookmarking, scoped per signed-in
 * user. There is no server-side saved-listings endpoint in the spec — this
 * keeps the feature local without inventing a backend surface.
 */
const STORAGE_PREFIX = 'mb_saved_listings_';

function key(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

export function getSavedListingIds(userId: string): string[] {
  try {
    const raw = localStorage.getItem(key(userId));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function isListingSaved(userId: string, listingId: string): boolean {
  return getSavedListingIds(userId).includes(listingId);
}

export function toggleSavedListing(userId: string, listingId: string): string[] {
  const current = getSavedListingIds(userId);
  const next = current.includes(listingId) ? current.filter((id) => id !== listingId) : [...current, listingId];
  localStorage.setItem(key(userId), JSON.stringify(next));
  return next;
}
