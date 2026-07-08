import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ListingDto } from '@machinebazaar/shared';
import { api } from '../lib/api';
import { AppLayout } from '../components/AppLayout';
import { ListingCard } from '../components/ListingCard';
import { ArrowLeftIcon, SearchIcon } from '../components/icons';

export function Search() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ListingDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(() => {
      setLoading(true);
      api.get<{ items: ListingDto[] }>('/listings', { params: { search: query, pageSize: '20' } })
        .then(({ data }) => setResults(data.items))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <AppLayout>
      {/* Search header */}
      <div className="bg-white border-b border-gray-200 px-4 pt-4 pb-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-ink">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div className="flex-1 flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-[10px] h-[42px] px-3">
          <SearchIcon className="w-[15px] h-[15px] text-gray-500 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search CNC, VMC, lathe..."
            className="flex-1 bg-transparent text-[13px] text-ink placeholder-gray-500 font-medium outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-gray-400 text-[16px] font-medium leading-none">×</button>
          )}
        </div>
      </div>

      <div className="px-[14px] pt-4 flex flex-col gap-[10px]">
        {!query.trim() ? (
          <p className="text-center text-[13px] text-gray-500 py-12">Start typing to search machines…</p>
        ) : loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-[13px] h-[124px] animate-pulse" />
          ))
        ) : results.length === 0 ? (
          <p className="text-center text-[13px] text-gray-500 py-12">No results for "{query}"</p>
        ) : (
          results.map((l) => <ListingCard key={l.id} listing={l} />)
        )}
      </div>
    </AppLayout>
  );
}
