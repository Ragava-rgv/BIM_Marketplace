import type { ReactNode } from 'react';
import { BottomNav } from './BottomNav';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-[72px]">
      {children}
      <BottomNav />
    </div>
  );
}
