import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { Trash2, Minus, Plus, X, Tag, ChevronRight, Truck, CheckCircle, ArrowLeft } from 'lucide-react';

const backendUrl = API.defaults.baseURL.replace('/api', '');
const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('/uploads')) return `${backendUrl}${url}`;
    return url;
};

const formatPrice = (amount) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
}).format(amount || 0);

const colors = {
    primary: '#472b29',
    accent: '#218856',
    background: '#f9fafb',
    surface: '#ffffff',
    text: '#111827',
    muted: '#6b7280',
    border: '#e5e7eb',
    danger: '#ef4444',
};

const Cart = () => {
    const { cartItems, addToCart, removeFromCart, deleteFromCart } = useContext(CartContext);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [settings, setSettings] = useState(null);
    const [couponCode, setCouponCode] = useState('');
    const [couponResult, setCouponResult] = useState(null);
    const [couponError, setCouponError] = useState('');
    const [userDiscount, setUserDiscount] = useState(null);
    const [publicCoupons, setPublicCoupons] = useState([]);
    const [showCoupons, setShowCoupons] = useState(false);

    useEffect(() => {
        API.get('/settings').then(({ data }) => setSettings(data)).catch(() => { });
        API.get('/settings/public-coupons').then(({ data }) => setPublicCoupons(data)).catch(() => { });

        if (user?._id) {
            API.get(`/settings/user-discount/${user._id}`).then(({ data }) => setUserDiscount(data)).catch(() => setUserDiscount(null));
        }
    }, [user]);

    const subtotal = useMemo(() => cartItems.reduce((acc, item) => acc + item.price * item.qty, 0), [cartItems]);

    const rawDelivery = settings?.deliveryFee ?? 40;
    const freeThreshold = settings?.freeDeliveryEnabled ? (settings?.freeDeliveryAbove ?? 499) : Infinity;
    const deliveryFee = subtotal === 0 ? 0 : subtotal >= freeThreshold ? 0 : rawDelivery;
    const platformFee = settings?.platformFee ?? 5;
    const gstRate = settings?.gstEnabled && settings?.gstPercent ? settings.gstPercent : 0;
    const gstAmount = Math.round((subtotal * gstRate) / 100);

    const couponMinOrder = couponResult?.coupon?.minOrder || 0;
    const couponInvalidForSubtotal = Boolean(couponResult && couponMinOrder > 0 && subtotal < couponMinOrder);
    const activeCoupon = couponInvalidForSubtotal ? null : couponResult;
    const derivedCouponError = couponInvalidForSubtotal ? `Coupon removed: minimum order of ${formatPrice(couponMinOrder)} required.` : couponError;
    const couponDiscount = activeCoupon?.discount || 0;

    const activeUserDiscount = user ? userDiscount : null;
    const userDiscountAmt = activeUserDiscount ? (activeUserDiscount.type === 'percent' ? Math.round((subtotal * activeUserDiscount.value) / 100) : activeUserDiscount.value) : 0;
    const total = Math.max(0, subtotal + deliveryFee + platformFee + gstAmount - couponDiscount - userDiscountAmt);

    const handleApplyCoupon = async (codeToApply = couponCode) => {
        const code = codeToApply.trim().toUpperCase();
        if (!code) { setCouponError('Enter a coupon code first.'); setCouponResult(null); return; }

        setCouponError(''); setCouponResult(null);
        try {
            const { data } = await API.post('/settings/validate-coupon', { code, subtotal });
            setCouponCode(code); setCouponResult(data); setShowCoupons(false);
        } catch (err) {
            setCouponError(err.response?.data?.message || 'Invalid coupon code.');
        }
    };

    const handleCheckout = () => {
        if (!user) { navigate('/login'); return; }
        if (settings && !settings.orderingEnabled) { alert('Ordering is currently disabled. Please try again later.'); return; }
        if (settings && subtotal < settings.minOrderValue) { alert(`Minimum order value is ${formatPrice(settings.minOrderValue)}.`); return; }

        navigate('/checkout', { state: { coupon: activeCoupon, userDiscount: activeUserDiscount } });
    };

    const amountForFreeShipping = Math.max(0, freeThreshold - subtotal);
    const freeShippingProgress = Math.min(100, (subtotal / freeThreshold) * 100);

    return (
        <div style={{ minHeight: '100vh', backgroundColor: colors.background, fontFamily: "'Inter', sans-serif", color: colors.text, padding: 'clamp(16px, 4vw, 40px) clamp(16px, 4vw, 32px)' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', color: colors.muted, fontWeight: 600, fontSize: '14px', width: 'fit-content' }}>
                    <ArrowLeft size={16} /> Continue Shopping
                </button>

                <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 900, color: colors.primary, letterSpacing: '-0.5px' }}>Shopping Cart</h1>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'flex-start' }}>
                    {/* Left Column - Cart Items */}
                    <div style={{ flex: '1 1 500px', backgroundColor: colors.surface, borderRadius: '16px', border: `1px solid ${colors.border}`, padding: 'clamp(16px, 4vw, 32px)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                        {cartItems.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px 0' }}>
                                <div style={{ width: '80px', height: '80px', margin: '0 auto 20px', borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'grid', placeItems: 'center' }}>
                                    <Trash2 size={32} color={colors.muted} />
                                </div>
                                <h2 style={{ fontSize: '20px', color: colors.primary, marginBottom: '8px' }}>Your cart is empty</h2>
                                <p style={{ color: colors.muted, marginBottom: '24px' }}>Add your favorite items to proceed.</p>
                                <button onClick={() => navigate('/')} style={{ padding: '12px 24px', borderRadius: '8px', border: `1px solid ${colors.primary}`, backgroundColor: '#fff', color: colors.primary, fontWeight: 700, cursor: 'pointer' }}>
                                    Start Shopping
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '24px' }}>
                                {settings?.freeDeliveryEnabled && (
                                    <div style={{ padding: '16px', backgroundColor: '#f0fdf4', border: `1px solid #bbf7d0`, borderRadius: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '14px', fontWeight: 700, color: colors.accent }}>
                                            <Truck size={18} />
                                            {amountForFreeShipping > 0 ? `Add items worth ${formatPrice(amountForFreeShipping)} to get Free Shipping` : 'You have unlocked Free Shipping!'}
                                        </div>
                                        <div style={{ height: '6px', backgroundColor: '#dcfce7', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ width: `${freeShippingProgress}%`, height: '100%', backgroundColor: colors.accent, transition: 'width 0.3s ease' }} />
                                        </div>
                                    </div>
                                )}

                                {cartItems.map((item) => {
                                    const imageUrl = getImageUrl((item.images && item.images[0]) || item.image || '');
                                    return (
                                        <div key={item.cartId} style={{ display: 'flex', gap: '16px', paddingBottom: '24px', borderBottom: `1px solid ${colors.border}` }}>
                                            <img src={imageUrl || 'https://via.placeholder.com/80'} alt={item.name} style={{ width: 'clamp(80px, 15vw, 100px)', height: 'clamp(80px, 15vw, 100px)', objectFit: 'cover', borderRadius: '12px', border: `1px solid ${colors.border}`, backgroundColor: '#fff' }} />
                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div>
                                                        <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700, color: colors.text }}>{item.name}</h3>
                                                        <div style={{ fontSize: '13px', color: colors.muted, marginBottom: '6px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                            <span style={{ fontWeight: 700, background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', color: '#09090b' }}>
                                                                Size: {item.size || item.selectedSize || 'M'}
                                                            </span>
                                                            {item.color && item.color !== 'Standard' && (
                                                                <span style={{ color: '#475569' }}>Color: {item.color}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div style={{ fontSize: '16px', fontWeight: 800, color: colors.text }}>{formatPrice(item.price)}</div>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '12px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${colors.border}`, borderRadius: '8px', backgroundColor: '#f9fafb' }}>
                                                        <button onClick={() => removeFromCart(item)} style={{ width: '36px', height: '36px', border: 'none', background: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', color: colors.primary }}>
                                                            <Minus size={16} />
                                                        </button>
                                                        <span style={{ width: '36px', textAlign: 'center', fontSize: '14px', fontWeight: 700 }}>{item.qty}</span>
                                                        <button onClick={() => addToCart(item)} style={{ width: '36px', height: '36px', border: 'none', background: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', color: colors.primary }}>
                                                            <Plus size={16} />
                                                        </button>
                                                    </div>
                                                    <button onClick={() => deleteFromCart(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.danger, padding: '4px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Trash2 size={14} /> REMOVE
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right Column - Summary */}
                    {cartItems.length > 0 && (
                        <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div style={{ backgroundColor: colors.surface, borderRadius: '16px', border: `1px solid ${colors.border}`, padding: 'clamp(20px, 4vw, 32px)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 20px' }}>Order Summary</h2>

                                <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
                                    <Row label="Subtotal" value={formatPrice(subtotal)} />
                                    <Row label="Shipping" value={deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)} highlight={deliveryFee === 0} />
                                    {couponDiscount > 0 && <Row label="Coupon Discount" value={`-${formatPrice(couponDiscount)}`} highlight />}
                                    {userDiscountAmt > 0 && <Row label="First Order Discount" value={`-${formatPrice(userDiscountAmt)}`} highlight />}
                                    {platformFee > 0 && <Row label="Platform Fee" value={formatPrice(platformFee)} />}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', borderTop: `1px solid ${colors.border}`, marginBottom: '24px' }}>
                                    <span style={{ fontSize: '16px', fontWeight: 700 }}>Estimated Total</span>
                                    <span style={{ fontSize: '24px', fontWeight: 900, color: colors.text }}>{formatPrice(total)}</span>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    disabled={Boolean(settings && (!settings.orderingEnabled || subtotal < settings.minOrderValue))}
                                    style={{
                                        width: '100%', padding: '18px', borderRadius: '12px', border: 'none',
                                        backgroundColor: settings && (!settings.orderingEnabled || subtotal < settings.minOrderValue) ? colors.muted : colors.primary,
                                        color: '#fff', fontWeight: 800, fontSize: '16px', cursor: settings && (!settings.orderingEnabled || subtotal < settings.minOrderValue) ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    {settings && !settings.orderingEnabled ? 'ORDERING DISABLED' : settings && subtotal < settings.minOrderValue ? `MIN ORDER ${formatPrice(settings.minOrderValue)}` : 'PROCEED TO CHECKOUT'}
                                </button>
                            </div>

                            {/* Coupons Section */}
                            <div style={{ backgroundColor: colors.surface, borderRadius: '16px', border: `1px solid ${colors.border}`, padding: 'clamp(20px, 4vw, 32px)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Tag size={18} color={colors.accent} /> Coupons & Offers
                                </h3>

                                {activeCoupon ? (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px dashed ${colors.accent}`, backgroundColor: '#f0fdf4', borderRadius: '12px', padding: '16px' }}>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: 800, color: colors.accent }}>'{activeCoupon.coupon.code}' applied</div>
                                            <div style={{ fontSize: '12px', color: colors.accent, marginTop: '2px' }}>You saved {formatPrice(activeCoupon.discount)}</div>
                                        </div>
                                        <button onClick={() => { setCouponResult(null); setCouponCode(''); }} style={{ background: 'none', border: 'none', color: colors.danger, fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>REMOVE</button>
                                    </div>
                                ) : (
                                    <div>
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                            <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Enter promo code" style={{ flex: 1, padding: '12px 14px', border: `1px solid ${colors.border}`, borderRadius: '10px', fontSize: '14px', outline: 'none' }} />
                                            <button onClick={() => handleApplyCoupon()} style={{ padding: '0 20px', backgroundColor: colors.background, border: `1px solid ${colors.border}`, color: colors.text, borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>APPLY</button>
                                        </div>
                                        {derivedCouponError && <div style={{ color: colors.danger, fontSize: '13px', marginBottom: '16px', fontWeight: 600 }}>{derivedCouponError}</div>}

                                        {publicCoupons.length > 0 && (
                                            <div style={{ display: 'grid', gap: '12px' }}>
                                                {publicCoupons.map((coupon) => (
                                                    <div key={coupon._id || coupon.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', border: `1px dashed ${colors.border}`, borderRadius: '10px', backgroundColor: '#fafafa' }}>
                                                        <div>
                                                            <div style={{ fontWeight: 800, fontSize: '14px', color: colors.primary }}>{coupon.code}</div>
                                                            <div style={{ fontSize: '12px', color: colors.muted, marginTop: '4px' }}>{coupon.desc || `${coupon.type === 'percent' ? coupon.value + '%' : formatPrice(coupon.value)} off`}</div>
                                                        </div>
                                                        <button onClick={() => handleApplyCoupon(coupon.code)} style={{ color: colors.accent, fontWeight: 800, fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer' }}>APPLY</button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const Row = ({ label, value, highlight = false }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', color: highlight ? colors.accent : colors.muted, fontWeight: highlight ? 600 : 500 }}>
        <span>{label}</span>
        <span style={{ color: highlight ? colors.accent : colors.text, fontWeight: highlight ? 700 : 600 }}>{value}</span>
    </div>
);

export default Cart;
