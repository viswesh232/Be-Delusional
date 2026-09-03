import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../api/axios';
import {
    TrendingUp, ShoppingBag, Users, PackageOpen, 
    LogOut, UtensilsCrossed, CreditCard, Settings, 
    Bike, Search, FileText, Activity, Package, MessageSquare, ArrowUpRight, Menu, X, Sun, Moon, Lock, MessageCircle, BarChart3, Mail,
    Shirt, RefreshCw
} from 'lucide-react';

const darkTheme = {
    bg: '#0a0d0b',
    glass: 'rgba(20, 30, 24, 0.55)',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
    panelHover: 'rgba(255, 255, 255, 0.05)',
    panelBg: 'rgba(20, 30, 24, 0.4)',
    primary: '#f8fafc',
    muted: '#94a3b8',
    accent: '#2ecc71',
    accentSoft: 'rgba(46, 204, 113, 0.15)',
    ambient1: 'rgba(46,204,113,0.08)',
    ambient2: 'rgba(59,130,246,0.05)',
    shadow: 'rgba(0,0,0,0.3)',
    btnHover: 'rgba(255,255,255,0.1)'
};

const lightTheme = {
    bg: '#f4f6f8',
    glass: 'rgba(255, 255, 255, 0.8)',
    glassBorder: 'rgba(0, 0, 0, 0.08)',
    panelHover: '#ffffff',
    panelBg: '#ffffff',
    primary: '#0f172a',
    muted: '#64748b',
    accent: '#10b981',
    accentSoft: 'rgba(16, 185, 129, 0.15)',
    ambient1: 'rgba(16,185,129,0.05)',
    ambient2: 'rgba(59,130,246,0.03)',
    shadow: 'rgba(0,0,0,0.04)',
    btnHover: 'rgba(0,0,0,0.05)'
};

