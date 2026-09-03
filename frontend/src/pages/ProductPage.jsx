import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { WishlistContext } from '../context/WishlistContext';
import {
    ArrowLeft, ShoppingBag, Star, ChevronLeft, ChevronRight,
    Heart, Share2, Camera, ShieldCheck, Truck, RefreshCw, Ruler, Check, MapPin
} from 'lucide-react';
import { getImageUrl, formatPrice } from '../utils/helpers';
import SizeGuideModal from '../components/SizeGuideModal';

const Stars = ({ value, size = 16, interactive = false, onChange }) => (
    <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map(n => (
            <Star key={n}
                size={size}
                fill={n <= value ? '#f59e0b' : 'none'}
                color={n <= value ? '#f59e0b' : '#cbd5e1'}
                style={{ cursor: interactive ? 'pointer' : 'default' }}
                onClick={() => interactive && onChange && onChange(n)}
            />
        ))}
    </div>
);

export default function ProductPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const { addToCart } = useContext(CartContext);
    const { isInWishlist, toggleWishlist } = useContext(WishlistContext);

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeImageIdx, setActiveImageIdx] = useState(0);

    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState(null);
    const [qty, setQty] = useState(1);
    const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
    const [addedToast, setAddedToast] = useState(false);

    // Pincode estimator
    const [pincode, setPincode] = useState('');
    const [pincodeChecked, setPincodeChecked] = useState(false);

    // Reviews
    const [reviews, setReviews] = useState([]);
    const [reviewForm, setReviewForm] = useState({
        rating: 5,
        title: '',
        body: '',
        fitFeedback: 'True to Size',
        sizePurchased: '',
        customerHeight: '',
    });
    const [reviewFiles, setReviewFiles] = useState([]);
    const [submittingReview, setSubmittingReview] = useState(false);
    const [activeTab, setActiveTab] = useState('details'); // 'details' | 'care' | 'shipping'

    useEffect(() => {
        setLoading(true);
        API.get(`/products/${id}`)
            .then(res => {
                const p = res.data;
                setProduct(p);
                if (p.sizes && p.sizes.length > 0) {
                    setSelectedSize(p.sizes[0]);
                }
                if (p.colors && p.colors.length > 0) {
                    setSelectedColor(p.colors[0]);
                }
            })
            .catch(err => console.error('Failed to load product', err))
            .finally(() => setLoading(false));

        API.get(`/reviews/${id}`)
            .then(res => setReviews(res.data))
            .catch(err => console.error('Failed to load reviews', err));
    }, [id]);

    if (loading) {
        return (
            <div style={{ padding: '80px 20px', textAlign: 'center', minHeight: '60vh' }}>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#71717a' }}>Loading garment details...</div>
            </div>
        );
    }

    if (!product) {
        return (
            <div style={{ padding: '80px 20px', textAlign: 'center', minHeight: '60vh' }}>
                <h2>Product not found</h2>
                <button onClick={() => navigate('/')} style={{ marginTop: '16px', padding: '10px 20px', background: '#09090b', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                    Back to Collection
                </button>
            </div>
        );
    }

    const images = (product.images && product.images.length > 0)
        ? product.images
        : (product.image ? [product.image] : ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800']);

    const hasDiscount = product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price;
    const currentPrice = hasDiscount ? product.discountPrice : product.price;

    const currentVariant = Array.isArray(product.variants) 
        ? product.variants.find(v => v.size === selectedSize)
        : null;
    const currentStock = currentVariant ? currentVariant.stock : 20;
    const isOutOfStock = currentVariant && currentVariant.stock <= 0;

    const handleAddToCart = () => {
        if (!selectedSize) {
            alert('Please select a size first');
            return;
        }
        addToCart(product, qty, {
            size: selectedSize,
            color: selectedColor ? selectedColor.name : 'Standard',
            colorHex: selectedColor ? selectedColor.hex : '#000000'
        });
        setAddedToast(true);
        setTimeout(() => setAddedToast(false), 2500);
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            navigate('/login');
            return;
        }
        setSubmittingReview(true);
        try {
            const fd = new FormData();
            fd.append('rating', reviewForm.rating);
            fd.append('title', reviewForm.title);
            fd.append('body', reviewForm.body);
            fd.append('fitFeedback', reviewForm.fitFeedback);
            fd.append('sizePurchased', reviewForm.sizePurchased || selectedSize);
            fd.append('customerHeight', reviewForm.customerHeight);

            reviewFiles.forEach(f => fd.append('images', f));

            const res = await API.post(`/reviews/${product._id}`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setReviews([res.data, ...reviews]);
            setReviewForm({ rating: 5, title: '', body: '', fitFeedback: 'True to Size', sizePurchased: '', customerHeight: '' });
            setReviewFiles([]);
            alert('Thank you for reviewing your fit!');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to submit review');
        } finally {
            setSubmittingReview(false);
        }
    };

    const avgRating = reviews.length > 0 
        ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
        : '4.9';

    const trueToSizeCount = reviews.filter(r => r.fitFeedback === 'True to Size').length;
    const trueToSizePercent = reviews.length > 0 ? Math.round((trueToSizeCount / reviews.length) * 100) : 92;

    const isFav = isInWishlist(product._id);

    return (
        <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', padding: '30px 20px 80px', fontFamily: 'inherit' }}>
            <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
                
                {/* Back Button & Breadcrumbs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', fontSize: '13px', color: '#71717a' }}>
                    <button 
                        onClick={() => navigate(-1)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: '13px', fontWeight: '600', color: '#09090b', padding: 0
                        }}
                    >
                        <ArrowLeft size={16} /> Back
                    </button>
                    <span>/</span>
                    <span>{product.gender || 'Unisex'}</span>
                    <span>/</span>
                    <span>{product.category}</span>
                    <span>/</span>
                    <span style={{ color: '#09090b', fontWeight: '600' }}>{product.name}</span>
                </div>

                {/* Main Product Section */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '48px', alignItems: 'start' }}>
                    
                    {/* Left: Gallery */}
                    <div>
                        <div style={{
                            position: 'relative',
                            width: '100%',
                            paddingTop: '125%', // 4:5 fashion aspect ratio
                            borderRadius: '16px',
                            overflow: 'hidden',
                            backgroundColor: '#f4f4f5',
                            border: '1px solid #e5e7eb'
                        }}>
                            <img 
                                src={getImageUrl(images[activeImageIdx])} 
                                alt={product.name}
                                style={{
                                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                    objectFit: 'cover'
                                }}
                            />

                            {/* Wishlist Button */}
                            <button
                                onClick={() => toggleWishlist(product)}
                                style={{
                                    position: 'absolute', top: '16px', right: '16px',
                                    width: '42px', height: '42px', borderRadius: '50%',
                                    background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(4px)',
                                    border: 'none', cursor: 'pointer', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                                }}
                            >
                                <Heart size={20} color={isFav ? '#ef4444' : '#09090b'} fill={isFav ? '#ef4444' : 'none'} />
                            </button>
                        </div>

                        {/* Thumbnails */}
                        {images.length > 1 && (
                            <div style={{ display: 'flex', gap: '12px', marginTop: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImageIdx(idx)}
                                        style={{
                                            width: '76px', height: '96px', borderRadius: '8px',
                                            overflow: 'hidden', border: activeImageIdx === idx ? '2px solid #09090b' : '1px solid #e5e7eb',
                                            padding: 0, cursor: 'pointer', flexShrink: 0, background: '#f4f4f5'
                                        }}
                                    >
                                        <img src={getImageUrl(img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Product Details & Buying Controls */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#71717a', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                {product.brand || 'True Threads'} • {product.gender || 'Unisex'}
                            </div>
                            <h1 style={{ margin: '6px 0 10px', fontSize: '32px', fontWeight: '800', color: '#09090b', letterSpacing: '-0.5px' }}>
                                {product.name}
                            </h1>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Stars value={Math.round(avgRating)} size={16} />
                                <span style={{ fontSize: '14px', fontWeight: '700', color: '#09090b' }}>{avgRating}</span>
                                <span style={{ fontSize: '13px', color: '#71717a' }}>({reviews.length} reviews)</span>
                                <span style={{ color: '#d4d4d8' }}>•</span>
                                <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600' }}>{trueToSizePercent}% said True to Size</span>
                            </div>
                        </div>

                        {/* Price Display */}
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', borderBottom: '1px solid #f4f4f5', paddingBottom: '16px' }}>
                            <span style={{ fontSize: '28px', fontWeight: '800', color: '#09090b' }}>
                                {formatPrice(currentPrice)}
                            </span>
                            {hasDiscount && (
                                <>
                                    <span style={{ fontSize: '18px', color: '#a1a1aa', textDecoration: 'line-through' }}>
                                        {formatPrice(product.price)}
                                    </span>
                                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#ef4444', background: '#fee2e2', padding: '3px 8px', borderRadius: '4px' }}>
                                        SAVE {Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                                    </span>
                                </>
                            )}
                            <span style={{ fontSize: '12px', color: '#71717a' }}>Inclusive of all taxes</span>
                        </div>

                        {/* Colors */}
                        {product.colors && product.colors.length > 0 && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#09090b', textTransform: 'uppercase' }}>
                                        Color: <span style={{ fontWeight: '500', color: '#71717a' }}>{selectedColor ? selectedColor.name : 'Standard'}</span>
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {product.colors.map(col => (
                                        <button
                                            key={col.name}
                                            onClick={() => setSelectedColor(col)}
                                            title={col.name}
                                            style={{
                                                width: '32px', height: '32px', borderRadius: '50%',
                                                backgroundColor: col.hex || '#000000',
                                                border: selectedColor?.name === col.name ? '3px solid #09090b' : '1px solid #e5e7eb',
                                                outline: selectedColor?.name === col.name ? '2px solid #ffffff' : 'none',
                                                cursor: 'pointer'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Size Selection & Guide */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <span style={{ fontSize: '13px', fontWeight: '700', color: '#09090b', textTransform: 'uppercase' }}>
                                    Select Size
                                </span>
                                <button
                                    onClick={() => setIsSizeGuideOpen(true)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        background: 'none', border: 'none', color: '#2563eb',
                                        fontSize: '13px', fontWeight: '600', cursor: 'pointer'
                                    }}
                                >
                                    <Ruler size={14} /> Size Guide
                                </button>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                {(product.sizes && product.sizes.length > 0 ? product.sizes : ['S', 'M', 'L', 'XL']).map(s => {
                                    const variant = product.variants?.find(v => v.size === s);
                                    const outOfStock = variant && variant.stock <= 0;
                                    const isSelected = selectedSize === s;

                                    return (
                                        <button
                                            key={s}
                                            disabled={outOfStock}
                                            onClick={() => setSelectedSize(s)}
                                            style={{
                                                minWidth: '54px', height: '44px',
                                                borderRadius: '8px',
                                                border: isSelected ? '2px solid #09090b' : '1px solid #e4e4e7',
                                                background: isSelected ? '#09090b' : (outOfStock ? '#f4f4f5' : '#ffffff'),
                                                color: isSelected ? '#ffffff' : (outOfStock ? '#a1a1aa' : '#09090b'),
                                                fontSize: '14px', fontWeight: '700',
                                                cursor: outOfStock ? 'not-allowed' : 'pointer',
                                                textDecoration: outOfStock ? 'line-through' : 'none',
                                                position: 'relative'
                                            }}
                                        >
                                            {s}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Urgency Stock Message */}
                            {currentStock > 0 && currentStock <= 5 && (
                                <div style={{ fontSize: '13px', color: '#d97706', fontWeight: '600', marginTop: '8px' }}>
                                    ⚡ Only {currentStock} left in Size {selectedSize} — order soon!
                                </div>
                            )}
                            {isOutOfStock && (
                                <div style={{ fontSize: '13px', color: '#dc2626', fontWeight: '600', marginTop: '8px' }}>
                                    ✕ Size {selectedSize} is currently sold out.
                                </div>
                            )}
                        </div>

                        {/* Quantity & CTA */}
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px' }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', border: '1px solid #e4e4e7',
                                borderRadius: '8px', overflow: 'hidden'
                            }}>
                                <button
                                    onClick={() => setQty(Math.max(1, qty - 1))}
                                    style={{ width: '40px', height: '48px', background: '#fafafa', border: 'none', cursor: 'pointer', fontWeight: '700' }}
                                >
                                    -
                                </button>
                                <span style={{ width: '40px', textAlign: 'center', fontWeight: '700', fontSize: '15px' }}>{qty}</span>
                                <button
                                    onClick={() => setQty(qty + 1)}
                                    style={{ width: '40px', height: '48px', background: '#fafafa', border: 'none', cursor: 'pointer', fontWeight: '700' }}
                                >
                                    +
                                </button>
                            </div>

                            <button
                                disabled={isOutOfStock}
                                onClick={handleAddToCart}
                                style={{
                                    flex: 1, height: '48px',
                                    background: isOutOfStock ? '#a1a1aa' : '#09090b',
                                    color: '#ffffff', border: 'none', borderRadius: '8px',
                                    fontSize: '15px', fontWeight: '700', cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    transition: 'background 0.2s ease'
                                }}
                            >
                                <ShoppingBag size={18} />
                                {isOutOfStock ? 'Sold Out' : 'Add to Bag'}
                            </button>
                        </div>

                        {addedToast && (
                            <div style={{
                                padding: '10px 14px', borderRadius: '8px', background: '#f0fdf4',
                                border: '1px solid #bbf7d0', color: '#16a34a', fontSize: '14px',
                                fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px'
                            }}>
                                <Check size={16} /> Added {selectedSize} to your shopping bag!
                            </div>
                        )}

                        {/* Pincode Estimator */}
                        <div style={{
                            padding: '16px', borderRadius: '12px', background: '#fafafa',
                            border: '1px solid #f4f4f5', marginTop: '10px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#09090b', marginBottom: '8px' }}>
                                <MapPin size={16} /> Check Delivery & COD Availability
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input 
                                    placeholder="Enter 6-digit Pincode"
                                    value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    style={{
                                        padding: '8px 12px', borderRadius: '6px', border: '1px solid #e4e4e7',
                                        fontSize: '13px', width: '180px', outline: 'none'
                                    }}
                                />
                                <button
                                    onClick={() => setPincodeChecked(pincode.length === 6)}
                                    style={{
                                        padding: '8px 16px', borderRadius: '6px', background: '#09090b',
                                        color: '#ffffff', border: 'none', fontSize: '13px', fontWeight: '600', cursor: 'pointer'
                                    }}
                                >
                                    Check
                                </button>
                            </div>
                            {pincodeChecked && (
                                <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '8px', fontWeight: '600' }}>
                                    ✓ Delivery within 3–5 working days • Cash on Delivery available!
                                </div>
                            )}
                        </div>

                        {/* Trust Badges */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', paddingTop: '12px', borderTop: '1px solid #f4f4f5' }}>
                            <div style={{ textAlign: 'center', padding: '10px', background: '#ffffff' }}>
                                <Truck size={20} color="#09090b" style={{ margin: '0 auto 6px' }} />
                                <div style={{ fontSize: '12px', fontWeight: '700' }}>Fast Dispatch</div>
                                <div style={{ fontSize: '11px', color: '#71717a' }}>Shipped in 24-48 hrs</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: '10px', background: '#ffffff' }}>
                                <RefreshCw size={20} color="#09090b" style={{ margin: '0 auto 6px' }} />
                                <div style={{ fontSize: '12px', fontWeight: '700' }}>7-Day Exchange</div>
                                <div style={{ fontSize: '11px', color: '#71717a' }}>Hassle-free sizing</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: '10px', background: '#ffffff' }}>
                                <ShieldCheck size={20} color="#09090b" style={{ margin: '0 auto 6px' }} />
                                <div style={{ fontSize: '12px', fontWeight: '700' }}>100% Cotton</div>
                                <div style={{ fontSize: '11px', color: '#71717a' }}>Premium quality</div>
                            </div>
                        </div>

                        {/* Tabs: Specifications & Care */}
                        <div style={{ marginTop: '16px' }}>
                            <div style={{ display: 'flex', borderBottom: '1px solid #e4e4e7', gap: '20px' }}>
                                <button
                                    onClick={() => setActiveTab('details')}
                                    style={{
                                        padding: '10px 0', background: 'none', border: 'none',
                                        fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                                        borderBottom: activeTab === 'details' ? '2px solid #09090b' : '2px solid transparent',
                                        color: activeTab === 'details' ? '#09090b' : '#71717a'
                                    }}
                                >
                                    Garment Specs
                                </button>
                                <button
                                    onClick={() => setActiveTab('care')}
                                    style={{
                                        padding: '10px 0', background: 'none', border: 'none',
                                        fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                                        borderBottom: activeTab === 'care' ? '2px solid #09090b' : '2px solid transparent',
                                        color: activeTab === 'care' ? '#09090b' : '#71717a'
                                    }}
                                >
                                    Wash & Care
                                </button>
                                <button
                                    onClick={() => setActiveTab('shipping')}
                                    style={{
                                        padding: '10px 0', background: 'none', border: 'none',
                                        fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                                        borderBottom: activeTab === 'shipping' ? '2px solid #09090b' : '2px solid transparent',
                                        color: activeTab === 'shipping' ? '#09090b' : '#71717a'
                                    }}
                                >
                                    Returns Policy
                                </button>
                            </div>

                            <div style={{ padding: '16px 0', fontSize: '14px', color: '#52525b', lineHeight: '1.6' }}>
                                {activeTab === 'details' && (
                                    <div>
                                        <p style={{ marginBottom: '10px' }}>{product.description}</p>
                                        <p><strong>Fabric:</strong> {product.material || '100% Combed Heavy Cotton'}</p>
                                        <p><strong>Fit:</strong> {product.fit || 'Oversized Silhouette'}</p>
                                        {product.modelStats && <p><strong>Model Note:</strong> {product.modelStats}</p>}
                                    </div>
                                )}
                                {activeTab === 'care' && (
                                    <div>
                                        <p>{product.careInstructions || '• Machine wash cold with similar dark colors.'}</p>
                                        <p>• Do not iron directly on graphic prints.</p>
                                        <p>• Line dry in shade to preserve fabric softness.</p>
                                    </div>
                                )}
                                {activeTab === 'shipping' && (
                                    <div>
                                        <p>• We offer a <strong>7-Day Size Exchange</strong> guarantee from the date of delivery.</p>
                                        <p>• Garments must have original tags intact, unworn, and unwashed.</p>
                                        <p>• You can initiate a size exchange with one click right from your Orders dashboard.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Customer Reviews Section */}
                <div style={{ marginTop: '64px', borderTop: '1px solid #e4e4e7', paddingTop: '40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div>
                            <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Customer Reviews & Fit Experience</h2>
                            <p style={{ margin: 0, fontSize: '14px', color: '#71717a' }}>Real feedback from verified buyers</p>
                        </div>
                    </div>

                    {/* Review Submission Form */}
                    <div style={{ background: '#fafafa', padding: '24px', borderRadius: '12px', border: '1px solid #f4f4f5', marginBottom: '32px' }}>
                        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700' }}>Write a Review & Fit Feedback</h3>
                        <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <div>
                                    <span style={{ fontSize: '13px', fontWeight: '600', marginRight: '8px' }}>Your Rating:</span>
                                    <Stars value={reviewForm.rating} interactive onChange={r => setReviewForm({ ...reviewForm, rating: r })} />
                                </div>
                                <div>
                                    <span style={{ fontSize: '13px', fontWeight: '600', marginRight: '8px' }}>How does it fit?</span>
                                    <select
                                        value={reviewForm.fitFeedback}
                                        onChange={e => setReviewForm({ ...reviewForm, fitFeedback: e.target.value })}
                                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                    >
                                        <option value="Runs Small">Runs Small</option>
                                        <option value="True to Size">True to Size</option>
                                        <option value="Runs Large">Runs Large</option>
                                    </select>
                                </div>
                                <div>
                                    <input 
                                        placeholder="Size Purchased (e.g. L)"
                                        value={reviewForm.sizePurchased}
                                        onChange={e => setReviewForm({ ...reviewForm, sizePurchased: e.target.value })}
                                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', width: '150px' }}
                                    />
                                </div>
                            </div>

                            <input 
                                placeholder="Review Headline (e.g. Great heavyweight fabric!)"
                                value={reviewForm.title} onChange={e => setReviewForm({ ...reviewForm, title: e.target.value })}
                                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                            />

                            <textarea 
                                rows={3} required
                                placeholder="Tell other shoppers how the fit, fabric feel, and drape turned out..."
                                value={reviewForm.body} onChange={e => setReviewForm({ ...reviewForm, body: e.target.value })}
                                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', resize: 'vertical' }}
                            />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569', cursor: 'pointer' }}>
                                    <Camera size={16} /> Upload Fit Photos
                                    <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={e => setReviewFiles(Array.from(e.target.files))} />
                                </label>
                                <button
                                    type="submit" disabled={submittingReview}
                                    style={{
                                        padding: '8px 20px', background: '#09090b', color: '#fff',
                                        border: 'none', borderRadius: '6px', fontWeight: '700', fontSize: '14px', cursor: 'pointer'
                                    }}
                                >
                                    {submittingReview ? 'Submitting...' : 'Post Review'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Review Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                        {reviews.length === 0 ? (
                            <div style={{ color: '#94a3b8', fontSize: '14px' }}>Be the first to review this garment!</div>
                        ) : (
                            reviews.map(r => (
                                <div key={r._id} style={{ padding: '18px', borderRadius: '10px', border: '1px solid #e4e4e7', background: '#ffffff' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <Stars value={r.rating} size={14} />
                                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: '4px' }}>
                                            {r.fitFeedback || 'True to Size'}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#09090b', marginBottom: '4px' }}>
                                        {r.title || 'Great Quality'}
                                    </div>
                                    <p style={{ fontSize: '13px', color: '#52525b', lineHeight: '1.5', margin: '0 0 10px' }}>
                                        {r.body}
                                    </p>
                                    <div style={{ fontSize: '12px', color: '#a1a1aa' }}>
                                        {r.userName} {r.sizePurchased ? `• Ordered Size ${r.sizePurchased}` : ''}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>

            {/* Size Guide Modal */}
            <SizeGuideModal 
                isOpen={isSizeGuideOpen} 
                onClose={() => setIsSizeGuideOpen(false)}
                customChart={product.sizeGuide}
                category={product.category}
            />
        </div>
    );
}
