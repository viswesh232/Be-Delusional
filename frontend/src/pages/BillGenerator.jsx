import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Search, Printer, FileText,
    Plus, Minus, Trash2, ShoppingBag, User, Receipt, Layers
} from 'lucide-react';

const colors = {
    forest: '#1a4331',
    peach: '#fcd5ce',
    chocolate: '#4a2c2a',
    white: '#ffffff',
    bg: '#f4f7f6',
    slate: '#64748b',
    light: '#f1f5f9',
};

const inputStyle = {
    padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0',
    backgroundColor: '#f1f5f9', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box'
};
const qtyBtnStyle = {
    border: '1px solid #e2e8f0', background: '#fff', borderRadius: '6px',
    width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
};

// ─── Shared bill HTML builder ─────────────────────────────────────────────────
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', [String.fromCharCode(39)]: '&#39;',
}[char]));

const buildBillHtml = (bill) => {
    const rows = bill.items.map(item => `
        <div style="display:flex;justify-content:space-between;margin-bottom:5px;font-size:13px;">
            <span>${Number(item.qty) || 0}x ${escapeHtml(item.name)}</span>
            <span>₹${(Number(item.price || 0) * Number(item.qty || 0)).toFixed(2)}</span>
        </div>`).join('');
    return `
        <div style="font-family:'Courier New',monospace;color:#222;padding:12px 16px;">
            <div style="text-align:center;border-bottom:2px dashed #000;padding-bottom:8px;margin-bottom:8px;">
                <h3 style="margin:0;letter-spacing:2px;font-size:15px;">ECHO CHASING</h3>
                <p style="margin:2px 0;font-size:10px;opacity:.7;">Less noise. More meaning. Always moving.</p>
            </div>
            <p style="font-size:11px;margin:3px 0;"><b>Bill No:</b> ${escapeHtml(bill.orderId)}</p>
            <p style="font-size:11px;margin:3px 0;"><b>Customer:</b> ${escapeHtml(bill.customerName)}</p>
            ${bill.address ? `<p style="font-size:11px;margin:3px 0;"><b>Address:</b> ${escapeHtml(bill.address)}</p>` : ''}
            <p style="font-size:11px;margin:3px 0;"><b>Date:</b> ${new Date().toLocaleString()}</p>
            <hr style="border:none;border-top:1px dashed #000;margin:8px 0;"/>
            ${rows}
            <hr style="border:none;border-top:1px dashed #000;margin:8px 0;"/>
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px;"><span>Subtotal</span><span>Rs.${bill.subtotal.toFixed(2)}</span></div>
            ${bill.deliveryFee ? `<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px;"><span>Delivery Fee</span><span>Rs.${bill.deliveryFee.toFixed(2)}</span></div>` : ''}
            ${bill.couponDiscount > 0 ? `<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px;color:#16a34a;"><span>Coupon Discount</span><span>Rs.-${bill.couponDiscount.toFixed(2)}</span></div>` : ''}
            ${bill.userDiscount > 0 ? `<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px;color:#16a34a;"><span>First-order Discount</span><span>Rs.-${bill.userDiscount.toFixed(2)}</span></div>` : ''}
            <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:14px;margin-top:4px;border-top:1px solid #000;padding-top:4px;"><span>TOTAL</span><span>Rs.${bill.total.toFixed(2)}</span></div>
            ${bill.adminNote ? `<hr style="border:none;border-top:1px dashed #000;margin:8px 0;"/><p style="font-size:11px;margin:3px 0;font-style:italic;"><b>Note:</b> ${escapeHtml(bill.adminNote)}</p>` : ''}
            <div style="text-align:center;border-top:1px dashed #000;margin-top:8px;padding-top:6px;font-size:10px;opacity:.7;">
                <p style="margin:2px 0;">Thank you for choosing Echo Chasing.</p>
                <p style="margin:2px 0;">Visit us again ♥</p>
            </div>
        </div>`;
};

// ─── Single bill print ────────────────────────────────────────────────────────
const triggerPrint = (bill) => {
    const iframe = document.createElement('iframe');
    Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: 'none' });
    document.body.appendChild(iframe);
    const html = `<html><head><title>Bill ${bill.orderId}</title>
    <style>
        @page { size: A4; margin: 15mm; }
        body { margin: 0; font-family: 'Courier New', monospace; }
    </style></head><body>${buildBillHtml(bill)}</body></html>`;
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    iframe.onload = () => setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        document.body.removeChild(iframe);
    }, 400);
};

// ─── Bulk print: up to 4 bills, 2×2 on one A4 page ───────────────────────────
const triggerBulkPrint = (bills) => {
    const iframe = document.createElement('iframe');
    Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: 'none' });
    document.body.appendChild(iframe);
    const cells = bills.map(b => `
        <div style="width:48%;box-sizing:border-box;border:1px dashed #bbb;padding:4px;page-break-inside:avoid;">
            ${buildBillHtml(b)}
        </div>`).join('');
    const html = `<html><head><title>Bulk Bills</title>
    <style>
        @page { size: A4; margin: 8mm; }
        body { margin: 0; font-family: 'Courier New', monospace; }
        .grid { display: flex; flex-wrap: wrap; gap: 2%; }
    </style></head><body>
        <div class="grid">${cells}</div>
    </body></html>`;
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    iframe.onload = () => setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        document.body.removeChild(iframe);
    }, 400);
};

// ─── Bill Preview Card ────────────────────────────────────────────────────────
const BillPreview = ({ bill, onPrint }) => (
    <div style={{ backgroundColor: colors.white, borderRadius: '24px', padding: '30px', boxShadow: '0 15px 40px rgba(0,0,0,0.06)', border: `1px solid ${colors.peach}` }}>
        <div style={{ textAlign: 'center', borderBottom: '2px dashed #ddd', paddingBottom: '16px', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, letterSpacing: '3px', color: colors.forest }}>ECHO CHASING</h2>
            <p style={{ margin: '4px 0', fontSize: '12px', color: colors.slate }}>The way food was meant to be</p>
        </div>

        <div style={{ fontSize: '13px', color: colors.slate, marginBottom: '16px', lineHeight: '1.8' }}>
            <div><b>Bill No:</b> {bill.orderId}</div>
            <div><b>Customer:</b> {bill.customerName}</div>
            {bill.address && <div><b>Address:</b> {bill.address}</div>}
            <div><b>Date:</b> {new Date().toLocaleString()}</div>
        </div>

        <div style={{ borderTop: '1px dashed #ddd', borderBottom: '1px dashed #ddd', padding: '12px 0', marginBottom: '12px' }}>
            {bill.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                    <span>{item.qty}x {item.name}</span>
                    <span style={{ fontWeight: 'bold' }}>₹{(item.price * item.qty).toFixed(2)}</span>
                </div>
            ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: colors.slate, marginBottom: '4px' }}>
            <span>Subtotal</span><span>₹{bill.subtotal.toFixed(2)}</span>
        </div>
        {bill.deliveryFee > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: colors.slate, marginBottom: '4px' }}>
                <span>Delivery Fee</span><span>₹{bill.deliveryFee.toFixed(2)}</span>
            </div>
        )}
        {bill.couponDiscount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#16a34a', marginBottom: '4px' }}>
                <span>Coupon Discount</span><span>−₹{bill.couponDiscount.toFixed(2)}</span>
            </div>
        )}
        {bill.userDiscount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#16a34a', marginBottom: '4px' }}>
                <span>First-order Discount</span><span>−₹{bill.userDiscount.toFixed(2)}</span>
            </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '18px', color: colors.forest, marginTop: '10px', borderTop: '2px solid #eee', paddingTop: '10px' }}>
            <span>TOTAL</span><span>₹{bill.total.toFixed(2)}</span>
        </div>

        <button onClick={onPrint} style={{
            marginTop: '20px', width: '100%', backgroundColor: colors.forest, color: '#fff',
            border: 'none', padding: '16px', borderRadius: '14px', fontWeight: 'bold',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '15px'
        }}>
            <Printer size={18} /> Print Bill
        </button>
    </div>
);

// ─── MODE 1: Order Bill ───────────────────────────────────────────────────────
const OrderBillMode = () => {
    const [query, setQuery] = useState('');
    const [order, setOrder] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // All orders list + date range
    const [allOrders, setAllOrders] = useState([]);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Load all orders once on mount
    useEffect(() => {
        API.get('/orders')
            .then(({ data }) => setAllOrders(data))
            .catch(console.error);
    }, []);

    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setError('');
        setOrder(null);
        try {
            const { data } = await API.get(`/orders/${query.trim()}`);
            setOrder(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Order not found');
        }
        setLoading(false);
    };

    // Auto-uppercase as user types
    const handleQueryChange = (e) => {
        setQuery(e.target.value.toUpperCase());
    };

    // Filter the sidebar list by date range
    const filteredList = allOrders.filter(o => {
        const created = new Date(o.createdAt);
        if (dateFrom && created < new Date(dateFrom)) return false;
        if (dateTo) {
            const end = new Date(dateTo);
            end.setHours(23, 59, 59, 999);
            if (created > end) return false;
        }
        return true;
    });

    const makeBill = (o) => {
        const subtotal = o.orderItems.reduce((acc, i) => acc + i.price * i.qty, 0);
        const couponDiscount = Number(o.couponDiscount || 0);
        const userDiscount = Number(o.userDiscount || 0);
        const deliveryFee = Number(o.totalPrice || 0) - subtotal + couponDiscount + userDiscount;

        return {
            orderId: o.orderId || o._id.slice(-6).toUpperCase(),
            customerName: `${o.user?.firstName || ''} ${o.user?.lastName || ''}`.trim() || 'Guest',
            address: o.shippingAddress,
            items: o.orderItems.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
            subtotal,
            deliveryFee,
            couponDiscount,
            userDiscount,
            total: o.totalPrice,
        };
    };

    const bill = order ? makeBill(order) : null;

    const statusColor = (s) => ({
        Placed: '#f59e0b', Processing: '#3b82f6', Preparing: '#8b5cf6',
        Delivered: '#10b981', Shipped: '#06b6d4', Cancelled: '#ef4444'
    }[s] || colors.slate);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 1fr', gap: '24px', alignItems: 'start' }}>

            {/* ── Column 1: Orders list with date range ── */}
            <div style={{ backgroundColor: colors.white, borderRadius: '20px', padding: '20px', boxShadow: '0 8px 24px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', color: colors.forest, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    All Orders
                    <span style={{ marginLeft: 'auto', backgroundColor: colors.light, color: colors.slate, fontSize: '12px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '8px' }}>
                        {filteredList.length}
                    </span>
                </h3>

                {/* Date range */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: colors.slate, textTransform: 'uppercase', letterSpacing: '0.5px' }}>From</label>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                        style={{ ...inputStyle, padding: '8px 12px', fontSize: '13px' }} />
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: colors.slate, textTransform: 'uppercase', letterSpacing: '0.5px' }}>To</label>
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                        style={{ ...inputStyle, padding: '8px 12px', fontSize: '13px' }} />
                    {(dateFrom || dateTo) && (
                        <button onClick={() => { setDateFrom(''); setDateTo(''); }}
                            style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                            ✕ Clear filter
                        </button>
                    )}
                </div>

                {/* List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
                    {filteredList.length === 0 && (
                        <p style={{ fontSize: '13px', color: colors.slate, textAlign: 'center', padding: '20px 0' }}>No orders in range</p>
                    )}
                    {filteredList.map(o => (
                        <div key={o._id}
                            onClick={() => { setOrder(o); setQuery(o.orderId); setError(''); }}
                            style={{
                                padding: '12px', borderRadius: '12px', cursor: 'pointer',
                                border: `2px solid ${order?._id === o._id ? colors.forest : 'transparent'}`,
                                backgroundColor: order?._id === o._id ? '#f0fdf4' : colors.light,
                                transition: '0.15s'
                            }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: '800', fontSize: '13px', color: colors.forest }}>#{o.orderId}</span>
                                <span style={{ fontSize: '11px', fontWeight: 'bold', color: statusColor(o.status) }}>{o.status}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: colors.slate, marginTop: '3px' }}>{o.user?.firstName} {o.user?.lastName}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>₹{o.totalPrice} · {new Date(o.createdAt).toLocaleDateString()}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Column 2: Search box ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ backgroundColor: colors.white, borderRadius: '20px', padding: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
                    <h3 style={{ margin: '0 0 16px', color: colors.forest, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px' }}>
                        <Search size={18} /> Search by Order ID
                    </h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            value={query}
                            onChange={handleQueryChange}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            placeholder="e.g. TRU-101"
                            style={{ flex: 1, padding: '13px 16px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '15px', outline: 'none', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}
                        />
                        <button onClick={handleSearch} disabled={loading} style={{
                            padding: '13px 20px', backgroundColor: colors.forest, color: '#fff',
                            border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold',
                            display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap'
                        }}>
                            <Search size={16} /> {loading ? 'Searching...' : 'Search'}
                        </button>
                    </div>
                    {error && <p style={{ color: '#ef4444', marginTop: '10px', fontSize: '13px', margin: '10px 0 0' }}>⚠ {error}</p>}
                </div>

                {/* Selected order detail */}
                {order && (
                    <div style={{ backgroundColor: colors.white, borderRadius: '20px', padding: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <span style={{ fontWeight: '900', fontSize: '20px', color: colors.forest }}>#{order.orderId}</span>
                            <span style={{ fontSize: '13px', fontWeight: 'bold', padding: '4px 12px', borderRadius: '20px', backgroundColor: colors.light, color: statusColor(order.status) }}>
                                {order.status}
                            </span>
                        </div>
                        <div style={{ fontSize: '14px', color: colors.slate, lineHeight: '2' }}>
                            <div><b>Customer:</b> {order.user?.firstName} {order.user?.lastName}</div>
                            <div><b>Address:</b> {order.shippingAddress || '—'}</div>
                            <div><b>Date:</b> {new Date(order.createdAt).toLocaleString()}</div>
                            <div><b>Total:</b> ₹{order.totalPrice}</div>
                        </div>
                        <div style={{ marginTop: '12px', padding: '12px', backgroundColor: colors.light, borderRadius: '12px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: colors.slate, marginBottom: '8px' }}>ITEMS</div>
                            {order.orderItems.map((item, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                                    <span>{item.qty}x {item.name}</span>
                                    <span style={{ fontWeight: 'bold' }}>₹{item.price * item.qty}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {!order && (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: colors.slate }}>
                        <Receipt size={50} style={{ opacity: 0.15, marginBottom: '12px', display: 'block', margin: '0 auto 12px' }} />
                        <p style={{ fontSize: '14px' }}>Select from the list or search by ID</p>
                    </div>
                )}
            </div>

            {/* ── Column 3: Bill preview ── */}
            <div>
                {bill ? (
                    <BillPreview bill={bill} onPrint={() => triggerPrint(bill)} />
                ) : (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.slate }}>
                        <Receipt size={60} style={{ opacity: 0.15, display: 'block', margin: '0 auto 16px' }} />
                        <p style={{ fontSize: '14px' }}>Bill preview will appear here</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── MODE 3: Custom Bill ──────────────────────────────────────────────────────
const CustomBillMode = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [cart, setCart] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [address, setAddress] = useState('');
    const [deliveryFee, setDeliveryFee] = useState(40);
    const [adminNote, setAdminNote] = useState('');
    const [searchMenu, setSearchMenu] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    useEffect(() => {
        API.get('/products').then(({ data }) => setMenuItems(data)).catch(console.error);
    }, []);

    const categories = ['All', ...new Set(menuItems.map(p => p.category))];
    const filtered = menuItems.filter(p =>
        (activeCategory === 'All' || p.category === activeCategory) &&
        p.name.toLowerCase().includes(searchMenu.toLowerCase())
    );

    const addItem = (product) => {
        const exist = cart.find(x => x._id === product._id);
        if (exist) {
            setCart(cart.map(x => x._id === product._id ? { ...x, qty: x.qty + 1 } : x));
        } else {
            setCart([...cart, { ...product, qty: 1 }]);
        }
    };

    const changeQty = (id, delta) => {
        setCart(prev => prev
            .map(x => x._id === id ? { ...x, qty: x.qty + delta } : x)
            .filter(x => x.qty > 0)
        );
    };

    const subtotal = cart.reduce((acc, i) => acc + i.price * i.qty, 0);
    const total = subtotal + Number(deliveryFee || 0);

    const bill = cart.length > 0 ? {
        orderId: (() => { const n = Math.max(1000, parseInt(localStorage.getItem('eatsBillCounter') || '1000')); localStorage.setItem('eatsBillCounter', n + 1); return `EATS-${n}`; })(),
        customerName: customerName || 'Walk-in Customer',
        address,
        adminNote,
        items: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
        subtotal,
        deliveryFee: Number(deliveryFee || 0),
        total,
    } : null;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', alignItems: 'start' }}>

            {/* Left — Menu picker + cart */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Customer info */}
                <div style={{ backgroundColor: colors.white, borderRadius: '20px', padding: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
                    <h3 style={{ margin: '0 0 16px', color: colors.forest, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px' }}>
                        <User size={18} /> Customer Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <input
                            value={customerName}
                            onChange={e => setCustomerName(e.target.value)}
                            placeholder="Customer name"
                            style={inputStyle}
                        />
                        <input
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            placeholder="Delivery address (optional)"
                            style={inputStyle}
                        />
                    </div>
                    <textarea
                        value={adminNote}
                        onChange={e => setAdminNote(e.target.value)}
                        placeholder="Admin note (e.g. Birthday order, handle with care, no onions...) — prints on the bill"
                        rows={2}
                        style={{ ...inputStyle, marginTop: '12px', resize: 'none', fontFamily: 'inherit' }}
                    />
                </div>

                {/* Menu search & category filter */}
                <div style={{ backgroundColor: colors.white, borderRadius: '20px', padding: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
                    <h3 style={{ margin: '0 0 16px', color: colors.forest, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px' }}>
                        <ShoppingBag size={18} /> Add Items from Menu
                    </h3>
                    <input
                        value={searchMenu}
                        onChange={e => setSearchMenu(e.target.value)}
                        placeholder="Search dishes..."
                        style={{ ...inputStyle, marginBottom: '12px', width: '100%', boxSizing: 'border-box' }}
                    />
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                        {categories.map(cat => (
                            <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                                padding: '6px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                                fontWeight: 'bold', fontSize: '13px',
                                backgroundColor: activeCategory === cat ? colors.forest : colors.light,
                                color: activeCategory === cat ? '#fff' : colors.slate,
                            }}>{cat}</button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                        {filtered.map(p => {
                            const inCart = cart.find(x => x._id === p._id);
                            return (
                                <div key={p._id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '12px 16px', borderRadius: '12px',
                                    backgroundColor: inCart ? '#f0fdf4' : colors.light,
                                    border: inCart ? '1px solid #bbf7d0' : '1px solid transparent'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '14px', color: colors.chocolate }}>{p.name}</div>
                                        <div style={{ fontSize: '12px', color: colors.slate }}>₹{p.price} · {p.category}</div>
                                    </div>
                                    {inCart ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <button onClick={() => changeQty(p._id, -1)} style={qtyBtnStyle}><Minus size={14} /></button>
                                            <span style={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>{inCart.qty}</span>
                                            <button onClick={() => changeQty(p._id, 1)} style={qtyBtnStyle}><Plus size={14} /></button>
                                        </div>
                                    ) : (
                                        <button onClick={() => addItem(p)} style={{
                                            backgroundColor: colors.forest, color: '#fff', border: 'none',
                                            borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px'
                                        }}>+ Add</button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Cart summary */}
                {cart.length > 0 && (
                    <div style={{ backgroundColor: colors.white, borderRadius: '20px', padding: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, color: colors.forest, fontSize: '16px' }}>Cart ({cart.length} items)</h3>
                            <button onClick={() => setCart([])} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                                <Trash2 size={14} /> Clear
                            </button>
                        </div>
                        {cart.map(item => (
                            <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '14px' }}>
                                <span>{item.qty}x {item.name}</span>
                                <span style={{ fontWeight: 'bold' }}>₹{item.price * item.qty}</span>
                            </div>
                        ))}
                        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <label style={{ fontSize: '13px', color: colors.slate, whiteSpace: 'nowrap' }}>Delivery fee (₹)</label>
                            <input
                                type="number"
                                value={deliveryFee}
                                onChange={e => setDeliveryFee(e.target.value)}
                                style={{ ...inputStyle, width: '80px', padding: '8px 12px' }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Right — Bill preview */}
            <div>
                {bill ? (
                    <BillPreview bill={bill} onPrint={() => triggerPrint(bill)} />
                ) : (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.slate }}>
                        <ShoppingBag size={60} style={{ opacity: 0.2, marginBottom: '16px' }} />
                        <p>Add items from the menu to build a custom bill</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── MODE 2: Bulk Print (up to 4 orders, 2×2 on one A4) ─────────────────────
const BulkPrintMode = () => {
    const [allOrders, setAllOrders] = useState([]);
    const [selected, setSelected] = useState([]); // up to 4 order objects
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [query, setQuery] = useState('');

    useEffect(() => {
        API.get('/orders').then(({ data }) => setAllOrders(data)).catch(console.error);
    }, []);

    const statusColor = (s) => ({
        Placed: '#f59e0b', Processing: '#3b82f6', Preparing: '#8b5cf6',
        Delivered: '#10b981', Shipped: '#06b6d4', Cancelled: '#ef4444'
    }[s] || colors.slate);

    const filteredList = allOrders.filter(o => {
        const created = new Date(o.createdAt);
        if (dateFrom && created < new Date(dateFrom)) return false;
        if (dateTo) { const e = new Date(dateTo); e.setHours(23,59,59,999); if (created > e) return false; }
        if (query && !o.orderId?.toLowerCase().includes(query.toLowerCase()) &&
            !o.user?.firstName?.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
    });

    const toggle = (o) => {
        const exists = selected.find(x => x._id === o._id);
        if (exists) {
            setSelected(selected.filter(x => x._id !== o._id));
        } else {
            if (selected.length >= 4) return alert('Maximum 4 orders can be printed on one A4 sheet');
            setSelected([...selected, o]);
        }
    };

    const makeBill = (o) => {
        const subtotal = o.orderItems.reduce((acc, i) => acc + i.price * i.qty, 0);
        const couponDiscount = Number(o.couponDiscount || 0);
        const userDiscount = Number(o.userDiscount || 0);
        const deliveryFee = Number(o.totalPrice || 0) - subtotal + couponDiscount + userDiscount;

        return {
            orderId: o.orderId || o._id.slice(-6).toUpperCase(),
            customerName: `${o.user?.firstName || ''} ${o.user?.lastName || ''}`.trim() || 'Guest',
            address: o.shippingAddress,
            items: o.orderItems.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
            subtotal,
            deliveryFee,
            couponDiscount,
            userDiscount,
            total: o.totalPrice,
        };
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>

            {/* Left: order picker */}
            <div style={{ backgroundColor: colors.white, borderRadius: '20px', padding: '20px', boxShadow: '0 8px 24px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', color: colors.forest }}>Select Orders</h3>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', padding: '3px 10px', borderRadius: '20px',
                        backgroundColor: selected.length === 4 ? '#fef3c7' : colors.light,
                        color: selected.length === 4 ? '#92400e' : colors.slate }}>
                        {selected.length}/4 selected
                    </span>
                </div>

                {/* Search */}
                <input value={query} onChange={e => setQuery(e.target.value)}
                    placeholder="Search by order ID or name..."
                    style={{ ...inputStyle, padding: '8px 12px', fontSize: '13px' }} />

                {/* Date range */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                        <label style={{ fontSize: '10px', fontWeight: 'bold', color: colors.slate, textTransform: 'uppercase' }}>From</label>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                            style={{ ...inputStyle, padding: '6px 10px', fontSize: '12px', marginTop: '4px' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: '10px', fontWeight: 'bold', color: colors.slate, textTransform: 'uppercase' }}>To</label>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                            style={{ ...inputStyle, padding: '6px 10px', fontSize: '12px', marginTop: '4px' }} />
                    </div>
                </div>
                {(dateFrom || dateTo) && (
                    <button onClick={() => { setDateFrom(''); setDateTo(''); }}
                        style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                        ✕ Clear date filter
                    </button>
                )}

                {/* Order list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '460px', overflowY: 'auto' }}>
                    {filteredList.length === 0 && <p style={{ fontSize: '13px', color: colors.slate, textAlign: 'center', padding: '20px 0' }}>No orders found</p>}
                    {filteredList.map(o => {
                        const isSelected = !!selected.find(x => x._id === o._id);
                        const isDisabled = !isSelected && selected.length >= 4;
                        return (
                            <div key={o._id} onClick={() => !isDisabled && toggle(o)} style={{
                                padding: '10px 12px', borderRadius: '12px', cursor: isDisabled ? 'not-allowed' : 'pointer',
                                border: `2px solid ${isSelected ? colors.forest : 'transparent'}`,
                                backgroundColor: isSelected ? '#f0fdf4' : isDisabled ? '#fafafa' : colors.light,
                                opacity: isDisabled ? 0.5 : 1, transition: '0.15s',
                                display: 'flex', alignItems: 'center', gap: '10px'
                            }}>
                                <div style={{
                                    width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0,
                                    border: `2px solid ${isSelected ? colors.forest : '#cbd5e1'}`,
                                    backgroundColor: isSelected ? colors.forest : 'transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {isSelected && <span style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}>✓</span>}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontWeight: '800', fontSize: '13px', color: colors.forest }}>#{o.orderId}</span>
                                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: statusColor(o.status) }}>{o.status}</span>
                                    </div>
                                    <div style={{ fontSize: '11px', color: colors.slate }}>{o.user?.firstName} · ₹{o.totalPrice} · {new Date(o.createdAt).toLocaleDateString()}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right: preview + print */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {selected.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.slate, backgroundColor: colors.white, borderRadius: '20px' }}>
                        <Printer size={50} style={{ opacity: 0.15, display: 'block', margin: '0 auto 16px' }} />
                        <p style={{ fontSize: '14px' }}>Select 1–4 orders from the list to bulk print</p>
                        <p style={{ fontSize: '12px', opacity: 0.6 }}>Up to 4 bills fit on one A4 page, 2 per row</p>
                    </div>
                ) : (
                    <>
                        {/* Selected bills preview grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: selected.length > 1 ? '1fr 1fr' : '1fr', gap: '16px' }}>
                            {selected.map(o => (
                                <div key={o._id} style={{ backgroundColor: colors.white, borderRadius: '16px', padding: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', border: `1px solid ${colors.peach}`, fontSize: '12px', position: 'relative' }}>
                                    <button onClick={() => toggle(o)} style={{
                                        position: 'absolute', top: '8px', right: '8px', border: 'none',
                                        background: '#fee2e2', color: '#ef4444', borderRadius: '6px',
                                        width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px'
                                    }}>✕</button>
                                    <div style={{ textAlign: 'center', borderBottom: '1px dashed #ddd', paddingBottom: '8px', marginBottom: '8px' }}>
                                        <div style={{ fontWeight: '900', letterSpacing: '2px', color: colors.forest, fontSize: '13px' }}>TRUE EATS</div>
                                    </div>
                                    <div style={{ color: colors.slate, lineHeight: '1.7' }}>
                                        <div><b>#{o.orderId}</b></div>
                                        <div>{o.user?.firstName} {o.user?.lastName}</div>
                                        <div>₹{o.totalPrice}</div>
                                    </div>
                                    <div style={{ marginTop: '6px', borderTop: '1px dashed #ddd', paddingTop: '6px' }}>
                                        {o.orderItems.map((item, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                                                <span>{item.qty}x {item.name}</span>
                                                <span>₹{item.price * item.qty}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Action buttons */}
                        <div style={{ backgroundColor: colors.white, borderRadius: '20px', padding: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <div>
                                    <div style={{ fontWeight: '800', fontSize: '16px', color: colors.forest }}>{selected.length} bill{selected.length > 1 ? 's' : ''} ready to print</div>
                                    <div style={{ fontSize: '13px', color: colors.slate, marginTop: '2px' }}>
                                        {selected.length > 1 ? 'All fit on one A4 page, 2 per row' : 'Will print on one full page'}
                                    </div>
                                </div>
                                <button onClick={() => setSelected([])} style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                                    Clear all
                                </button>
                            </div>
                            <button
                                onClick={() => triggerBulkPrint(selected.map(makeBill))}
                                style={{
                                    width: '100%', backgroundColor: colors.forest, color: '#fff',
                                    border: 'none', padding: '16px', borderRadius: '14px', fontWeight: 'bold',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '15px'
                                }}>
                                <Printer size={18} /> Print {selected.length} Bill{selected.length > 1 ? 's' : ''} Together
                            </button>
                            {selected.length > 1 && (
                                <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                                    {selected.map(o => (
                                        <button key={o._id}
                                            onClick={() => triggerPrint(makeBill(o))}
                                            style={{ flex: 1, padding: '10px', backgroundColor: colors.light, color: colors.forest, border: `1px solid #e2e8f0`, borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                                            Print #{o.orderId} only
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const BillGenerator = () => {
    const [mode, setMode] = useState('order'); // 'order' | 'bulk' | 'custom'
    const navigate = useNavigate();

    const tabs = [
        { id: 'order',  label: '📋 Order Bill',   desc: 'Print bill from existing order' },
        { id: 'bulk',   label: '🖨️ Bulk Print',   desc: 'Print up to 4 orders at once'   },
        { id: 'custom', label: '✏️ Custom Bill',  desc: 'Build a manual bill'             },
    ];

    return (
        <div style={{ backgroundColor: colors.bg, minHeight: '100vh', padding: '40px', fontFamily: "'Inter', sans-serif" }}>

            {/* Header */}
            <header style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '36px' }}>
                <div onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer', padding: '10px', backgroundColor: colors.white, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <ArrowLeft size={20} color={colors.forest} />
                </div>
                <div>
                    <h1 style={{ margin: 0, fontWeight: '900', color: colors.forest, fontSize: '28px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FileText size={30} /> Bill Generator
                    </h1>
                    <p style={{ margin: '4px 0 0', color: colors.slate, fontSize: '14px' }}>Print bills from existing orders, bulk print, or build a custom one</p>
                </div>
            </header>

            {/* Mode toggle — 3 tabs */}
            <div style={{ display: 'inline-flex', backgroundColor: colors.white, borderRadius: '16px', padding: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', marginBottom: '32px', gap: '4px' }}>
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setMode(t.id)} style={{
                        padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                        fontWeight: 'bold', fontSize: '14px', transition: '0.2s',
                        backgroundColor: mode === t.id ? colors.forest : 'transparent',
                        color: mode === t.id ? '#fff' : colors.slate,
                    }}>
                        {t.label}
                    </button>
                ))}
            </div>

            {mode === 'order'  && <OrderBillMode />}
            {mode === 'bulk'   && <BulkPrintMode />}
            {mode === 'custom' && <CustomBillMode />}
        </div>
    );
};

export default BillGenerator;