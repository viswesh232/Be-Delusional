import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { Trash2, Minus, Plus, X, Tag, ChevronRight, Truck, Edit3, ChevronUp, ChevronDown, CheckCircle2 } from 'lucide-react';

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
    primary: '#472b29', // Dark brown from the image
    accent: '#218856', // Green from free shipping text
    background: '#f9fafb',
    surface: '#ffffff',
    text: '#111827',
    muted: '#6b7280',
    border: '#e5e7eb',
};

const CartDrawer = ({ isOpen, onClose }) => {
    const { cartItems, addToCart, removeFromCart, deleteFromCart } = useContext(CartContext);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [settings, setSettings] = useState(null);
    const [note, setNote] = useState('');
    const [isEditingNote, setIsEditingNote] = useState(false);
    const [products, setProducts] = useState([]);
    
    const [isTotalExpanded, setIsTotalExpanded] = useState(false);
    const [isCouponOpen, setIsCouponOpen] = useState(false);
    const [couponInput, setCouponInput] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        API.get('/settings').then(({ data }) => setSettings(data)).catch(() => {});
        API.get('/products').then(({ data }) => setProducts(data)).catch(() => {});
    }, [isOpen]);

    const subtotal = useMemo(
        () => cartItems.reduce((acc, item) => acc + item.price * item.qty, 0),
        [cartItems]
    );

    const handleApplyCoupon = (codeToApply) => {
        setCouponError('');
        const code = typeof codeToApply === 'string' ? codeToApply : couponInput;
        
        if (!code.trim()) {
            setCouponError('Please enter a code');
            return;
        }
        const trimmed = code.trim().toUpperCase();
        const allCoupons = [...(settings?.coupons || []), ...(settings?.hiddenCoupons || [])];
        const validCoupon = allCoupons.find(c => c.code === trimmed);

        if (!validCoupon) {
            setCouponError('Invalid coupon code');
            return;
        }
        if (validCoupon.minOrder > 0 && subtotal < validCoupon.minOrder) {
            setCouponError(`Minimum order of ${formatPrice(validCoupon.minOrder)} required`);
            return;
        }
        setAppliedCoupon(validCoupon);
        setCouponInput('');
        setIsCouponOpen(false);
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setCouponError('');
    };

    let couponDiscount = 0;
    if (appliedCoupon) {
        if (appliedCoupon.type === 'percent') {
            couponDiscount = Math.round(subtotal * appliedCoupon.value / 100);
        } else {
            couponDiscount = appliedCoupon.value;
        }
        couponDiscount = Math.min(couponDiscount, subtotal);
    }
    const grandTotal = Math.max(0, subtotal - couponDiscount);

    const freeThreshold = settings?.freeDeliveryEnabled ? (settings?.freeDeliveryAbove ?? 999) : 999;
    const amountForFreeShipping = Math.max(0, freeThreshold - subtotal);
    const freeShippingProgress = Math.min(100, (subtotal / freeThreshold) * 100);

    // Cross-sell logic
    const bestOffers = products
        .filter(p => !cartItems.some(ci => ci._id === p._id) && p.isAvailable)
        .slice(0, 4);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', justifyContent: 'flex-end', fontFamily: "'Inter', sans-serif"
        }} onClick={onClose}>
            <div style={{
                width: '100%', maxWidth: '420px', backgroundColor: colors.background, height: '100%',
                display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.3s ease-out'
            }} onClick={e => e.stopPropagation()}>
                <style>
                    {`
                    @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
                    .hide-scroll::-webkit-scrollbar { display: none; }
                    .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
                    `}
                </style>

                {/* Header */}
                <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface }}>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#111', letterSpacing: '0.02em' }}>
                        YOUR CART ({cartItems.length})
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '4px' }}>
                        <X size={22} color="#333" />
                    </button>
                </div>

                {/* Banner */}
                <div style={{ backgroundColor: colors.primary, color: '#fff', textAlign: 'center', padding: '8px 0', fontSize: '13px', fontWeight: 700 }}>
                    Homemade & Authentic Foods
                </div>

                <div className="hide-scroll" style={{ flex: 1, overflowY: 'auto' }}>
                    
                    {/* Free Shipping Meter */}
                    {settings?.freeDeliveryEnabled !== false && (
                        <div style={{ padding: '16px 20px', backgroundColor: colors.surface, borderBottom: `1px solid ${colors.border}` }}>
                            <div style={{ textAlign: 'center', color: colors.accent, fontWeight: 600, fontSize: '13px', marginBottom: '14px' }}>
                                {amountForFreeShipping > 0 
                                    ? `Add items worth ${formatPrice(amountForFreeShipping)} & Get Free Shipping`
                                    : 'You are eligible for Free Shipping!'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ flex: 1, height: '6px', backgroundColor: '#dcfce7', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${freeShippingProgress}%`, height: '100%', backgroundColor: colors.accent, transition: 'width 0.3s' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: colors.accent }}>{formatPrice(freeThreshold)}</span>
                                    <div style={{ border: `1px solid #bbf7d0`, borderRadius: '6px', padding: '4px', marginTop: '2px', backgroundColor: '#f0fdf4' }}>
                                        <Truck size={14} color={colors.accent} />
                                    </div>
                                    <span style={{ fontSize: '10px', color: colors.accent, marginTop: '2px' }}>Free Shipping</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div style={{ padding: '16px 20px' }}>
                        {/* Items */}
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {cartItems.map((item) => {
                                const imgUrl = getImageUrl((item.images && item.images[0]) || item.image || '');
                                return (
                                <div key={item.cartId} style={{ display: 'flex', gap: '12px', padding: '12px', backgroundColor: colors.surface, borderRadius: '12px', border: `1px solid ${colors.border}` }}>
                                        <img 
                                            onClick={() => { onClose(); navigate(`/product/${item.slug || item.product || item._id}`); }} 
                                            src={imgUrl} 
                                            alt={item.name} 
                                            style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer' }} 
                                        />
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div 
                                                    onClick={() => { onClose(); navigate(`/product/${item.slug || item.product || item._id}`); }} 
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <div style={{ fontSize: '14px', fontWeight: 600, color: colors.text }}>{item.name}</div>
                                                    <div style={{ fontSize: '12px', color: colors.muted, marginTop: '2px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                        <span style={{ fontWeight: 700, background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', color: '#09090b' }}>
                                                            Size: {item.size || item.selectedSize || 'M'}
                                                        </span>
                                                        {item.color && item.color !== 'Standard' && (
                                                            <span>Color: {item.color}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: '14px', fontWeight: 700, color: colors.text }}>{formatPrice(item.price * item.qty)}</div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                                                <button onClick={() => deleteFromCart(item)} style={{ padding: '6px', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', color: colors.muted }}>
                                                    <Trash2 size={14} />
                                                </button>
                                                <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${colors.border}`, borderRadius: '6px', padding: '4px 6px', backgroundColor: '#fff' }}>
                                                    <button onClick={() => removeFromCart(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '2px' }}><Minus size={14} /></button>
                                                    <span style={{ width: '24px', textAlign: 'center', fontSize: '13px', fontWeight: 600 }}>{item.qty}</span>
                                                    <button onClick={() => addToCart(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '2px' }}><Plus size={14} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* View Coupons */}
                        {!appliedCoupon ? (
                            <div style={{ marginTop: '16px' }}>
                                <button onClick={() => setIsCouponOpen(!isCouponOpen)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', backgroundColor: colors.surface, border: `1px solid #a7f3d0`, borderRadius: '12px', cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.accent, fontWeight: 600, fontSize: '14px' }}>
                                        <Tag size={18} /> View Coupons / Offers
                                    </div>
                                    <ChevronRight size={18} color={colors.accent} style={{ transform: isCouponOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                                </button>
                                {isCouponOpen && (
                                    <div style={{ marginTop: '8px', padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                            <input 
                                                value={couponInput}
                                                onChange={e => setCouponInput(e.target.value.toUpperCase())}
                                                placeholder="Enter coupon code"
                                                style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #a7f3d0', fontSize: '14px', outline: 'none' }}
                                            />
                                            <button onClick={handleApplyCoupon} style={{ padding: '0 20px', backgroundColor: colors.accent, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Apply</button>
                                        </div>
                                        
                                        {/* Display available coupons */}
                                        {settings?.coupons && settings.coupons.length > 0 && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <div style={{ fontSize: '12px', fontWeight: 700, color: colors.accent, textTransform: 'uppercase' }}>Available Coupons</div>
                                                {settings.coupons.map((coupon, idx) => (
                                                    <div key={idx} style={{ padding: '12px', backgroundColor: '#fff', border: `1px dashed ${colors.accent}`, borderRadius: '8px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                            <div>
                                                                <span style={{ backgroundColor: '#dcfce7', color: colors.accent, padding: '4px 8px', borderRadius: '4px', fontWeight: 800, fontSize: '13px' }}>
                                                                    {coupon.code}
                                                                </span>
                                                                <div style={{ fontSize: '12px', color: colors.muted, marginTop: '8px' }}>
                                                                    {coupon.type === 'percent' ? `Get ${coupon.value}% OFF` : `Flat ₹${coupon.value} OFF`}
                                                                    {coupon.minOrder > 0 && ` on orders above ₹${coupon.minOrder}`}
                                                                </div>
                                                            </div>
                                                            <button 
                                                                onClick={() => {
                                                                    setCouponInput(coupon.code);
                                                                    handleApplyCoupon(coupon.code);
                                                                }} 
                                                                style={{ background: 'none', border: 'none', color: colors.accent, fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                                                            >
                                                                APPLY
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {couponError && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '12px', fontWeight: 600, paddingLeft: '4px' }}>{couponError}</div>}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', backgroundColor: '#f0fdf4', border: `1px dashed ${colors.accent}`, borderRadius: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.accent, fontWeight: 700, fontSize: '14px' }}>
                                    <CheckCircle2 size={18} /> '{appliedCoupon.code}' Applied!
                                </div>
                                <button onClick={removeCoupon} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>REMOVE</button>
                            </div>
                        )}

                        {/* Best Offers Carousel */}
                        {bestOffers.length > 0 && (
                            <div style={{ marginTop: '24px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 700, color: colors.accent, marginBottom: '12px', borderBottom: `2px solid ${colors.accent}`, display: 'inline-block', paddingBottom: '4px' }}>Best offers</h3>
                                <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }} className="hide-scroll">
                                    {bestOffers.map(product => {
                                        const imgUrl = getImageUrl((product.images && product.images[0]) || product.image || '');
                                        const basePrice = product.weights?.[0]?.price || product.price || 0;
                                        const oldPrice = Math.round(basePrice * 1.05); // Fake 5% off for UI demo
                                        return (
                                            <div key={product._id} style={{ minWidth: '160px', backgroundColor: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '10px' }}>
                                                <div style={{ position: 'relative' }}>
                                                    <img src={imgUrl} alt={product.name} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
                                                    <div style={{ position: 'absolute', top: '-6px', left: '-6px', backgroundColor: colors.accent, color: '#fff', fontSize: '10px', fontWeight: 800, padding: '4px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>5% OFF</div>
                                                </div>
                                                <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                                    <span style={{ fontSize: '11px', color: colors.muted, textDecoration: 'line-through' }}>{formatPrice(oldPrice)}</span>
                                                    <span style={{ fontSize: '13px', fontWeight: 800 }}>{formatPrice(basePrice)}</span>
                                                </div>
                                                <button onClick={() => addToCart(product)} style={{ width: '100%', marginTop: '10px', padding: '8px', backgroundColor: '#fff', border: `1px solid ${colors.accent}`, color: colors.accent, borderRadius: '6px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
                                                    <Plus size={14} /> ADD
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Add a note */}
                        <div style={{ marginTop: '24px', backgroundColor: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '16px' }}>
                            {!isEditingNote && !note ? (
                                <div onClick={() => setIsEditingNote(true)} style={{ cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: colors.text, marginBottom: '8px' }}>
                                        <Edit3 size={16} color={colors.muted} /> Add a note
                                    </div>
                                    <div style={{ fontSize: '13px', color: colors.muted }}>
                                        Add any specific instructions or requests...
                                    </div>
                                </div>
                            ) : !isEditingNote && note ? (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: colors.text }}>
                                            <Edit3 size={16} color={colors.accent} /> Customer Note
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => setIsEditingNote(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.accent, padding: '4px' }}><Edit3 size={14} /></button>
                                            <button onClick={() => setNote('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '13px', color: colors.text, padding: '12px', backgroundColor: colors.background, borderRadius: '8px', border: `1px solid ${colors.border}` }}>
                                        {note}
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: colors.text, marginBottom: '12px' }}>
                                        <Edit3 size={16} /> Add a note
                                    </div>
                                    <textarea
                                        autoFocus
                                        value={note}
                                        onChange={e => setNote(e.target.value)}
                                        placeholder="Add any specific instructions or requests..."
                                        style={{ width: '100%', padding: '12px', border: `1px solid ${colors.border}`, borderRadius: '8px', fontSize: '13px', minHeight: '80px', resize: 'vertical', fontFamily: 'inherit', outline: 'none' }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                                        <button onClick={() => setIsEditingNote(false)} style={{ padding: '8px 16px', backgroundColor: '#fff', border: `1px solid ${colors.border}`, borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                                        <button onClick={() => setIsEditingNote(false)} style={{ padding: '8px 16px', backgroundColor: colors.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Save</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ backgroundColor: colors.primary, color: '#fff', textAlign: 'center', padding: '6px 0', fontSize: '11px', fontWeight: 700 }}>
                    Trusted By 10k+ Customers
                </div>
                <div style={{ backgroundColor: colors.surface, padding: '16px 20px', borderTop: `1px solid ${colors.border}`, boxShadow: '0 -4px 12px rgba(0,0,0,0.03)' }}>
                    
                    <div onClick={() => setIsTotalExpanded(!isTotalExpanded)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, color: colors.muted }}>
                            <div style={{ width: '16px', height: '16px', backgroundColor: '#e5e7eb', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ width: '10px', height: '2px', backgroundColor: '#9ca3af' }} />
                            </div>
                            Estimated total
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '18px', fontWeight: 800 }}>
                            {formatPrice(grandTotal)} 
                            {isTotalExpanded ? <ChevronDown size={18} color={colors.muted} /> : <ChevronUp size={18} color={colors.muted} />}
                        </div>
                    </div>

                    {isTotalExpanded && (
                        <div style={{ marginTop: '16px', marginBottom: '16px', fontSize: '13px', color: colors.text, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed #e5e7eb' }}>
                                <span>Total MRP</span>
                                <span>{formatPrice(subtotal)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed #e5e7eb' }}>
                                <span>Delivery fee</span>
                                <span>To be calculated</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed #e5e7eb' }}>
                                <span>Discount on MRP</span>
                                <span style={{ color: colors.accent }}>₹0</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed #e5e7eb' }}>
                                <span>Coupon discount</span>
                                <span style={{ color: colors.accent }}>{couponDiscount > 0 ? `-${formatPrice(couponDiscount)}` : '₹0'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, paddingTop: '4px' }}>
                                <span>Grand total</span>
                                <span>{formatPrice(grandTotal)}</span>
                            </div>
                        </div>
                    )}

                    <button onClick={() => {
                        onClose();
                        navigate('/checkout', { state: { customerNote: note, coupon: appliedCoupon ? { coupon: appliedCoupon } : null } });
                    }} style={{
                        width: '100%', padding: '16px', backgroundColor: colors.primary, color: '#fff', border: 'none', borderRadius: '12px',
                        fontSize: '16px', fontWeight: 800, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        marginTop: isTotalExpanded ? '16px' : '16px'
                    }}>
                        <span>Buy Now</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {/* Fake payment logos for aesthetic */}
                            <div style={{ width: '28px', height: '18px', backgroundColor: '#fff', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#000', fontWeight: 800 }}>PAY</div>
                            <div style={{ width: '28px', height: '18px', backgroundColor: '#fff', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#000', fontWeight: 800 }}>UPI</div>
                            <div style={{ width: '28px', height: '18px', backgroundColor: '#fff', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#000', fontWeight: 800 }}>CC</div>
                        </div>
                    </button>
                    {/* <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '10px', color: colors.muted }}>
                        Powered by <strong style={{ color: '#555' }}>shopflo</strong>
                    </div> */}
                </div>
            </div>
        </div>
    );
};

export default CartDrawer;
