import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Resets scroll position to the top on every route change (React Router does not do this by default). */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
