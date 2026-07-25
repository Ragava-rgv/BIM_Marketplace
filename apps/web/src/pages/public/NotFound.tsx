import { Link } from 'react-router-dom';
import { MonoLabel, Button } from '../../components/ui';
import { ChevronRightIcon } from '../../components/icons';

export function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center">
      <MonoLabel className="text-copper">— MB-ERR-404</MonoLabel>
      <h1 className="mt-3 font-display text-[64px] font-medium leading-none tracking-[-1px] text-ink">404</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-muted">
        This page doesn't exist — the listing may have been withdrawn, or the link is out of date.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link to="/listings">
          <Button>
            Browse listings
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </Link>
        <Link to="/">
          <Button variant="ghost">Back to home</Button>
        </Link>
      </div>
    </div>
  );
}
