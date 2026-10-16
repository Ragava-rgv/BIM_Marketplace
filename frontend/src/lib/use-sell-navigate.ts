import { useNavigate } from 'react-router-dom';
import { useAuth } from './auth-context';

/** Routes to the right place for the viewer's current capability — shared by the header Sell
    button, the drawer's Sell button, the mobile floating Sell button, and the home page's
    quick-navigation tiles, so the routing rule only lives in one place. */
export function useSellNavigate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  return () => {
    if (!user) return navigate('/signup');
    if (!user.canSell) return navigate('/buyer/switch-to-seller');
    navigate('/seller/listings/new');
  };
}
