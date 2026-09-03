import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Eye } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { WishlistContext } from '../context/WishlistContext';
import { getImageUrl, formatPrice } from '../utils/helpers';

export default function ProductCard({ product }) {
    const navigate = useNavigate();
    const { addToCart } = useContext(CartContext);
    const { isInWishlist, toggleWishlist } = useContext(WishlistContext);
    
    const [isHovered, setIsHovered] = useState(false);
    const [selectedSize, setSelectedSize] = useState(
        product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'M'
    );
    const [addedToast, setAddedToast] = useState(false);

    const isFav = isInWishlist(product._id);

    const primaryImg = (product.images && product.images.length > 0)
        ? getImageUrl(product.images[0])
        : (product.image ? getImageUrl(product.image) : '/placeholder-fashion.jpg');

    const secondaryImg = (product.images && product.images.length > 1)
        ? getImageUrl(product.images[1])
        : primaryImg;

    const hasDiscount = product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price;
    const discountPercent = hasDiscount
        ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
        : 0;

    const displayPrice = hasDiscount ? product.discountPrice : product.price;

    const handleQuickAdd = (e, size) => {
        e.stopPropagation();
        const sizeToAdd = size || selectedSize;
        addToCart(product, 1, { size: sizeToAdd });
        setAddedToast(true);
        setTimeout(() => setAddedToast(false), 1800);
    };

    const handleCardClick = () => {
        navigate(`/product/${product.slug || product._id}`);
    };

    return (
        <div 
            onClick={handleCardClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                borderRadius: '12px',
                overflow: 'hidden',
                backgroundColor: '#ffffff',
                border: '1px solid #f0f0f0',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                boxShadow: isHovered ? '0 12px 24px -10px rgba(0,0,0,0.12)' : 'none'
            }}
        >
            {/* Image Container */}
            <div style={{
                position: 'relative',
                width: '100%',
                paddingTop: '130%', // Tall fashion portrait ratio (approx 3:4)
                overflow: 'hidden',
                backgroundColor: '#f8f9fa'
            }}>
                <img 
                    src={isHovered ? secondaryImg : primaryImg}
                    alt={product.name}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.5s ease, opacity 0.3s ease',
                        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                    }}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80';
                    }}
                />

                {/* Badges Top Left */}
                <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 2 }}>
                    {product.isNewDrop && (
                        <span style={{
                            background: '#09090b', color: '#ffffff', fontSize: '10px', fontWeight: '700',
                            padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.8px'
                        }}>
                            New Drop
                        </span>
                    )}
                    {hasDiscount && (
                        <span style={{
                            background: '#ef4444', color: '#ffffff', fontSize: '10px', fontWeight: '700',
                            padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.8px'
                        }}>
                            -{discountPercent}%
                        </span>
                    )}
                </div>

                {/* Wishlist Button Top Right */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product);
                    }}
                    style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(4px)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2,
                        transition: 'transform 0.2s ease, background 0.2s ease',
                        transform: isFav ? 'scale(1.1)' : 'scale(1)'
                    }}
                >
                    <Heart size={16} color={isFav ? '#ef4444' : '#18181b'} fill={isFav ? '#ef4444' : 'none'} />
                </button>

                {/* Quick Add Overlay on Hover */}
                {product.sizes && product.sizes.length > 0 && (
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(8px)',
                        padding: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transform: isHovered ? 'translateY(0)' : 'translateY(100%)',
                        transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                        zIndex: 3
                    }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#71717a', marginRight: '4px', textTransform: 'uppercase' }}>
                            Sizes:
                        </span>
                        {product.sizes.map((s) => (
                            <button
                                key={s}
                                onClick={(e) => handleQuickAdd(e, s)}
                                title={`Add size ${s} to cart`}
                                style={{
                                    border: '1px solid #e4e4e7',
                                    background: '#ffffff',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    color: '#09090b',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = '#09090b';
                                    e.target.style.color = '#ffffff';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = '#ffffff';
                                    e.target.style.color = '#09090b';
                                }}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Product Meta */}
            <div style={{ padding: '14px 12px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {product.gender || 'Unisex'} • {product.category}
                    </span>
                    {product.brand && (
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#71717a' }}>
                            {product.brand}
                        </span>
                    )}
                </div>

                <h3 style={{
                    margin: '2px 0 6px',
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#09090b',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>
                    {product.name}
                </h3>

                {/* Price Display */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#09090b' }}>
                        {formatPrice(displayPrice)}
                    </span>
                    {hasDiscount && (
                        <span style={{ fontSize: '13px', color: '#a1a1aa', textDecoration: 'line-through' }}>
                            {formatPrice(product.price)}
                        </span>
                    )}
                </div>

                {addedToast && (
                    <span style={{
                        marginTop: '6px',
                        fontSize: '11px',
                        color: '#16a34a',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        ✓ Added to bag!
                    </span>
                )}
            </div>
        </div>
    );
}
