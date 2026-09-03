import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { WishlistContext } from '../context/WishlistContext';
import { CartContext } from '../context/CartContext';
import { Heart, ShoppingBag, ArrowLeft, Trash2 } from 'lucide-react';
import { getImageUrl, formatPrice } from '../utils/helpers';
import ProductCard from '../components/ProductCard';

export default function Wishlist() {
    const navigate = useNavigate();
    const { wishlistItems, toggleWishlist, loading } = useContext(WishlistContext);

    return (
        <div style={{ backgroundColor: '#fafafa', minHeight: '80vh', padding: '40px 20px 80px', fontFamily: 'inherit' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button
                            onClick={() => navigate('/')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '8px',
                                padding: '8px 14px', cursor: 'pointer', fontWeight: '600', fontSize: '13px'
                            }}
                        >
                            <ArrowLeft size={16} /> Continue Shopping
                        </button>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#09090b', letterSpacing: '-0.5px' }}>
                                My Wishlist ({wishlistItems.length})
                            </h1>
                            <p style={{ margin: 0, fontSize: '14px', color: '#71717a' }}>
                                Garments and outfits you have saved for later
                            </p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#71717a' }}>Loading saved items...</div>
                ) : wishlistItems.length === 0 ? (
                    <div style={{
                        background: '#ffffff', borderRadius: '16px', border: '1px solid #e5e7eb',
                        padding: '60px 20px', textAlign: 'center', maxWidth: '500px', margin: '40px auto'
                    }}>
                        <div style={{
                            width: '64px', height: '64px', borderRadius: '50%', background: '#fef2f2',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
                        }}>
                            <Heart size={28} color="#ef4444" />
                        </div>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 8px', color: '#09090b' }}>
                            Your Wishlist is Empty
                        </h2>
                        <p style={{ fontSize: '14px', color: '#71717a', margin: '0 0 24px' }}>
                            Browse through our collections and tap the heart icon to save your favorite fits!
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            style={{
                                padding: '12px 28px', borderRadius: '8px', background: '#09090b',
                                color: '#ffffff', border: 'none', fontWeight: '700', fontSize: '14px', cursor: 'pointer'
                            }}
                        >
                            Explore Collections
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
                        {wishlistItems.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
