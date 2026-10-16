import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from './api';
import { useAuth } from './auth-context';

interface WishlistContextValue {
  isWishlisted: (listingId: string) => boolean;
  toggle: (listingId: string) => Promise<void>;
  count: number;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

/** Buyer/seller-scoped wishlist membership, fetched once per session so `ListingCard` hearts
 * don't each issue their own request. Signed-out users always see an empty (non-persisting) set. */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      setIds(new Set());
      return;
    }
    let cancelled = false;
    api
      .get<string[]>('/wishlist/ids')
      .then(({ data }) => { if (!cancelled) setIds(new Set(data)); })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  const toggle = useCallback(
    async (listingId: string) => {
      if (!user) return;
      const wasWishlisted = ids.has(listingId);
      setIds((prev) => {
        const next = new Set(prev);
        if (wasWishlisted) next.delete(listingId);
        else next.add(listingId);
        return next;
      });
      try {
        if (wasWishlisted) await api.delete(`/wishlist/${listingId}`);
        else await api.post(`/wishlist/${listingId}`);
      } catch {
        // Roll back on failure
        setIds((prev) => {
          const next = new Set(prev);
          if (wasWishlisted) next.add(listingId);
          else next.delete(listingId);
          return next;
        });
      }
    },
    [ids, user],
  );

  const value = useMemo<WishlistContextValue>(
    () => ({ isWishlisted: (listingId: string) => ids.has(listingId), toggle, count: ids.size }),
    [ids, toggle],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider');
  return ctx;
}
