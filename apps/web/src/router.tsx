import { createBrowserRouter } from 'react-router-dom';
import { UserRole } from '@machinebazaar/shared';
import { ProtectedRoute } from './components/ProtectedRoute';

import { PublicLayout } from './layouts/PublicLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { SellerLayout } from './layouts/SellerLayout';
import { BuyerLayout } from './layouts/BuyerLayout';
import { AdminLayout } from './layouts/AdminLayout';

import { Home } from './pages/public/Home';
import { Listings } from './pages/public/Listings';
import { ListingDetail } from './pages/public/ListingDetail';
import { HowItWorks } from './pages/public/HowItWorks';
import { About } from './pages/public/About';

import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';
import { VerifyOtp } from './pages/auth/VerifyOtp';
import { AdminLogin } from './pages/auth/AdminLogin';

import { SellerDashboard } from './pages/seller/Dashboard';
import { SellerListings } from './pages/seller/Listings';
import { NewListing } from './pages/seller/NewListing';
import { EditListing } from './pages/seller/EditListing';
import { SellerEnquiries } from './pages/seller/Enquiries';
import { SellerGstVerification } from './pages/seller/GstVerification';
import { SellerSubscription } from './pages/seller/Subscription';

import { BuyerDashboard } from './pages/buyer/Dashboard';
import { BuyerEnquiries } from './pages/buyer/Enquiries';
import { BuyerSaved } from './pages/buyer/Saved';
import { BuyerLoans } from './pages/buyer/Loans';
import { BuyerNewLoan } from './pages/buyer/NewLoan';
import { BuyerGstVerification } from './pages/buyer/GstVerification';
import { BuyerBuyback } from './pages/buyer/Buyback';
import { BuyerSwitchToSeller } from './pages/buyer/SwitchToSeller';

import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminListings } from './pages/admin/Listings';
import { AdminListingReview } from './pages/admin/ListingReview';
import { AdminEnquiries } from './pages/admin/Enquiries';
import { AdminTransactions } from './pages/admin/Transactions';
import { AdminCertifications } from './pages/admin/Certifications';
import { AdminLoanApplications } from './pages/admin/LoanApplications';
import { AdminFinancePartners } from './pages/admin/FinancePartners';
import { AdminDepreciation } from './pages/admin/Depreciation';
import { AdminBuyback } from './pages/admin/Buyback';
import { AdminSubscriptionPlans } from './pages/admin/SubscriptionPlans';
import { AdminCatalogManager } from './pages/admin/CatalogManager';
import { AdminSettings } from './pages/admin/Settings';

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/listings', element: <Listings /> },
      { path: '/listings/:id', element: <ListingDetail /> },
      { path: '/how-it-works', element: <HowItWorks /> },
      { path: '/about', element: <About /> },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/signup', element: <Signup /> },
      { path: '/verify-otp', element: <VerifyOtp /> },
      { path: '/admin/login', element: <AdminLogin /> },
    ],
  },
  {
    element: <ProtectedRoute roles={[UserRole.SELLER]} />,
    children: [
      {
        element: <SellerLayout />,
        children: [
          { path: '/seller/dashboard', element: <SellerDashboard /> },
          { path: '/seller/listings', element: <SellerListings /> },
          { path: '/seller/listings/new', element: <NewListing /> },
          { path: '/seller/listings/:id/edit', element: <EditListing /> },
          { path: '/seller/enquiries', element: <SellerEnquiries /> },
          { path: '/seller/gst-verification', element: <SellerGstVerification /> },
          { path: '/seller/subscription', element: <SellerSubscription /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute roles={[UserRole.BUYER]} />,
    children: [
      {
        element: <BuyerLayout />,
        children: [
          { path: '/buyer/dashboard', element: <BuyerDashboard /> },
          { path: '/buyer/enquiries', element: <BuyerEnquiries /> },
          { path: '/buyer/saved', element: <BuyerSaved /> },
          { path: '/buyer/loans', element: <BuyerLoans /> },
          { path: '/buyer/loans/new', element: <BuyerNewLoan /> },
          { path: '/buyer/gst-verification', element: <BuyerGstVerification /> },
          { path: '/buyer/buyback', element: <BuyerBuyback /> },
          { path: '/buyer/switch-to-seller', element: <BuyerSwitchToSeller /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute roles={[UserRole.ADMIN]} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin/dashboard', element: <AdminDashboard /> },
          { path: '/admin/listings', element: <AdminListings /> },
          { path: '/admin/listings/:id', element: <AdminListingReview /> },
          { path: '/admin/enquiries', element: <AdminEnquiries /> },
          { path: '/admin/transactions', element: <AdminTransactions /> },
          { path: '/admin/certifications', element: <AdminCertifications /> },
          { path: '/admin/loan-applications', element: <AdminLoanApplications /> },
          { path: '/admin/finance-partners', element: <AdminFinancePartners /> },
          { path: '/admin/depreciation', element: <AdminDepreciation /> },
          { path: '/admin/buyback', element: <AdminBuyback /> },
          { path: '/admin/subscription-plans', element: <AdminSubscriptionPlans /> },
          { path: '/admin/catalog', element: <AdminCatalogManager /> },
          { path: '/admin/settings', element: <AdminSettings /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Home />,
  },
]);
