import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { ShoppingBag, Menu, X, UserRound, ArrowUpRight } from 'lucide-react';
import CartDrawer from './CartDrawer';
import API from '../api/axios';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const { cartItems } = useContext(CartContext);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  React.useEffect(() => {
    let active = true;
    API.get('/settings').then(({ data }) => {
      if (!active) return;
      const live = (data.announcements || []).find(item => item.active && item.text?.trim());
      if (live) setAnnouncement(live.text.trim());
    }).catch(() => {});
    return () => { active = false; };
  }, []);
  const count = cartItems.reduce((total, item) => total + (item.qty || 1), 0);
  const go = path => { setMenuOpen(false); navigate(path); };

  return <>
    <div className="ec-announcement">{announcement || <>PROJECT 001 IS HERE <span>·</span> FIRST DROP, LIMITED QUANTITY</>}</div>
    <header className="ec-nav">
      <button className="ec-menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">{menuOpen ? <X /> : <Menu />}</button>
      <button className="ec-wordmark" onClick={() => go('/')}>ECHO<span>CHASING</span><small>INDEPENDENT LABEL / INDIA</small></button>
      <nav className={menuOpen ? 'ec-nav-links is-open' : 'ec-nav-links'}>
        <button onClick={() => go('/#project-001')}>SHOP 001</button>
        <button onClick={() => go('/our-story')}>OUR STORY</button>
        <button onClick={() => go('/contact')}>CONTACT</button>
      </nav>
      <div className="ec-nav-actions">
        <button className="ec-account-link" onClick={() => go(user ? '/profile' : '/login')}><UserRound size={17} /><span>{user ? 'ACCOUNT' : 'LOGIN'}</span></button>
        <button className="ec-bag-button" onClick={() => setCartOpen(true)} aria-label="Open shopping bag"><ShoppingBag size={19} /><span>BAG ({count})</span></button>
      </div>
    </header>
    <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
  </>;
}
