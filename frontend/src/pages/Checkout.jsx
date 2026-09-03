import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { MapPin, CreditCard, ArrowLeft, Shield, Tag, X, Edit3, MessageSquare, Lock, Plus, Minus } from 'lucide-react';
import { getImageUrl, formatPrice } from '../utils/helpers';

const colors = {
    primary: '#472b29',
    accent: '#218856',
    background: '#f9fafb',
    surface: '#ffffff',
    ink: '#111827',
    muted: '#6b7280',
    border: '#e5e7eb',
    softAccent: '#f0fdf4',
};



const loadRazorpay = () => new Promise((resolve) => {
    if (window.Razorpay) {
        resolve(true);
        return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
});

const Checkout = () => {
    const { cartItems, clearCart, addToCart, removeFromCart } = useContext(CartContext);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();



    const [settings, setSettings] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('Online');
    const [loading, setLoading] = useState(false);
    const [userDiscount, setUserDiscount] = useState(location.state?.userDiscount || null);

    // Initial state from Cart Drawer
    const passedCoupon = location.state?.coupon?.coupon || null;
    const passedNote = location.state?.customerNote || '';

    const [couponResult, setCouponResult] = useState(passedCoupon ? { coupon: passedCoupon, discount: 0 } : null);
    const [couponCode, setCouponCode] = useState(passedCoupon?.code || '');
    const [couponError, setCouponError] = useState('');
    const [customerNote, setCustomerNote] = useState(passedNote);
    const [isEditingNote, setIsEditingNote] = useState(!passedNote);

    const [address, setAddress] = useState({
        firstName: '',
        lastName: '',
        doorNo: '',
        colony: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
    });

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        if (!cartItems.length) { navigate('/'); return; }

        API.get('/settings').then(({ data }) => setSettings(data)).catch(() => { });
        API.get(`/settings/user-discount/${user._id}`).then(({ data }) => setUserDiscount(data)).catch(() => setUserDiscount(null));

        API.get('/auth/profile').then(({ data }) => {
            if (data?.address) {
                setAddress({
                    firstName: data.firstName || '', lastName: data.lastName || '',
                    doorNo: data.address.doorNo || '', colony: data.address.colony || '',
                    city: data.address.city || '', state: data.address.state || '', pincode: data.address.pincode || '',
                    phone: data.phoneNumber || '',
                });
                return;
            }
            return API.get('/orders/myorders').then(({ data: orders }) => {
                if (orders.length > 0 && orders[0].shippingAddress) {
                    const parts = orders[0].shippingAddress.split(',');
                    setAddress({
                        firstName: user.firstName || '', lastName: user.lastName || '',
                        doorNo: parts[0]?.trim() || '', colony: parts[1]?.trim() || '',
                        city: parts[2]?.replace(/- \d+/, '')?.trim() || '', state: '', pincode: orders[0].shippingAddress.match(/\d{6}/)?.[0] || '',
                        phone: user.phoneNumber || '',
                    });
                } else {
                    setAddress(prev => ({ ...prev, firstName: user.firstName || '', lastName: user.lastName || '', phone: user.phoneNumber || '' }));
                }
            });
        }).catch(() => null);
    }, [cartItems.length, navigate, user]);

    const subtotal = useMemo(() => cartItems.reduce((acc, item) => acc + item.price * item.qty, 0), [cartItems]);

    const rawDelivery = settings?.deliveryFee ?? 40;
    const freeThreshold = settings?.freeDeliveryEnabled ? (settings?.freeDeliveryAbove ?? 499) : Infinity;
    const deliveryFee = subtotal >= freeThreshold ? 0 : rawDelivery;
    const platformFee = settings?.platformFee ?? 5;
    const gstRate = settings?.gstEnabled && settings?.gstPercent ? settings.gstPercent : 0;
    const gstAmount = Math.round((subtotal * gstRate) / 100);

    // Validate passed coupon
    useEffect(() => {
        if (couponResult?.coupon) {
            if (couponResult.coupon.minOrder > 0 && subtotal < couponResult.coupon.minOrder) {
                setCouponError(`Minimum order of ${formatPrice(couponResult.coupon.minOrder)} required`);
                setCouponResult(null);
                setCouponCode('');
            } else {
                setCouponError('');
            }
        }
    }, [subtotal, couponResult?.coupon]);

    // Recalculate coupon locally for perfect UI sync
    let calculatedCouponDiscount = 0;
    if (couponResult?.coupon) {
        if (couponResult.coupon.type === 'percent') {
            calculatedCouponDiscount = Math.round(subtotal * couponResult.coupon.value / 100);
        } else {
            calculatedCouponDiscount = couponResult.coupon.value;
        }
        calculatedCouponDiscount = Math.min(calculatedCouponDiscount, subtotal);
    }

    const userDiscountAmt = userDiscount
        ? (userDiscount.type === 'percent' ? Math.round((subtotal * userDiscount.value) / 100) : userDiscount.value)
        : 0;
    const total = Math.max(0, subtotal + deliveryFee + platformFee + gstAmount - calculatedCouponDiscount - userDiscountAmt);
    const codEnabled = settings?.codEnabled !== false;
    const selectedPaymentMethod = !codEnabled && paymentMethod === 'COD' ? 'Online' : paymentMethod;

    const handleApplyCoupon = async () => {
        const code = couponCode.trim().toUpperCase();
        if (!code) { setCouponError('Enter a coupon code first.'); setCouponResult(null); return; }

        setCouponError(''); setCouponResult(null);
        try {
            const { data } = await API.post('/settings/validate-coupon', { code, subtotal });
            setCouponCode(code); setCouponResult(data);
        } catch (err) {
            setCouponError(err.response?.data?.message || 'Invalid coupon code.');
        }
    };

    const buildShippingAddress = () => {
        const namePart = [address.firstName, address.lastName].filter(Boolean).join(' ');
        const parts = [address.colony, address.doorNo, address.city, address.state].filter(Boolean).join(', ');
        const pin = address.pincode ? ` - ${address.pincode}` : '';
        const phonePart = address.phone ? ` (Phone: ${address.phone})` : '';
        return `${namePart ? namePart + ', ' : ''}${parts}${pin}${phonePart}`.trim() || 'Address not provided';
    };

    const buildOrderPayload = (extra = {}) => ({
        orderItems: cartItems.map((item) => ({
            name: item.name,
            qty: item.qty,
            image: (item.images && item.images[0]) || item.image || '',
            price: item.price,
            product: item.product || item._id,
            size: item.size || item.selectedSize || 'M',
            color: item.color || item.selectedColor || 'Standard',
            sku: item.sku || '',
        })),
        totalPrice: total,
        shippingAddress: buildShippingAddress(),
        addressInfo: {
            firstName: address.firstName,
            lastName: address.lastName,
            doorNo: address.doorNo,
            colony: address.colony,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            phone: address.phone,
        },
        couponCode: couponResult?.coupon?.code || '',
        couponDiscount: calculatedCouponDiscount,
        userDiscount: userDiscountAmt,
        customNote: customerNote,
        paymentMethod: selectedPaymentMethod,
        ...extra,
    });

    const handleOnlinePayment = async () => {
        setLoading(true);
        const sdkLoaded = await loadRazorpay();
        if (!sdkLoaded || !window.Razorpay) {
            alert('Payment gateway could not be loaded. Disable ad blockers or choose Cash on Delivery.');
            setLoading(false); return;
        }

        try {
            const { data: rzpOrder } = await API.post('/orders/create-razorpay-order', buildOrderPayload());
            if (!rzpOrder?.razorpayOrderId || !rzpOrder?.key_id) {
                alert('Online payment is not configured correctly right now. Please try again later.');
                setLoading(false); return;
            }

            const options = {
                key: rzpOrder.key_id, amount: rzpOrder.amount, currency: rzpOrder.currency,
                name: 'True Eats', description: `${cartItems.reduce((c, i) => c + i.qty, 0)} item(s)`, order_id: rzpOrder.razorpayOrderId,
                prefill: {
                    name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                    email: user.email || '', contact: user.phoneNumber || user.phone || '',
                },
                theme: { color: colors.primary },
                handler: async (response) => {
                    try {
                        const payload = buildOrderPayload({
                            razorpayOrderId: rzpOrder.razorpayOrderId,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                        });
                        const { data: order } = await API.post('/orders', payload);
                        navigate('/payment-success', { state: { order, clearCart: true } });
                    } catch (err) {
                        navigate('/payment-success', {
                            state: { failed: true, reason: `Payment succeeded but order placement failed. ID: ${response.razorpay_payment_id}. Contact support.` },
                        });
                    }
                },
                modal: { ondismiss: () => setLoading(false) },
            };

            let rzp = new window.Razorpay(options);
            rzp.on('payment.failed', async (response) => {
                rzp.close(); setLoading(false);
                try {
                    await API.post('/orders/record-failed', buildOrderPayload({
                        razorpayOrderId: rzpOrder.razorpayOrderId, failureReason: response.error?.description || 'Payment Failed', paymentMethod: 'Online'
                    }));
                } catch (e) { console.error('Failed to record failure:', e); }

                navigate('/payment-success', { state: { failed: true, reason: response.error?.description || 'Payment could not be processed.' } });
            });
            rzp.open();
        } catch (err) {
            alert(`Could not start payment: ${err.response?.data?.message || err.message}`);
            setLoading(false);
        }
    };

    const handleCOD = async () => {
        setLoading(true);
        try {
            const { data: order } = await API.post('/orders', buildOrderPayload({ paymentMethod: 'COD' }));
            navigate('/payment-success', { state: { order, clearCart: true } });
        } catch (err) { alert(`Order failed: ${err.response?.data?.message || 'Server error'}`); }
        setLoading(false);
    };

    const handlePay = () => {
        if (!address.phone) {
            alert('Please enter your phone number in the Contact section.');
            return;
        }
        if (!address.colony || !address.city || !address.pincode) {
            alert('Please fill in your complete delivery address.');
            return;
        }
        if (selectedPaymentMethod === 'COD') { handleCOD(); return; }
        handleOnlinePayment();
    };

    const inputStyle = {
        width: '100%', padding: '14px 16px', borderRadius: '12px', border: `1px solid ${colors.border}`,
        fontSize: '14px', outline: 'none', backgroundColor: colors.surface, transition: 'border 0.2s',
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: colors.surface, fontFamily: "'Inter', sans-serif", color: colors.ink }}>
            {/* Header */}
            <header style={{ padding: 'clamp(16px, 4vw, 20px)', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', color: colors.muted, fontWeight: 600, fontSize: '14px' }}>
                    <ArrowLeft size={16} /> Return to Store
                </button>
                <div style={{ fontWeight: 900, fontSize: '24px', color: colors.primary, letterSpacing: '-0.5px' }}>
                    True<span style={{ color: colors.accent }}>Eats</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: colors.accent, fontWeight: 700, fontSize: '13px' }}>
                    <Lock size={14} /> Secure Checkout
                </div>
            </header>

            <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexWrap: 'wrap' }}>
                {/* Left Column (Forms) */}
                <div style={{ flex: '1 1 500px', padding: 'clamp(24px, 5vw, 40px) clamp(16px, 4vw, 32px)' }}>

                    <section style={{ marginBottom: '40px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Contact</h2>
                        </div>
                        <div style={{ padding: '16px', borderRadius: '12px', border: `1px solid ${colors.border}`, backgroundColor: colors.surface }}>
                            <div style={{ fontWeight: 600, color: colors.ink }}>{user?.firstName} {user?.lastName}</div>
                            <div style={{ color: colors.muted, fontSize: '14px', marginTop: '4px' }}>{user?.email}</div>

                            <div style={{ marginTop: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: colors.muted, marginBottom: '6px' }}>Phone number *</label>
                                <input
                                    type="tel"
                                    value={address.phone}
                                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                                    style={{ ...inputStyle, backgroundColor: '#f9fafb' }}
                                    placeholder="Mobile number"
                                />
                            </div>
                        </div>
                    </section>

                    <section style={{ marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px' }}>Delivery</h2>
                        <div style={{ display: 'grid', gap: '14px' }}>
                            <div style={{ padding: '14px 16px', borderRadius: '12px', border: `1px solid ${colors.border}`, backgroundColor: colors.surface, fontSize: '14px' }}>
                                <div style={{ fontSize: '12px', color: colors.muted }}>Country/region</div>
                                <div style={{ marginTop: '4px' }}>India</div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <input value={address.firstName} onChange={(e) => setAddress({ ...address, firstName: e.target.value })} style={inputStyle} placeholder="First name" />
                                <input value={address.lastName} onChange={(e) => setAddress({ ...address, lastName: e.target.value })} style={inputStyle} placeholder="Last name" />
                            </div>
                            <input value={address.colony} onChange={(e) => setAddress({ ...address, colony: e.target.value })} style={inputStyle} placeholder="Address" />
                            <input value={address.doorNo} onChange={(e) => setAddress({ ...address, doorNo: e.target.value })} style={inputStyle} placeholder="Apartment, suite, etc (optional)" />
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '14px' }}>
                                <input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} style={inputStyle} placeholder="City" />
                                <input value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} style={inputStyle} placeholder="State" />
                                <input value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} style={inputStyle} placeholder="PIN Code" />
                            </div>
                        </div>
                    </section>

                    <section style={{ marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px' }}>Payment</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[
                                { id: 'Online', label: 'Pay online', sub: 'UPI, Cards, Net Banking', icon: <CreditCard size={20} /> },
                                { id: 'COD', label: 'Cash on delivery', sub: codEnabled ? 'Pay when order arrives' : 'Unavailable', disabled: !codEnabled, icon: <MapPin size={20} /> },
                            ].map((method) => (
                                <div key={method.id} onClick={() => !method.disabled && setPaymentMethod(method.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px',
                                        borderRadius: '12px', border: `1px solid ${selectedPaymentMethod === method.id ? colors.accent : colors.border}`,
                                        backgroundColor: selectedPaymentMethod === method.id ? colors.softAccent : colors.surface,
                                        cursor: method.disabled ? 'not-allowed' : 'pointer', opacity: method.disabled ? 0.5 : 1,
                                        transition: 'all 0.2s'
                                    }}>
                                    <div style={{ color: selectedPaymentMethod === method.id ? colors.accent : colors.muted }}>{method.icon}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, color: colors.ink }}>{method.label}</div>
                                        <div style={{ fontSize: '13px', color: colors.muted, marginTop: '2px' }}>{method.sub}</div>
                                    </div>
                                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${selectedPaymentMethod === method.id ? colors.accent : '#d1d5db'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {selectedPaymentMethod === method.id && <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: colors.accent }} />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Right Column (Summary & Items) */}
                <aside style={{ flex: '1 1 400px', backgroundColor: colors.background, padding: 'clamp(24px, 5vw, 40px) clamp(16px, 4vw, 32px)', borderLeft: `1px solid ${colors.border}`, minHeight: 'calc(100vh - 73px)' }}>

                    {/* Items */}
                    <div style={{ marginBottom: '32px' }}>
                        {cartItems.map((item) => {
                            const imgUrl = getImageUrl((item.images && item.images[0]) || item.image || '');
                            return (
                                <div key={item.cartId || item._id} style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                    <div style={{ position: 'relative' }}>
                                        <img src={imgUrl} alt={item.name} style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover', border: `1px solid ${colors.border}`, backgroundColor: '#fff' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '14px', color: colors.ink }}>{item.name}</div>
                                        <div style={{ fontSize: '12px', color: colors.muted, marginTop: '2px' }}>{item.weight}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', backgroundColor: '#fff', border: `1px solid ${colors.border}`, borderRadius: '6px', padding: '2px 4px', width: 'fit-content' }}>
                                            <button onClick={() => removeFromCart(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: colors.ink, padding: '2px' }}>
                                                <Minus size={12} />
                                            </button>
                                            <span style={{ fontSize: '12px', fontWeight: 600, minWidth: '16px', textAlign: 'center' }}>{item.qty}</span>
                                            <button onClick={() => addToCart(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: colors.ink, padding: '2px' }}>
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                        <div style={{ fontWeight: 600, color: colors.ink }}>{formatPrice(item.price * item.qty)}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Customer Note */}
                    <div style={{ marginBottom: '32px' }}>
                        {!isEditingNote && customerNote ? (
                            <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: `1px solid ${colors.border}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: colors.ink }}><MessageSquare size={14} /> Customer Note</div>
                                    <button onClick={() => setIsEditingNote(true)} style={{ background: 'none', border: 'none', color: colors.accent, fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>EDIT</button>
                                </div>
                                <p style={{ margin: 0, fontSize: '13px', color: colors.muted }}>{customerNote}</p>
                            </div>
                        ) : (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: colors.ink, marginBottom: '8px' }}>
                                    <Edit3 size={14} /> Add a note (Optional)
                                </div>
                                <textarea
                                    value={customerNote} onChange={(e) => setCustomerNote(e.target.value)} onBlur={() => customerNote && setIsEditingNote(false)}
                                    placeholder="Special instructions or requests..."
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${colors.border}`, fontSize: '13px', minHeight: '60px', resize: 'vertical', fontFamily: 'inherit', outline: 'none' }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Coupon */}
                    <div style={{ marginBottom: '32px' }}>
                        {couponResult ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '12px', backgroundColor: colors.softAccent, border: `1px solid ${colors.accent}` }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Tag size={18} color={colors.accent} />
                                    <div style={{ fontWeight: 700, color: colors.accent }}>{couponResult.coupon.code}</div>
                                </div>
                                <button onClick={() => { setCouponResult(null); setCouponCode(''); }} style={{ background: 'none', border: 'none', color: colors.muted, cursor: 'pointer' }}><X size={16} /></button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()} placeholder="Discount code" style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: `1px solid ${colors.border}`, fontSize: '14px', outline: 'none' }} />
                                <button onClick={handleApplyCoupon} style={{ padding: '0 20px', backgroundColor: colors.border, color: colors.ink, border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>Apply</button>
                            </div>
                        )}
                        {couponError && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '8px', fontWeight: 600 }}>{couponError}</div>}
                    </div>

                    {/* Summary */}
                    <div style={{ display: 'grid', gap: '12px', fontSize: '14px', color: colors.ink }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: colors.muted }}>Subtotal</span>
                            <span style={{ fontWeight: 600 }}>{formatPrice(subtotal)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: colors.muted }}>Delivery</span>
                            <span style={{ fontWeight: 600 }}>{deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}</span>
                        </div>
                        {platformFee > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: colors.muted }}>Platform fee</span>
                                <span style={{ fontWeight: 600 }}>{formatPrice(platformFee)}</span>
                            </div>
                        )}
                        {gstAmount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: colors.muted }}>GST ({gstRate}%)</span>
                                <span style={{ fontWeight: 600 }}>{formatPrice(gstAmount)}</span>
                            </div>
                        )}
                        {calculatedCouponDiscount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: colors.accent }}>
                                <span>Coupon discount</span>
                                <span style={{ fontWeight: 600 }}>-{formatPrice(calculatedCouponDiscount)}</span>
                            </div>
                        )}
                        {userDiscountAmt > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: colors.accent }}>
                                <span>{userDiscount?.label || 'Discount'}</span>
                                <span style={{ fontWeight: 600 }}>-{formatPrice(userDiscountAmt)}</span>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${colors.border}` }}>
                            <span style={{ fontWeight: 700, fontSize: '16px' }}>Total</span>
                            <span style={{ fontWeight: 900, fontSize: '24px' }}>{formatPrice(total)}</span>
                        </div>
                    </div>

                    <button onClick={handlePay} disabled={loading} style={{ marginTop: '24px', width: '100%', padding: '18px', backgroundColor: loading ? colors.muted : colors.primary, color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(71, 43, 41, 0.2)' }}>
                        {loading ? 'Processing secure payment...' : `Pay ${formatPrice(total)}`}
                    </button>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px', color: colors.muted, fontSize: '12px' }}>
                        <Shield size={14} /> Encrypted and Secure
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Checkout;
