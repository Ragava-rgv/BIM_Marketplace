import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './lib/auth-context';
import { WishlistProvider } from './lib/wishlist-context';
import { LanguagePromptOverlay } from './components/LanguagePromptOverlay';
import { router } from './router';

export function App() {
  return (
    <AuthProvider>
      <WishlistProvider>
        <LanguagePromptOverlay />
        <RouterProvider router={router} />
      </WishlistProvider>
    </AuthProvider>
  );
}
