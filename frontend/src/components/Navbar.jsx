import React, { useContext, useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { WishlistContext } from '../context/WishlistContext';
import { ShoppingBag, Search, User, Menu, X, Heart } from 'lucide-react';
import API from '../api/axios';
import CartDrawer from './CartDrawer';
import { getImageUrl, formatPrice } from '../utils/helpers';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useContext(AuthContext);
    const { cartItems } = useContext(CartContext);
    const { wishlistItems } = useContext(WishlistContext);

    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [allProducts, setAllProducts] = useState([]);

    useEffect(() => {
        API.get('/products').then(res => setAllProducts(res.data)).catch(() => {});
    }, []);

    useEffect(() => {
        if (searchQuery.trim().length > 0) {
            const query = searchQuery.toLowerCase();
            const results = allProducts.filter(p => 
                p.name.toLowerCase().includes(query) || 
                (p.category && p.category.toLowerCase().includes(query)) ||
                (p.brand && p.brand.toLowerCase().includes(query))
            );
            setSearchResults(results.slice(0, 5));
            setIsDropdownOpen(true);
        } else {
            setIsDropdownOpen(false);
        }
    }, [searchQuery, allProducts]);

    const totalCartQty = cartItems.reduce((acc, item) => acc + item.qty, 0);

    const handleCategoryClick = (gender) => {
        setIsMenuOpen(false);
        navigate(`/?gender=${gender}`);
    };

    return (
        <>
            <style>
                {`
                .nav-container { padding: 16px 40px; }
                .nav-link { 
                    font-size: 14px; font-weight: 600; color: #09090b; 
                    text-decoration: none; text-transform: uppercase; 
                    letter-spacing: 0.8px; cursor: pointer; transition: opacity 0.2s;
                }
                .nav-link:hover { opacity: 0.7; }
                @media (max-width: 900px) {
                    .nav-container { padding: 14px 18px !important; }
                    .desktop-links { display: none !important; }
                    .desktop-search { display: none !important; }
                }
                `}
            </style>

            <header style={{
                position: 'sticky', top: 0, zIndex: 900,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid #e5e7eb',
            }}>
                {/* Top Announcement Bar */}
                <div style={{
                    background: '#09090b', color: '#ffffff',
                    padding: '8px 16px', textAlign: 'center',
                    fontSize: '12px', fontWeight: '600', letterSpacing: '0.6px'
                }}>
                    ✨ COMPLIMENTARY PAN-INDIA SHIPPING ON ORDERS ABOVE ₹999 • 7-DAY EASY SIZE EXCHANGES
                </div>

                <div className="nav-container" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    maxWidth: '1360px', margin: '0 auto', width: '100%', boxSizing: 'border-box'
                }}>
                    {/* Left: Mobile Toggle & Brand Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            className="mobile-burger"
                        >
                            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>

                        <div 
                            onClick={() => navigate('/')} 
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <span style={{
                                fontSize: '22px', fontWeight: '900', color: '#09090b',
                                letterSpacing: '2px', textTransform: 'uppercase'
                            }}>
                                TRUE THREADS
                            </span>
                        </div>

                        {/* Desktop Navigation Links */}
                        <nav className="desktop-links" style={{ display: 'flex', alignItems: 'center', gap: '28px', marginLeft: '24px' }}>
                            <span onClick={() => handleCategoryClick('All')} className="nav-link">Shop All</span>
                            <span onClick={() => handleCategoryClick('Men')} className="nav-link">Men</span>
                            <span onClick={() => handleCategoryClick('Women')} className="nav-link">Women</span>
                            <span onClick={() => navigate('/?drop=new')} className="nav-link">New Drops</span>
                            <span onClick={() => navigate('/our-story')} className="nav-link">Our Story</span>
                        </nav>
                    </div>

                    {/* Right: Search, Wishlist, User, Bag */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        
                        {/* Search Input (Desktop) */}
                        <div className="desktop-search" style={{ position: 'relative', width: '220px' }}>
                            <Search size={16} color="#71717a" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                            <input 
                                placeholder="Search apparel..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%', padding: '8px 12px 8px 36px',
                                    borderRadius: '20px', border: '1px solid #e4e4e7',
                                    backgroundColor: '#f4f4f5', fontSize: '13px', outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                            {/* Autocomplete Dropdown */}
                            {isDropdownOpen && searchResults.length > 0 && (
                                <div style={{
                                    position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px',
                                    background: '#ffffff', borderRadius: '12px', border: '1px solid #e4e4e7',
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)', overflow: 'hidden', zIndex: 1000
                                }}>
                                    {searchResults.map(res => (
                                        <div
                                            key={res._id}
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                setSearchQuery('');
                                                navigate(`/product/${res.slug || res._id}`);
                                            }}
                                            style={{
                                                padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px',
                                                cursor: 'pointer', borderBottom: '1px solid #f4f4f5'
                                            }}
                                        >
                                            <img 
                                                src={getImageUrl(res.images?.[0] || res.image)} alt="" 
                                                style={{ width: '32px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                                            />
                                            <div>
                                                <div style={{ fontSize: '13px', fontWeight: '700', color: '#09090b' }}>{res.name}</div>
                                                <div style={{ fontSize: '11px', color: '#71717a' }}>₹{res.price}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Wishlist Button */}
                        <button
                            onClick={() => navigate('/wishlist')}
                            title="My Wishlist"
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                position: 'relative', display: 'flex', alignItems: 'center', padding: '4px'
                            }}
                        >
                            <Heart size={22} color="#09090b" />
                            {wishlistItems.length > 0 && (
                                <span style={{
                                    position: 'absolute', top: '-4px', right: '-6px',
                                    background: '#09090b', color: '#ffffff', fontSize: '10px',
                                    fontWeight: '800', width: '18px', height: '18px', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {wishlistItems.length}
                                </span>
                            )}
                        </button>

                        {/* User Account / Login */}
                        {user ? (
                            <div style={{ position: 'relative' }}>
                                <button
                                    onClick={() => navigate(user.role === 'admin' ? '/dashboard' : '/orders')}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        background: '#f4f4f5', border: '1px solid #e4e4e7',
                                        padding: '6px 14px', borderRadius: '20px', cursor: 'pointer',
                                        fontSize: '13px', fontWeight: '700', color: '#09090b'
                                    }}
                                >
                                    <User size={15} />
                                    {user.role === 'admin' ? 'Admin' : 'Orders'}
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => navigate('/login')}
                                style={{
                                    background: '#09090b', color: '#ffffff', border: 'none',
                                    padding: '7px 16px', borderRadius: '20px', cursor: 'pointer',
                                    fontSize: '13px', fontWeight: '700'
                                }}
                            >
                                Sign In
                            </button>
                        )}

                        {/* Cart Button */}
                        <button
                            onClick={() => setIsCartOpen(true)}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                position: 'relative', display: 'flex', alignItems: 'center', padding: '4px'
                            }}
                        >
                            <ShoppingBag size={22} color="#09090b" />
                            {totalCartQty > 0 && (
                                <span style={{
                                    position: 'absolute', top: '-4px', right: '-6px',
                                    background: '#09090b', color: '#ffffff', fontSize: '10px',
                                    fontWeight: '800', width: '18px', height: '18px', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {totalCartQty}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMenuOpen && (
                    <div style={{
                        background: '#ffffff', borderTop: '1px solid #e5e7eb',
                        padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px'
                    }}>
                        <span onClick={() => handleCategoryClick('All')} className="nav-link">Shop All</span>
                        <span onClick={() => handleCategoryClick('Men')} className="nav-link">Men</span>
                        <span onClick={() => handleCategoryClick('Women')} className="nav-link">Women</span>
                        <span onClick={() => { setIsMenuOpen(false); navigate('/?drop=new'); }} className="nav-link">New Drops</span>
                        <span onClick={() => { setIsMenuOpen(false); navigate('/wishlist'); }} className="nav-link">Wishlist ({wishlistItems.length})</span>
                        <span onClick={() => { setIsMenuOpen(false); navigate('/orders'); }} className="nav-link">My Orders</span>
                    </div>
                )}
            </header>

            {/* Slide-out Cart Drawer */}
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </>
    );
};

export default Navbar;
