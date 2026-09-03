import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useContext, useEffect } from 'react';
import { AuthContext } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import ChatBot from './components/ChatBot';

import Signup         from './pages/Signup';
import Login          from './pages/Login';
import Home           from './pages/Home';
import Cart           from './pages/Cart';
import Checkout       from './pages/Checkout';
import PaymentSuccess from './pages/PaymentSuccess';
import Orders         from './pages/Orders';
import ProductPage    from './pages/ProductPage';
import OurStory       from './pages/OurStory';
import ContactUs      from './pages/ContactUs';
import SupportPage    from './pages/SupportPage';
import VerifyEmail    from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword  from './pages/ResetPassword';
import MyProfile      from './pages/MyProfile';
import Wishlist       from './pages/Wishlist';

import AdminDashboard  from './pages/AdminDashboard';
import PermissionChange from './pages/PermissionChange';
import EditMenu        from './pages/EditMenu';
import LiveOrders      from './pages/LiveOrders';
import RevenueStats    from './pages/RevenueStats';
import DeliveryInfo    from './pages/DeliveryInfo';
import BillGenerator   from './pages/BillGenerator';
import CustomerSearch  from './pages/CustomerSearch';
import CustomerProfile from './pages/CustomerProfile';
import OrderDetail     from './pages/OrderDetails';
import SystemSettings  from './pages/AdminSettings';
import PaymentsPage    from './pages/PaymentsPage';
import ReviewsAdmin    from './pages/ReviewsAdmin';
import SupportAdmin    from './pages/SupportAdmin';
import PaymentDetail   from './pages/PaymentDetail';
import ReachOut        from './pages/ReachOut';
import ReturnsAdmin    from './pages/ReturnsAdmin';

import CustomerLayout from './components/CustomerLayout';

const AdminRoute = ({ children }) => {
    const { user } = useContext(AuthContext);
    if (!user)             return <Navigate to="/login" replace />;
    if (user.role !== 'admin') return <Navigate to="/"    replace />;
    return children;
};

const ProtectedRoute = ({ children }) => {
    const { user } = useContext(AuthContext);
    if (!user) return <Navigate to="/login" replace />;
    return children;
};

const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, [pathname]);

    return null;
};

function App() {
    return (
        <WishlistProvider>
            <Router>
                <ScrollToTop />
                <Routes>
                    {/* Public & Customer Routes wrapped in Layout */}
                    <Route element={<CustomerLayout><Outlet /></CustomerLayout>}>
                        {/* Public */}
                        <Route path="/"              element={<Home />} />
                        <Route path="/product/:id"    element={<ProductPage />} />
                        <Route path="/our-story"     element={<OurStory />} />
                        <Route path="/contact"       element={<ContactUs />} />
                        <Route path="/verify/:token" element={<VerifyEmail />} />
                        <Route path="/profile"        element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
                        <Route path="/wishlist"       element={<Wishlist />} />

                        {/* Customer — protected */}
                        <Route path="/cart"            element={<Cart />} />
                        <Route path="/checkout"        element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                        <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
                        <Route path="/orders"          element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                        <Route path="/support"         element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />
                    </Route>

                    {/* Auth routes */}
                    <Route path="/login"      element={<Login />} />
                    <Route path="/signup"     element={<Signup />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />

                    {/* Admin */}
                    <Route path="/dashboard"             element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                    <Route path="/admin/permissions"     element={<AdminRoute><PermissionChange /></AdminRoute>} />
                    <Route path="/admin/edit-menu"       element={<AdminRoute><EditMenu /></AdminRoute>} />
                    <Route path="/admin/orders"          element={<AdminRoute><LiveOrders /></AdminRoute>} />
                    <Route path="/admin/returns"         element={<AdminRoute><ReturnsAdmin /></AdminRoute>} />
                    <Route path="/admin/revenue"         element={<AdminRoute><RevenueStats /></AdminRoute>} />
                    <Route path="/admin/delivery"        element={<AdminRoute><DeliveryInfo /></AdminRoute>} />
                    <Route path="/admin/bills"           element={<AdminRoute><BillGenerator /></AdminRoute>} />
                    <Route path="/admin/customer-search" element={<AdminRoute><CustomerSearch /></AdminRoute>} />
                    <Route path="/admin/customer/:id"    element={<AdminRoute><CustomerProfile /></AdminRoute>} />
                    <Route path="/admin/order/view/:id"  element={<AdminRoute><OrderDetail /></AdminRoute>} />
                    <Route path="/admin/settings"        element={<AdminRoute><SystemSettings /></AdminRoute>} />
                    <Route path="/admin/payments"        element={<AdminRoute><PaymentsPage /></AdminRoute>} />
                    <Route path="/admin/payment/:id"     element={<AdminRoute><PaymentDetail /></AdminRoute>} />
                    <Route path="/admin/reviews"         element={<AdminRoute><ReviewsAdmin /></AdminRoute>} />
                    <Route path="/admin/support"         element={<AdminRoute><SupportAdmin /></AdminRoute>} />
                    <Route path="/admin/reach-out"       element={<AdminRoute><ReachOut /></AdminRoute>} />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                <ChatBot />
            </Router>
        </WishlistProvider>
    );
}

export default App;
