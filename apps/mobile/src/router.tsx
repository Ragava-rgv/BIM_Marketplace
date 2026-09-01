import { createBrowserRouter } from 'react-router-dom';

import { Home } from './pages/Home';
import { ListingDetail } from './pages/ListingDetail';
import { Search } from './pages/Search';
import { Profile } from './pages/Profile';
import { NotFound } from './pages/NotFound';
import { Wanted } from './pages/Wanted';
import { RequirementDetail } from './pages/RequirementDetail';

import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';
import { VerifyOtp } from './pages/auth/VerifyOtp';
import { ForgotPassword } from './pages/auth/ForgotPassword';

import { BuyerDashboard } from './pages/buyer/Dashboard';
import { BuyerGstVerification } from './pages/buyer/GstVerification';
import { BuyerSaved } from './pages/buyer/Saved';
import { BuyerLoans } from './pages/buyer/Loans';
import { BuyerNewLoan } from './pages/buyer/NewLoan';
import { BuyerBuyback } from './pages/buyer/Buyback';
import { BuyerSwitchToSeller } from './pages/buyer/SwitchToSeller';
import { BuyerRequirements } from './pages/buyer/Requirements';
import { NewRequirement } from './pages/buyer/NewRequirement';
import { EditRequirement } from './pages/buyer/EditRequirement';
import { Enquiries } from './pages/Enquiries';

import { SellerDashboard } from './pages/seller/Dashboard';
import { SellerListings } from './pages/seller/Listings';
import { NewListing } from './pages/seller/NewListing';
import { EditListing } from './pages/seller/EditListing';
import { SellerEnquiries } from './pages/seller/Enquiries';
import { SellerGstVerification } from './pages/seller/GstVerification';
import { SellerSubscription } from './pages/seller/Subscription';
import { MyQuotes } from './pages/seller/MyQuotes';

export const router = createBrowserRouter([
  // Public
  { path: '/', element: <Home /> },
  { path: '/listings/:id', element: <ListingDetail /> },
  { path: '/search', element: <Search /> },
  { path: '/profile', element: <Profile /> },
  { path: '/wanted', element: <Wanted /> },
  { path: '/wanted/:id', element: <RequirementDetail /> },

  // Auth
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },
  { path: '/verify-otp', element: <VerifyOtp /> },
  { path: '/forgot-password', element: <ForgotPassword /> },

  // Buyer
  { path: '/buyer/dashboard', element: <BuyerDashboard /> },
  { path: '/buyer/gst-verification', element: <BuyerGstVerification /> },
  { path: '/buyer/saved', element: <BuyerSaved /> },
  { path: '/buyer/loans', element: <BuyerLoans /> },
  { path: '/buyer/loans/new', element: <BuyerNewLoan /> },
  { path: '/buyer/buyback', element: <BuyerBuyback /> },
  { path: '/buyer/switch-to-seller', element: <BuyerSwitchToSeller /> },
  { path: '/buyer/requirements', element: <BuyerRequirements /> },
  { path: '/buyer/requirements/new', element: <NewRequirement /> },
  { path: '/buyer/requirements/:id/edit', element: <EditRequirement /> },
  { path: '/enquiries', element: <Enquiries /> },

  // Seller
  { path: '/seller/dashboard', element: <SellerDashboard /> },
  { path: '/seller/listings', element: <SellerListings /> },
  { path: '/seller/listings/new', element: <NewListing /> },
  { path: '/seller/listings/:id/edit', element: <EditListing /> },
  { path: '/seller/enquiries', element: <SellerEnquiries /> },
  { path: '/seller/gst-verification', element: <SellerGstVerification /> },
  { path: '/seller/subscription', element: <SellerSubscription /> },
  { path: '/seller/quotes', element: <MyQuotes /> },

  { path: '*', element: <NotFound /> },
]);
