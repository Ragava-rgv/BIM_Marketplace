import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './lib/auth-context';
import { WishlistProvider } from './lib/wishlist-context';
import { router } from './router';

export function App() {
  return (
    <AuthProvider>
      <WishlistProvider>
        <RouterProvider router={router} />
      </WishlistProvider>
    </AuthProvider>
  );
}