const statusColor = (s, isDark) => {
    const opacity = isDark ? 0.15 : 0.1;
    return {
        Placed:     { bg: `rgba(245, 158, 11, ${opacity})`, text: isDark ? '#fcd34d' : '#d97706', dot: '#fbbf24' },
        Processing: { bg: `rgba(59, 130, 246, ${opacity})`, text: isDark ? '#93c5fd' : '#2563eb', dot: '#60a5fa' },
        Preparing:  { bg: `rgba(139, 92, 246, ${opacity})`, text: isDark ? '#c4b5fd' : '#7c3aed', dot: '#a78bfa' },
        Delivered:  { bg: `rgba(16, 185, 129, ${opacity})`, text: isDark ? '#6ee7b7' : '#059669', dot: '#34d399' },
        Shipped:    { bg: `rgba(6, 182, 212, ${opacity})`, text: isDark ? '#67e8f9' : '#0891b2', dot: '#22d3ee' },
        Cancelled:  { bg: `rgba(239, 68, 68, ${opacity})`,  text: isDark ? '#fca5a5' : '#dc2626', dot: '#f87171' },
    }[s] || { bg: `rgba(148, 163, 184, ${opacity})`, text: isDark ? '#cbd5e1' : '#475569', dot: '#94a3b8' };
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { logout, user } = useContext(AuthContext);
    
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    // Theme State
    const [isDark, setIsDark] = useState(() => {
        const stored = localStorage.getItem('trueEatsAdminTheme');
        if (stored === 'light') return false;
        if (stored === 'dark') return true;
        return true;
    });
    const t = isDark ? darkTheme : lightTheme;

    useEffect(() => {
        localStorage.setItem('trueEatsAdminTheme', isDark ? 'dark' : 'light');
    }, [isDark]);

    useEffect(() => {
        const syncTheme = (event) => {
            if (event.key === 'trueEatsAdminTheme') {
                setIsDark(event.newValue !== 'light');
            }
        };
        window.addEventListener('storage', syncTheme);
        return () => window.removeEventListener('storage', syncTheme);
    }, []);

    useEffect(() => {
        Promise.all([
            API.get('/orders').catch(() => ({ data: [] })),
            API.get('/products').catch(() => ({ data: [] })),
            API.get('/admin/users').catch(() => ({ data: [] }))
        ]).then(([resOrders, resProducts, resUsers]) => {
            setOrders(resOrders.data);
            setProducts(resProducts.data);
            setUsers(resUsers.data);
            setLoading(false);
        });
    }, []);

    const formatPrice = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter(o => new Date(o.createdAt) >= today);
    const todayRevenue = todayOrders.reduce((a, o) => a + o.totalPrice, 0);
    const pendingOrders = orders.filter(o => ['Placed', 'Processing', 'Preparing'].includes(o.status));
    
    const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        d.setHours(0,0,0,0);
        const next = new Date(d);
        next.setDate(next.getDate() + 1);
        
        const dayRev = orders.filter(o => {
            const date = new Date(o.createdAt);
            return date >= d && date < next;
        }).reduce((a, o) => a + o.totalPrice, 0);
        
        return { day: d.toLocaleDateString('en-US', { weekday: 'short' }), revenue: dayRev };
    });
    const maxChartRev = Math.max(...last7Days.map(d => d.revenue), 1000);

    const workspaceModules = [
        { title: 'Live Orders',         icon: Package,         path: '/admin/orders',          color: '#f59e0b', desc: 'Active order queue' },
        { title: 'Apparel Catalog',     icon: Shirt,           path: '/admin/edit-menu',       color: '#3b82f6', desc: 'Garments & size matrix' },
        { title: 'Exchanges & Returns', icon: RefreshCw,       path: '/admin/returns',         color: '#6366f1', desc: 'Size replacements & desk' },
        { title: 'Payments Ledger',     icon: CreditCard,      path: '/admin/payments',        color: '#10b981', desc: 'Transactions & refunds' },
        { title: 'Delivery Info',     icon: Bike,            path: '/admin/delivery',        color: '#ef4444', desc: 'Dispatch routes' },
        { title: 'Customer Search',   icon: Search,          path: '/admin/customer-search', color: '#8b5cf6', desc: 'User directory' },
        { title: 'Bill Generator',    icon: FileText,        path: '/admin/bills',           color: '#64748b', desc: 'Custom receipts' },
        { title: 'Reviews',           icon: MessageSquare,   path: '/admin/reviews',         color: '#06b6d4', desc: 'Customer feedback' },
        { title: 'Support Inbox',     icon: MessageCircle,   path: '/admin/support',         color: '#0ea5e9', desc: 'Support tickets' },
        { title: 'Reach Out',         icon: Mail,            path: '/admin/reach-out',       color: '#ec4899', desc: 'Contact messages' },
        { title: 'System Settings',   icon: Settings,        path: '/admin/settings',        color: '#f97316', desc: 'Fees & coupons' },
        { title: 'Permissions',       icon: Lock,            path: '/admin/permissions',     color: '#dc2626', desc: 'Role management' },
        { title: 'Revenue Report',    icon: BarChart3,       path: '/admin/revenue',         color: '#d946ef', desc: 'Deep dive metrics' },
    ];

    return (
        <div style={{ minHeight: '100vh', backgroundColor: t.bg, fontFamily: "'Inter', sans-serif", position: 'relative', overflow: 'hidden', transition: 'background-color 0.3s ease', color: t.primary }}>
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                
                body { margin: 0; }
                
                .ambient-glow-1 { position: absolute; top: -10%; left: -10%; width: 60vw; height: 60vw; background: radial-gradient(circle, ${t.ambient1} 0%, rgba(0,0,0,0) 70%); border-radius: 50%; pointer-events: none; z-index: 0; filter: blur(60px); animation: float 20s ease-in-out infinite; transition: background 0.5s ease; }
                .ambient-glow-2 { position: absolute; bottom: -20%; right: -10%; width: 70vw; height: 70vw; background: radial-gradient(circle, ${t.ambient2} 0%, rgba(0,0,0,0) 70%); border-radius: 50%; pointer-events: none; z-index: 0; filter: blur(80px); animation: float 25s ease-in-out infinite reverse; transition: background 0.5s ease; }
                
                @keyframes float { 0% { transform: translate(0, 0) scale(1); } 50% { transform: translate(5%, 5%) scale(1.05); } 100% { transform: translate(0, 0) scale(1); } }

                .glass-panel {
                    background: ${t.panelBg}; backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
                    border: 1px solid ${t.glassBorder}; border-radius: 24px;
                    box-shadow: 0 8px 32px ${t.shadow}, inset 0 1px 0 rgba(255,255,255,0.05);
                    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), border-color 0.3s ease, background 0.3s ease;
                }
                .glass-panel:hover { border-color: ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}; }

                .tool-card {
                    background: ${isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'}; border: 1px solid ${t.glassBorder};
                    border-radius: 16px; padding: 20px; cursor: pointer; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    display: flex; flex-direction: column; gap: 12px;
                }
                .tool-card:hover {
                    background: ${t.panelHover}; border-color: ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}; transform: translateY(-4px);
                    box-shadow: 0 10px 20px ${t.shadow};
                }

                .chart-bar { transition: height 1s cubic-bezier(0.175, 0.885, 0.32, 1.275); position: relative; overflow: hidden; }
                .chart-bar::after { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%); }
                .chart-bar:hover { opacity: 0.8; filter: brightness(1.2); }

                .theme-toggle:hover { background: ${t.btnHover} !important; }

                .admin-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: start; }
                .nav-desktop-links { display: flex; align-items: center; gap: 24px; }
                .mobile-menu-btn { display: none; }
                
                @media (max-width: 1024px) {
                    .admin-grid { grid-template-columns: 1fr; }
                    .nav-desktop-links { display: none !important; }
                    .mobile-menu-btn { display: block !important; }
                    .dashboard-pad { padding: 24px 20px !important; }
                    .kpi-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 16px !important; }
                }
                `}
            </style>

            <div className="ambient-glow-1"></div>
            <div className="ambient-glow-2"></div>

            {/* Top Glass Navbar */}
            <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: t.glass, backdropFilter: 'blur(20px)', borderBottom: `1px solid ${t.glassBorder}`, height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', transition: 'all 0.3s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(true)} style={{ background: 'none', border: 'none', color: t.primary, cursor: 'pointer', padding: 0 }}>
                        <Menu size={28} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate('/')}>
                        <div style={{ background: `linear-gradient(135deg, ${t.accent}, #10b981)`, padding: '8px', borderRadius: '12px', boxShadow: `0 0 15px ${t.accentSoft}` }}>
                            <Activity color="#000" size={22} strokeWidth={2.5} />
                        </div>
                        <span style={{ fontWeight: '900', fontSize: '22px', letterSpacing: '-0.5px', color: t.primary }}>
                            Command Center
                        </span>
                    </div>
                </div>

                <div className="nav-desktop-links">
                    {/* Theme Toggle Button */}
                    <button className="theme-toggle" onClick={() => setIsDark(!isDark)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', borderRadius: '50%', background: 'transparent', border: `1px solid ${t.glassBorder}`, color: t.primary, cursor: 'pointer', transition: 'all 0.2s' }} title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                        {isDark ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    <div style={{ height: '32px', width: '1px', backgroundColor: t.glassBorder }}></div>
                    
                    <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: t.muted, fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e=>e.currentTarget.style.color=t.primary} onMouseLeave={e=>e.currentTarget.style.color=t.muted}>
                        View Storefront <ArrowUpRight size={16} />
                    </button>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', padding: '6px 16px 6px 6px', borderRadius: '50px', border: `1px solid ${t.glassBorder}` }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `linear-gradient(135deg, ${t.accent}, #10b981)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#000', fontSize: '14px' }}>
                            {user?.firstName?.charAt(0) || 'A'}
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: t.primary }}>{user?.firstName || 'Admin'}</span>
                    </div>
                    <button onClick={() => { logout(); navigate('/'); }} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', borderRadius: '12px', padding: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(239, 68, 68, 0.2)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(239, 68, 68, 0.1)'} title="Secure Logout">
                        <LogOut size={18} />
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${t.glassBorder}` }}>
                        <div style={{ fontWeight: '900', fontSize: '20px', color: t.primary }}>Command Center</div>
                        <X size={28} color={t.primary} cursor="pointer" onClick={() => setMobileMenuOpen(false)} />
                    </div>
                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', fontSize: '18px', fontWeight: 700 }}>
                        <div onClick={() => setIsDark(!isDark)} style={{ color: t.primary, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {isDark ? <Sun size={20}/> : <Moon size={20}/>} Toggle Theme
                        </div>
                        <div onClick={() => { navigate('/'); setMobileMenuOpen(false); }} style={{ color: t.primary }}>View Storefront</div>
                        <div onClick={() => { navigate('/admin/orders'); setMobileMenuOpen(false); }} style={{ color: t.primary }}>Live Orders</div>
                        <div onClick={() => { navigate('/admin/edit-menu'); setMobileMenuOpen(false); }} style={{ color: t.primary }}>Menu Manager</div>
                        <div onClick={() => { logout(); setMobileMenuOpen(false); navigate('/'); }} style={{ color: '#ef4444', marginTop: '20px' }}>Log Out</div>
                    </div>
                </div>
            )}

            <main className="dashboard-pad" style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
                
                {/* KPI Section */}
                <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
                    {[
                        { label: "Today's Revenue", value: loading ? '-' : formatPrice(todayRevenue), icon: TrendingUp, glow: 'rgba(46, 204, 113, 0.2)', iconColor: '#2ecc71' },
                        { label: "Pending Orders",  value: loading ? '-' : pendingOrders.length, icon: ShoppingBag, glow: 'rgba(245, 158, 11, 0.2)', iconColor: '#fbbf24' },
                        { label: 'Active Catalog',  value: loading ? '-' : products.length, icon: PackageOpen, glow: 'rgba(59, 130, 246, 0.2)', iconColor: '#3b82f6' },
                        { label: 'Total Customers', value: loading ? '-' : users.length, icon: Users, glow: 'rgba(168, 85, 247, 0.2)', iconColor: '#a855f7' },
                    ].map((s, i) => (
                        <div key={i} className="glass-panel" style={{ padding: '32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                                <div style={{ backgroundColor: s.glow, padding: '12px', borderRadius: '14px', border: `1px solid ${s.iconColor}40`, boxShadow: `0 0 20px ${s.glow}` }}>
                                    <s.icon size={24} color={s.iconColor} strokeWidth={2.5} />
                                </div>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: t.muted, textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</span>
                            </div>
                            <h3 style={{ margin: 0, fontSize: '40px', fontWeight: 900, color: t.primary, letterSpacing: '-1px' }}>{s.value}</h3>
                        </div>
                    ))}
                </div>

                {/* Workspace Modules - All 11 Options */}
                <div style={{ marginBottom: '40px' }}>
                    <h3 style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: 800, color: t.primary, letterSpacing: '0.5px' }}>Workspace Modules</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                        {workspaceModules.map((module, i) => (
                            <div key={i} className="tool-card" onClick={() => navigate(module.path)}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ backgroundColor: `${module.color}15`, padding: '10px', borderRadius: '10px', border: `1px solid ${module.color}30` }}>
                                        <module.icon size={20} color={module.color} />
                                    </div>
                                    <span style={{ fontSize: '15px', fontWeight: 700, color: t.primary }}>{module.title}</span>
                                </div>
                                <span style={{ fontSize: '13px', color: t.muted }}>{module.desc}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="admin-grid">
                    
                    {/* Left Column: Chart */}
                    <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <h3 style={{ margin: '0 0 40px', fontSize: '20px', fontWeight: 800, color: t.primary, letterSpacing: '0.5px' }}>Revenue Trajectory (7D)</h3>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'clamp(12px, 2vw, 40px)', height: '260px' }}>
                            {last7Days.map((day, i) => {
                                const heightPercentage = Math.max((day.revenue / maxChartRev) * 100, 4);
                                const isToday = i === 6;
                                return (
                                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', height: '100%' }}>
                                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%', position: 'relative' }}>
                                            <div className="chart-bar" style={{ 
                                                width: '100%', maxWidth: '56px', margin: '0 auto',
                                                height: `${heightPercentage}%`, 
                                                background: isToday ? `linear-gradient(180deg, ${t.accent} 0%, rgba(46,204,113,0.1) 100%)` : `linear-gradient(180deg, ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'} 0%, transparent 100%)`, 
                                                borderRadius: '8px 8px 0 0',
                                                borderTop: `1px solid ${isToday ? (isDark ? '#fff' : t.accent) : t.glassBorder}`,
                                                boxShadow: isToday ? `0 0 30px ${t.accentSoft}` : 'none'
                                            }} title={formatPrice(day.revenue)}></div>
                                        </div>
                                        <span style={{ fontSize: '13px', fontWeight: isToday ? 800 : 600, color: isToday ? t.accent : t.muted }}>{day.day}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Column: Live Order Stream */}
                    <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                            <h3 style={{ margin: 0, color: t.primary, fontWeight: 800, fontSize: '20px', letterSpacing: '0.5px' }}>Live Order Stream</h3>
                            <button onClick={() => navigate('/admin/orders')} className="theme-toggle" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', border: `1px solid ${t.glassBorder}`, color: t.primary, borderRadius: '8px', padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                                View All
                            </button>
                        </div>

                        {loading ? (
                            <p style={{ textAlign: 'center', color: t.muted, padding: '40px 0', fontSize: '14px' }}>Syncing data...</p>
                        ) : orders.length === 0 ? (
                            <p style={{ textAlign: 'center', color: t.muted, padding: '40px 0', fontSize: '14px' }}>Awaiting new orders.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                                {orders.slice(0, 5).map(o => {
                                    const sc = statusColor(o.status, isDark);
                                    return (
                                        <div key={o._id} onClick={() => navigate(`/admin/order/view/${o._id}`)}
                                            style={{ display: 'flex', gap: '20px', alignItems: 'center', cursor: 'pointer', padding: '16px', borderRadius: '16px', background: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff', border: `1px solid ${t.glassBorder}`, transition: 'all 0.3s ease' }}
                                            onMouseEnter={e => { e.currentTarget.style.background = t.panelHover; e.currentTarget.style.transform = 'translateX(6px)'; e.currentTarget.style.borderColor = sc.dot; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.02)' : '#ffffff'; e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.borderColor = t.glassBorder; }}
                                        >
                                            <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: sc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${sc.dot}40`, boxShadow: `0 0 15px ${sc.bg}` }}>
                                                <Package size={22} color={sc.text} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                    <span style={{ fontWeight: 800, fontSize: '16px', color: t.primary }}>#{o.orderId}</span>
                                                    <span style={{ fontWeight: 800, color: t.accent, fontSize: '16px' }}>{formatPrice(o.totalPrice)}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '14px', color: t.muted, fontWeight: 500 }}>{o.user?.firstName} {o.user?.lastName}</span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: sc.bg, padding: '4px 12px', borderRadius: '20px', border: `1px solid ${sc.dot}30` }}>
                                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: sc.dot, boxShadow: `0 0 8px ${sc.dot}` }}></div>
                                                        <span style={{ fontSize: '11px', fontWeight: 800, color: sc.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{o.status}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;