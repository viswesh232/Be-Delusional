import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../api/axios';
import {
    ArrowRight, Star, Clock, Truck, ShieldCheck, RefreshCw,
    Sparkles, Filter, ChevronDown, Check
} from 'lucide-react';
import ProductCard from '../components/ProductCard';

const CATEGORIES = ['All', 'T-Shirts', 'Hoodies', 'Shirts', 'Pants', 'Jeans', 'Jackets'];
const GENDERS = ['All', 'Men', 'Women', 'Unisex'];

export default function Home() {
    const navigate = useNavigate();
    const location = useLocation();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const queryParams = new URLSearchParams(location.search);
    const initialGender = queryParams.get('gender') || 'All';
    const isNewDropOnly = queryParams.get('drop') === 'new';

    const [activeGender, setActiveGender] = useState(initialGender);
    const [activeCategory, setActiveCategory] = useState('All');
    const [sortBy, setSortBy] = useState('newest');

    useEffect(() => {
        const query = new URLSearchParams(location.search);
        const g = query.get('gender') || 'All';
        setActiveGender(g);
    }, [location.search]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            let url = '/products';
            const params = new URLSearchParams();
            if (activeGender !== 'All') params.append('gender', activeGender);
            if (activeCategory !== 'All') params.append('category', activeCategory);
            if (isNewDropOnly) params.append('isNewDrop', 'true');
            if (sortBy) params.append('sort', sortBy);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const res = await API.get(url);
            setProducts(res.data);
        } catch (err) {
            console.error('Failed to fetch products', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [activeGender, activeCategory, sortBy, isNewDropOnly]);

    return (
        <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', fontFamily: 'inherit' }}>
            
            {/* Hero Section */}
            <section style={{
                position: 'relative',
                backgroundColor: '#09090b',
                color: '#ffffff',
                padding: '100px 24px 110px',
                textAlign: 'center',
                overflow: 'hidden'
            }}>
                {/* Background subtle glow */}
                <div style={{
                    position: 'absolute', top: '-50%', left: '50%', transform: 'translateX(-50%)',
                    width: '800px', height: '400px', background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0) 70%)',
                    pointerEvents: 'none'
                }} />

                <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
                    <span style={{
                        display: 'inline-block',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        padding: '6px 16px', borderRadius: '30px',
                        fontSize: '12px', fontWeight: '700', letterSpacing: '1.5px',
                        textTransform: 'uppercase', marginBottom: '24px'
                    }}>
                        {isNewDropOnly ? '⚡ Limited Drop Release' : 'A/W 2026 Collection'}
                    </span>

                    <h1 style={{
                        fontSize: 'clamp(36px, 6vw, 64px)',
                        fontWeight: '900',
                        letterSpacing: '-1.5px',
                        lineHeight: '1.1',
                        margin: '0 0 20px',
                        textTransform: 'uppercase'
                    }}>
                        Uncompromising Fits.<br />Heavyweight Precision.
                    </h1>

                    <p style={{
                        fontSize: 'clamp(16px, 2vw, 19px)',
                        color: '#a1a1aa',
                        maxWidth: '640px',
                        margin: '0 auto 36px',
                        lineHeight: '1.6'
                    }}>
                        Engineered from 240+ GSM combed cotton with relaxed drop-shoulder silhouettes. Designed for effortless everyday layering.
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => {
                                const target = document.getElementById('collection-grid');
                                target?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            style={{
                                padding: '14px 34px', borderRadius: '8px',
                                background: '#ffffff', color: '#09090b',
                                border: 'none', fontSize: '15px', fontWeight: '700',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                            }}
                        >
                            Shop Collection <ArrowRight size={16} />
                        </button>
                        <button
                            onClick={() => navigate('/our-story')}
                            style={{
                                padding: '14px 28px', borderRadius: '8px',
                                background: 'transparent', color: '#ffffff',
                                border: '1px solid rgba(255,255,255,0.3)',
                                fontSize: '15px', fontWeight: '600', cursor: 'pointer'
                            }}
                        >
                            The Fabric Standard
                        </button>
                    </div>
                </div>
            </section>

            {/* Quick Category Banners */}
            <section style={{ maxWidth: '1360px', margin: '40px auto', padding: '0 20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                    
                    <div 
                        onClick={() => setActiveGender('Men')}
                        style={{
                            position: 'relative', height: '240px', borderRadius: '16px', overflow: 'hidden',
                            cursor: 'pointer', backgroundColor: '#18181b'
                        }}
                    >
                        <img 
                            src="https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=800&auto=format&fit=crop&q=80" 
                            alt="Men's Fits" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75, transition: 'transform 0.4s ease' }}
                            onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                        />
                        <div style={{ position: 'absolute', inset: 0, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)' }}>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#e4e4e7', textTransform: 'uppercase', letterSpacing: '1px' }}>Collection</span>
                            <h3 style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: '800', color: '#ffffff' }}>Men's Fits</h3>
                        </div>
                    </div>

                    <div 
                        onClick={() => setActiveGender('Women')}
                        style={{
                            position: 'relative', height: '240px', borderRadius: '16px', overflow: 'hidden',
                            cursor: 'pointer', backgroundColor: '#18181b'
                        }}
                    >
                        <img 
                            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80" 
                            alt="Women's Fits" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75, transition: 'transform 0.4s ease' }}
                            onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                        />
                        <div style={{ position: 'absolute', inset: 0, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)' }}>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#e4e4e7', textTransform: 'uppercase', letterSpacing: '1px' }}>Collection</span>
                            <h3 style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: '800', color: '#ffffff' }}>Women's Fits</h3>
                        </div>
                    </div>

                    <div 
                        onClick={() => setActiveCategory('Hoodies')}
                        style={{
                            position: 'relative', height: '240px', borderRadius: '16px', overflow: 'hidden',
                            cursor: 'pointer', backgroundColor: '#18181b'
                        }}
                    >
                        <img 
                            src="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80" 
                            alt="Heavyweight Hoodies" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75, transition: 'transform 0.4s ease' }}
                            onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                        />
                        <div style={{ position: 'absolute', inset: 0, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)' }}>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#e4e4e7', textTransform: 'uppercase', letterSpacing: '1px' }}>Streetwear</span>
                            <h3 style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: '800', color: '#ffffff' }}>Heavy Hoodies</h3>
                        </div>
                    </div>

                </div>
            </section>

            {/* Catalog & Filter Section */}
            <section id="collection-grid" style={{ maxWidth: '1360px', margin: '60px auto', padding: '0 20px' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px', marginBottom: '32px' }}>
                    <div>
                        <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#09090b', margin: 0, letterSpacing: '-0.5px' }}>
                            {activeGender === 'All' ? 'Complete Collection' : `${activeGender}'s Collection`}
                        </h2>
                        <p style={{ fontSize: '14px', color: '#71717a', margin: '4px 0 0' }}>
                            Showing {products.length} garments
                        </p>
                    </div>

                    {/* Sorting Dropdown */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#71717a' }}>Sort by:</span>
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                            style={{
                                padding: '8px 14px', borderRadius: '8px', border: '1px solid #e4e4e7',
                                backgroundColor: '#ffffff', fontSize: '13px', fontWeight: '600',
                                color: '#09090b', outline: 'none', cursor: 'pointer'
                            }}
                        >
                            <option value="newest">Newest Drops</option>
                            <option value="price-asc">Price: Low to High</option>
                            <option value="price-desc">Price: High to Low</option>
                            <option value="bestseller">Bestsellers</option>
                        </select>
                    </div>
                </div>

                {/* Filters Bar: Gender Tabs & Categories */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '36px' }}>
                    {/* Gender Bar */}
                    <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
                        {GENDERS.map(g => (
                            <button
                                key={g}
                                onClick={() => setActiveGender(g)}
                                style={{
                                    padding: '6px 16px', borderRadius: '20px', border: 'none',
                                    fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                                    background: activeGender === g ? '#09090b' : '#f4f4f5',
                                    color: activeGender === g ? '#ffffff' : '#71717a',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                {g}
                            </button>
                        ))}
                    </div>

                    {/* Category Pills */}
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                style={{
                                    padding: '6px 14px', borderRadius: '8px',
                                    border: activeCategory === cat ? '1px solid #09090b' : '1px solid #e5e7eb',
                                    fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                                    background: activeCategory === cat ? '#fafafa' : '#ffffff',
                                    color: activeCategory === cat ? '#09090b' : '#71717a',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Grid */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '80px 20px', color: '#71717a' }}>
                        Curating garments...
                    </div>
                ) : products.length === 0 ? (
                    <div style={{
                        textAlign: 'center', padding: '60px 20px', backgroundColor: '#fafafa',
                        borderRadius: '16px', border: '1px solid #f4f4f5', maxWidth: '500px', margin: '0 auto'
                    }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 8px' }}>No items in this filter</h3>
                        <p style={{ fontSize: '14px', color: '#71717a', margin: '0 0 20px' }}>Try switching categories or check back shortly for new drops.</p>
                        <button
                            onClick={() => { setActiveCategory('All'); setActiveGender('All'); }}
                            style={{ padding: '10px 20px', background: '#09090b', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                        >
                            Reset Filters
                        </button>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                        gap: '28px'
                    }}>
                        {products.map(product => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                )}

            </section>

            {/* Brand Perks / Standards */}
            <section style={{ backgroundColor: '#f9fafb', borderTop: '1px solid #f3f4f6', padding: '60px 20px' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '32px' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', flexShrink: 0 }}>
                            <ShieldCheck size={20} color="#09090b" />
                        </div>
                        <div>
                            <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '700' }}>240+ GSM Combed Cotton</h4>
                            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>Thick, durable, and pre-shrunk for maximum comfort and lasting shape.</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', flexShrink: 0 }}>
                            <RefreshCw size={20} color="#09090b" />
                        </div>
                        <div>
                            <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '700' }}>7-Day Size Exchanges</h4>
                            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>Wrong size? Exchange it in 1-click right from your account dashboard.</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', flexShrink: 0 }}>
                            <Truck size={20} color="#09090b" />
                        </div>
                        <div>
                            <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '700' }}>Fast Pan-India Shipping</h4>
                            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>Dispatched within 24-48 hours with real-time SMS & email tracking.</p>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
}
