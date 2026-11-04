import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import {
    ArrowLeft, Settings, Tag, Percent, Truck, IndianRupee, Megaphone,
    ToggleLeft, ToggleRight, Lock, Trash2, Plus,
    Save, CheckCircle, Shield, Package, Loader
} from 'lucide-react';

const c = {
    forest: '#1a4331', peach: '#fcd5ce', chocolate: '#4a2c2a',
    white: '#ffffff', bg: '#f4f7f6', slate: '#64748b', light: '#f1f5f9',
    danger: '#ef4444', success: '#10b981', warning: '#f59e0b',
};

const DEFAULT = {
    deliveryFee: 40, minOrderValue: 199, platformFee: 5,
    gstPercent: 5, gstEnabled: true, freeDeliveryAbove: 499,
    freeDeliveryEnabled: true, orderingEnabled: true, codEnabled: true,
    newUserDiscount: 0, newUserDiscountEnabled: false,
    coupons: [], hiddenCoupons: [], restrictedUsers: [], announcements: [],
};

// ── Reusable Section wrapper ─────────────────────────────────────────────────
const Section = ({ title, icon, iconColor = c.forest, children, onSave, changes = 0, saving = false }) => (
    <div style={{ backgroundColor: c.white, borderRadius: '24px', padding: '28px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: `2px solid ${c.light}`, paddingBottom: '16px' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: c.forest, fontSize: '17px', fontWeight: '800' }}>
                <div style={{ backgroundColor: c.peach, padding: '8px', borderRadius: '10px' }}>
                    {React.createElement(icon, { size: 18, color: iconColor })}
                </div>
                {title}
                {changes > 0 && (
                    <span style={{ backgroundColor: c.warning, color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '20px' }}>
                        {changes} unsaved
                    </span>
                )}
            </h3>
            {onSave && (
                <button onClick={onSave} disabled={saving || changes === 0} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    backgroundColor: changes > 0 ? c.forest : '#e2e8f0',
                    color: changes > 0 ? '#fff' : c.slate,
                    border: 'none', padding: '10px 20px', borderRadius: '12px',
                    fontWeight: 'bold', cursor: changes > 0 ? 'pointer' : 'default', fontSize: '13px',
                }}>
                    {saving ? <Loader size={14} /> : <Save size={14} />} Save
                </button>
            )}
        </div>
        {children}
    </div>
);

// ── Number / text field ──────────────────────────────────────────────────────
const Field = ({ label, hint, value, onChange, type = 'number', prefix, suffix }) => (
    <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: c.slate, marginBottom: '6px' }}>{label}</label>
        {hint && <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#94a3b8' }}>{hint}</p>}
        <div style={{ display: 'flex', alignItems: 'center', border: '2px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', backgroundColor: c.light }}>
            {prefix && <span style={{ padding: '0 12px', fontSize: '15px', color: c.slate, backgroundColor: '#f8fafc', borderRight: '1px solid #e2e8f0', height: '46px', display: 'flex', alignItems: 'center' }}>{prefix}</span>}
            <input type={type} value={value}
                onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
                style={{ flex: 1, border: 'none', padding: '12px 14px', fontSize: '15px', outline: 'none', backgroundColor: 'transparent', fontWeight: '600', fontFamily: 'inherit' }} />
            {suffix && <span style={{ padding: '0 12px', fontSize: '13px', color: c.slate, backgroundColor: '#f8fafc', borderLeft: '1px solid #e2e8f0', height: '46px', display: 'flex', alignItems: 'center' }}>{suffix}</span>}
        </div>
    </div>
);

// ── Toggle row ───────────────────────────────────────────────────────────────
const Toggle = ({ label, hint, value, onChange }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: `1px solid ${c.light}` }}>
        <div>
            <div style={{ fontWeight: '700', fontSize: '14px', color: c.chocolate }}>{label}</div>
            {hint && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{hint}</div>}
        </div>
        <button onClick={() => onChange(!value)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
            {value ? <ToggleRight size={40} color={c.success} /> : <ToggleLeft size={40} color="#cbd5e1" />}
        </button>
    </div>
);

// ── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ msg, error }) => msg ? (
    <div style={{
        position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
        backgroundColor: error ? c.danger : c.forest, color: '#fff',
        padding: '14px 28px', borderRadius: '50px',
        display: 'flex', alignItems: 'center', gap: '10px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)', fontWeight: 'bold',
        zIndex: 999, fontSize: '14px',
    }}>
        <CheckCircle size={18} color={c.peach} /> {msg}
    </div>
) : null;

// ────────────────────────────────────────────────────────────────────────────
const SystemSettings = () => {
    const navigate = useNavigate();
    const [s, setS] = useState(DEFAULT);        // current (possibly unsaved) state
    const [saved, setSaved] = useState(DEFAULT); // last saved snapshot from DB
    const [pageLoading, setPageLoading] = useState(true);
    const [savingSection, setSavingSection] = useState('');
    const [toast, setToast] = useState({ msg: '', error: false });
    const [users, setUsers] = useState([]);

    // New coupon form
    const [newCoupon, setNewCoupon] = useState({ code: '', type: 'percent', value: '', desc: '' });
    // New hidden coupon
    const [newHidden, setNewHidden] = useState({ code: '', type: 'percent', value: '', desc: '', minOrder: '' });
    // New restriction
    const [newRestrict, setNewRestrict] = useState('');
    // ── Load settings from DB on mount ──
    useEffect(() => {
        Promise.all([
            API.get('/settings/admin'),
            API.get('/admin/users'),
        ]).then(([settingsRes, usersRes]) => {
            const data = { ...DEFAULT, ...settingsRes.data };
            setS(data);
            setSaved(data);
            setUsers(usersRes.data);
        }).catch(() => {
            setToast({ msg: 'Failed to load settings', error: true });
            setTimeout(() => setToast({ msg: '', error: false }), 2500);
        }).finally(() => setPageLoading(false));
    }, []);

    function showToast(msg, error = false) {
        setToast({ msg, error });
        setTimeout(() => setToast({ msg: '', error: false }), 2500);
    }

    // ── Save a specific section to DB ──
    const saveSection = async (keys, label) => {
        setSavingSection(label);
        const patch = {};
        keys.forEach(k => { patch[k] = s[k]; });
        try {
            const { data } = await API.put('/settings', patch);
            const next = { ...DEFAULT, ...data };
            setS(next);
            setSaved(next);
            showToast(`${label} saved`);
        } catch {
            showToast(`Failed to save ${label}`, true);
        }
        setSavingSection('');
    };

    // ── Save all ──
    const saveAll = async () => {
        setSavingSection('all');
        try {
            const { data } = await API.put('/settings', s);
            const next = { ...DEFAULT, ...data };
            setS(next);
            setSaved(next);
            showToast('All settings saved');
        } catch {
            showToast('Failed to save settings', true);
        }
        setSavingSection('');
    };

    const countChanges = (keys) => keys.filter(k => JSON.stringify(s[k]) !== JSON.stringify(saved[k])).length;

    const inpStyle = { width: '100%', padding: '11px 14px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box', backgroundColor: c.light, fontFamily: 'inherit' };
    const selectStyle = { ...inpStyle, cursor: 'pointer' };
    const addBtn = { display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: c.forest, color: '#fff', border: 'none', padding: '11px 18px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' };
    const deleteBtn = { border: 'none', background: '#fee2e2', color: c.danger, padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
    const tagStyle = (bg = '#e0f2fe', text = '#0369a1') => ({ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', backgroundColor: bg, color: text });

    // ── Coupon helpers ──
    const addCoupon = async () => {
        if (!newCoupon.code.trim() || !newCoupon.value) return alert('Fill in code and value');
        const coupon = { ...newCoupon, code: newCoupon.code.toUpperCase() };
        const updated = [...s.coupons, coupon];
        try {
            const { data } = await API.put('/settings', { coupons: updated });
            const next = { ...s, coupons: data.coupons };
            setS(next); setSaved(next);
            setNewCoupon({ code: '', type: 'percent', value: '', desc: '', minOrder: '' });
            showToast(`Coupon ${coupon.code} added`);
        } catch { showToast('Failed to add coupon', true); }
    };

    const deleteCoupon = async (id) => {
        const updated = s.coupons.filter(cp => cp._id !== id && cp.id !== id);
        try {
            const { data } = await API.put('/settings', { coupons: updated });
            const next = { ...s, coupons: data.coupons };
            setS(next); setSaved(next);
            showToast('Coupon deleted');
        } catch { showToast('Failed to delete coupon', true); }
    };

    // ── Hidden coupon helpers ──
    const addHiddenCoupon = async () => {
        if (!newHidden.code.trim() || !newHidden.value) return alert('Fill in code and value');
        const coupon = { ...newHidden, code: newHidden.code.toUpperCase(), minOrder: Number(newHidden.minOrder) || 0 };
        const updated = [...(s.hiddenCoupons || []), coupon];
        try {
            const { data } = await API.put('/settings', { hiddenCoupons: updated });
            const next = { ...s, hiddenCoupons: data.hiddenCoupons };
            setS(next); setSaved(next);
            setNewHidden({ code: '', type: 'percent', value: '', desc: '', minOrder: '' });
            showToast(`Hidden coupon ${coupon.code} added`);
        } catch { showToast('Failed to add hidden coupon', true); }
    };

    const deleteHiddenCoupon = async (id) => {
        const updated = (s.hiddenCoupons || []).filter(d => (d._id || d.code) !== id);
        try {
            const { data } = await API.put('/settings', { hiddenCoupons: updated });
            const next = { ...s, hiddenCoupons: data.hiddenCoupons };
            setS(next); setSaved(next);
            showToast('Hidden coupon removed');
        } catch { showToast('Failed to remove hidden coupon', true); }
    };

    // ── Restriction helpers ──
    const addRestriction = async () => {
        if (!newRestrict) return;
        const u = users.find(x => x._id === newRestrict);
        const entry = { userId: newRestrict, userName: u ? `${u.firstName} ${u.lastName}` : newRestrict };
        const updated = [...s.restrictedUsers, entry];
        try {
            const { data } = await API.put('/settings', { restrictedUsers: updated });
            const next = { ...s, restrictedUsers: data.restrictedUsers };
            setS(next); setSaved(next);
            setNewRestrict('');
            showToast('User restricted');
        } catch { showToast('Failed to restrict user', true); }
    };

    const removeRestriction = async (id) => {
        const updated = s.restrictedUsers.filter(r => (r._id || r.id) !== id);
        try {
            const { data } = await API.put('/settings', { restrictedUsers: updated });
            const next = { ...s, restrictedUsers: data.restrictedUsers };
            setS(next); setSaved(next);
            showToast('Restriction removed');
        } catch { showToast('Failed to remove restriction', true); }
    };

    if (pageLoading) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg, fontFamily: "'Inter', sans-serif" }}>
            <div style={{ textAlign: 'center', color: c.slate }}>
                <Loader size={36} color={c.forest} style={{ marginBottom: '12px', animation: 'spin 1s linear infinite' }} />
                <p>Loading settings...</p>
            </div>
        </div>
    );

    return (
        <div style={{ backgroundColor: c.bg, minHeight: '100vh', padding: '40px', fontFamily: "'Inter', sans-serif" }}>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

            <Toast msg={toast.msg} error={toast.error} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer', padding: '10px', backgroundColor: c.white, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <ArrowLeft size={20} color={c.forest} />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontWeight: '900', color: c.forest, fontSize: '26px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Settings size={26} /> System Settings
                        </h1>
                        <p style={{ margin: '4px 0 0', color: c.slate, fontSize: '13px' }}>All changes save to the database and apply instantly to the app</p>
                    </div>
                </div>
                <button onClick={saveAll} disabled={savingSection === 'all'} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    backgroundColor: c.forest, color: '#fff', border: 'none',
                    padding: '13px 24px', borderRadius: '14px', fontWeight: 'bold',
                    cursor: 'pointer', fontSize: '14px',
                }}>
                    {savingSection === 'all' ? <Loader size={16} /> : <Save size={16} />} Save All Changes
                </button>
            </div>

            {/* ── 1. FEES & PRICING ── */}
            <Section title="Fees & Pricing" icon={IndianRupee}
                onSave={() => saveSection(['deliveryFee','minOrderValue','platformFee','gstPercent','gstEnabled','freeDeliveryAbove','freeDeliveryEnabled'], 'Fees')}
                changes={countChanges(['deliveryFee','minOrderValue','platformFee','gstPercent','gstEnabled','freeDeliveryAbove','freeDeliveryEnabled'])}
                saving={savingSection === 'Fees'}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <Field label="Delivery Fee" hint="Charged per order" prefix="₹" value={s.deliveryFee} onChange={v => setS({ ...s, deliveryFee: v })} />
                    <Field label="Minimum Order Value" hint="Customer must order at least this much" prefix="₹" value={s.minOrderValue} onChange={v => setS({ ...s, minOrderValue: v })} />
                    <Field label="Platform Fee" hint="Added to every order as a service charge" prefix="₹" value={s.platformFee} onChange={v => setS({ ...s, platformFee: v })} />
                    <Field label="GST Percentage" hint="Applied on subtotal if GST is enabled" value={s.gstPercent} onChange={v => setS({ ...s, gstPercent: v })} suffix="%" />
                </div>
                <Toggle label="GST Enabled" hint="Show and charge GST on customer orders" value={s.gstEnabled} onChange={v => setS({ ...s, gstEnabled: v })} />
                <Toggle label="Free Delivery Above Threshold" hint={`Free delivery when order subtotal exceeds ₹${s.freeDeliveryAbove}`} value={s.freeDeliveryEnabled} onChange={v => setS({ ...s, freeDeliveryEnabled: v })} />
                {s.freeDeliveryEnabled && (
                    <div style={{ marginTop: '12px' }}>
                        <Field label="Free Delivery Threshold" prefix="₹" value={s.freeDeliveryAbove} onChange={v => setS({ ...s, freeDeliveryAbove: v })} />
                    </div>
                )}
            </Section>

            {/* ── 2. ORDERING CONTROL ── */}
            <Section title="Ordering Control" icon={Package} iconColor={c.danger}
                onSave={() => saveSection(['orderingEnabled','codEnabled','newUserDiscount','newUserDiscountEnabled'], 'Order settings')}
                changes={countChanges(['orderingEnabled','codEnabled','newUserDiscount','newUserDiscountEnabled'])}
                saving={savingSection === 'Order settings'}>
                <Toggle label="Ordering Enabled" hint="Turn OFF to temporarily stop all new orders (holidays, maintenance)" value={s.orderingEnabled} onChange={v => setS({ ...s, orderingEnabled: v })} />
                <Toggle label="Cash on Delivery Enabled" hint="Turn OFF to hide and block COD for customers at checkout" value={s.codEnabled} onChange={v => setS({ ...s, codEnabled: v })} />
                <Toggle label="First Order Discount" hint="Auto-apply a discount when a customer places their very first order" value={s.newUserDiscountEnabled} onChange={v => setS({ ...s, newUserDiscountEnabled: v })} />
                {s.newUserDiscountEnabled && (
                    <div style={{ marginTop: '12px' }}>
                        <Field label="First Order Discount %" value={s.newUserDiscount} onChange={v => setS({ ...s, newUserDiscount: v })} suffix="%" />
                    </div>
                )}
            </Section>

            {/* ── 3. COUPON CODES ── */}
            <Section title="Coupon Codes" icon={Tag} iconColor="#0ea5e9">
                <div style={{ backgroundColor: c.light, borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                    <p style={{ margin: '0 0 14px', fontWeight: '700', fontSize: '13px', color: c.slate, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Create New Coupon</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                        <div>
                            <label style={{ fontSize: '11px', fontWeight: '700', color: c.slate, display: 'block', marginBottom: '5px' }}>CODE</label>
                            <input value={newCoupon.code} onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })} placeholder="SUMMER20" style={inpStyle} />
                        </div>
                        <div>
                            <label style={{ fontSize: '11px', fontWeight: '700', color: c.slate, display: 'block', marginBottom: '5px' }}>TYPE</label>
                            <select value={newCoupon.type} onChange={e => setNewCoupon({ ...newCoupon, type: e.target.value })} style={selectStyle}>
                                <option value="percent">Percentage (%)</option>
                                <option value="flat">Flat amount (₹)</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '11px', fontWeight: '700', color: c.slate, display: 'block', marginBottom: '5px' }}>VALUE</label>
                            <input type="number" value={newCoupon.value} onChange={e => setNewCoupon({ ...newCoupon, value: e.target.value })} placeholder={newCoupon.type === 'percent' ? '20' : '50'} style={inpStyle} />
                        </div>
                        <div>
                            <label style={{ fontSize: '11px', fontWeight: '700', color: c.slate, display: 'block', marginBottom: '5px' }}>MINIMUM ORDER</label>
                            <input type="number" value={newCoupon.minOrder} onChange={e => setNewCoupon({ ...newCoupon, minOrder: e.target.value })} placeholder="100" style={inpStyle} />
                        </div>
                        <div>
                            <label style={{ fontSize: '11px', fontWeight: '700', color: c.slate, display: 'block', marginBottom: '5px' }}>DESCRIPTION</label>
                            <input value={newCoupon.desc} onChange={e => setNewCoupon({ ...newCoupon, desc: e.target.value })} placeholder="e.g. Festival offer" style={inpStyle} />
                        </div>
                        <button onClick={addCoupon} style={{ ...addBtn, height: '44px' }}><Plus size={16} /> Add</button>
                    </div>
                </div>
                {s.coupons.length === 0 ? (
                    <p style={{ textAlign: 'center', color: c.slate, padding: '20px 0', fontSize: '14px' }}>No coupons yet. Create one above.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {s.coupons.map(cp => (
                            <div key={cp._id || cp.code} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', backgroundColor: c.light, borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontWeight: '900', fontSize: '16px', letterSpacing: '1px', color: c.forest, fontFamily: 'monospace' }}>{cp.code}</span>
                                    <span style={tagStyle(cp.type === 'percent' ? '#dbeafe' : '#d1fae5', cp.type === 'percent' ? '#1e40af' : '#065f46')}>
                                        {cp.type === 'percent' ? `${cp.value}% off` : `₹${cp.value} off`}
                                    </span>
                                    {cp.desc && <span style={{ fontSize: '13px', color: c.slate }}>{cp.desc}</span>}
                                </div>
                                <button onClick={() => deleteCoupon(cp._id || cp.code)} style={deleteBtn}><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>
                )}
            </Section>

            {/* ── 4. HIDDEN COUPONS ── */}
            <Section title="Hidden Coupons" icon={Percent} iconColor={c.success}>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: c.slate }}>
                    Hidden coupons work exactly like regular coupons but are <strong>never shown</strong> to customers in the cart. 
                    You send them privately (via Customer Profile → Send Coupon) and customers apply them by typing the code.
                </p>
                <div style={{ backgroundColor: c.light, borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                    <p style={{ margin: '0 0 14px', fontWeight: '700', fontSize: '13px', color: c.slate, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Create Hidden Coupon</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                        <div>
                            <label style={{ fontSize: '11px', fontWeight: '700', color: c.slate, display: 'block', marginBottom: '5px' }}>CODE</label>
                            <input value={newHidden.code} onChange={e => setNewHidden({ ...newHidden, code: e.target.value.toUpperCase() })} placeholder="VIP20" style={inpStyle} />
                        </div>
                        <div>
                            <label style={{ fontSize: '11px', fontWeight: '700', color: c.slate, display: 'block', marginBottom: '5px' }}>TYPE</label>
                            <select value={newHidden.type} onChange={e => setNewHidden({ ...newHidden, type: e.target.value })} style={selectStyle}>
                                <option value="percent">% off</option>
                                <option value="flat">₹ off</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '11px', fontWeight: '700', color: c.slate, display: 'block', marginBottom: '5px' }}>VALUE</label>
                            <input type="number" value={newHidden.value} onChange={e => setNewHidden({ ...newHidden, value: e.target.value })} placeholder="15" style={inpStyle} />
                        </div>
                        <div>
                            <label style={{ fontSize: '11px', fontWeight: '700', color: c.slate, display: 'block', marginBottom: '5px' }}>MIN ORDER ₹</label>
                            <input type="number" value={newHidden.minOrder} onChange={e => setNewHidden({ ...newHidden, minOrder: e.target.value })} placeholder="0" style={inpStyle} />
                        </div>
                        <div>
                            <label style={{ fontSize: '11px', fontWeight: '700', color: c.slate, display: 'block', marginBottom: '5px' }}>NOTE</label>
                            <input value={newHidden.desc} onChange={e => setNewHidden({ ...newHidden, desc: e.target.value })} placeholder="e.g. VIP customer" style={inpStyle} />
                        </div>
                        <button onClick={addHiddenCoupon} style={{ ...addBtn, height: '44px' }}><Plus size={16} /> Add</button>
                    </div>
                </div>
                {(!s.hiddenCoupons || s.hiddenCoupons.length === 0) ? (
                    <p style={{ textAlign: 'center', color: c.slate, padding: '20px 0', fontSize: '14px' }}>No hidden coupons yet.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {s.hiddenCoupons.map(cp => (
                            <div key={cp._id || cp.code} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', backgroundColor: '#fdf4ff', borderRadius: '14px', border: '1px solid #e9d5ff' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontWeight: '900', fontSize: '15px', letterSpacing: '1px', color: '#7e22ce', fontFamily: 'monospace' }}>{cp.code}</span>
                                    <span style={tagStyle('#ede9fe', '#5b21b6')}>
                                        {cp.type === 'percent' ? `${cp.value}% off` : `₹${cp.value} off`}
                                    </span>
                                    {cp.minOrder > 0 && <span style={tagStyle('#f3f4f6', '#374151')}>min ₹{cp.minOrder}</span>}
                                    {cp.desc && <span style={{ fontSize: '12px', color: c.slate }}>{cp.desc}</span>}
                                    <span style={tagStyle('#fdf4ff', '#9333ea')}>🔒 Hidden</span>
                                </div>
                                <button onClick={() => deleteHiddenCoupon(cp._id || cp.code)} style={deleteBtn}><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>
                )}
            </Section>

            {/* ── 5. MENU AVAILABILITY ── */}
            <MenuAvailabilitySection />

            {/* ── 6. USER RESTRICTIONS ── */}
            <Section title="User Restrictions" icon={Shield} iconColor={c.danger}>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: c.slate }}>Restricted users will see an error and cannot place orders.</p>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
                    <select value={newRestrict} onChange={e => setNewRestrict(e.target.value)} style={{ ...selectStyle, flex: 1 }}>
                        <option value="">Select user to restrict…</option>
                        {users.filter(u => !s.restrictedUsers.find(r => r.userId === u._id)).map(u => (
                            <option key={u._id} value={u._id}>{u.firstName} {u.lastName} — {u.email}</option>
                        ))}
                    </select>
                    <button onClick={addRestriction} style={{ ...addBtn, backgroundColor: c.danger }}>
                        <Lock size={15} /> Restrict
                    </button>
                </div>
                {s.restrictedUsers.length === 0 ? (
                    <p style={{ textAlign: 'center', color: c.slate, fontSize: '14px', padding: '10px 0' }}>No restricted users.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {s.restrictedUsers.map(r => (
                            <div key={r._id || r.userId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', backgroundColor: '#fff1f2', borderRadius: '14px', border: '1px solid #fecdd3' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Lock size={16} color={c.danger} />
                                    <span style={{ fontWeight: '700', color: c.danger }}>{r.userName}</span>
                                    <span style={tagStyle('#fee2e2', '#991b1b')}>Restricted</span>
                                </div>
                                <button onClick={() => removeRestriction(r._id || r.userId)} style={deleteBtn}><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>
                )}
            </Section>

            {/* ── 7. ANNOUNCEMENTS ── */}
            <AnnouncementsSection s={s} setS={setS} saved={saved} setSaved={setSaved} showToast={showToast} />
        </div>
    );
};

// ── Menu Availability (separate component, talks to /api/products) ──────────
const MenuAvailabilitySection = () => {
    const [products, setProducts] = useState([]);
    const [changes, setChanges] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        API.get('/products/admin/all?all=true').then(({ data }) => setProducts(data)).catch(() => {});
    }, []);

    const toggle = (id, current) => {
        setChanges(prev => ({ ...prev, [id]: !current }));
        setProducts(prev => prev.map(p => p._id === id ? { ...p, isAvailable: !current } : p));
    };

    const saveAvailability = async () => {
        setSaving(true);
        try {
            await Promise.all(
                Object.entries(changes).map(([id, val]) =>
                    API.put(`/products/${id}`, { isAvailable: val })
                )
            );
            setChanges({});
            alert('Menu availability saved');
        } catch { alert('Failed to save some changes'); }
        setSaving(false);
    };

    const cats = [...new Set(products.map(p => p.category))];
    const numChanges = Object.keys(changes).length;

    return (
        <Section title="Menu Item Availability" icon={Package} iconColor="#6366f1"
            onSave={saveAvailability}
            changes={numChanges}
            saving={saving}>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: c.slate }}>Toggle items on/off. Unavailable items are hidden from the customer menu immediately.</p>
            {cats.map(cat => (
                <div key={cat} style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: c.slate, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', padding: '6px 12px', backgroundColor: c.light, borderRadius: '8px', display: 'inline-block' }}>
                        {cat}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                        {products.filter(p => p.category === cat).map(p => (
                            <div key={p._id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '12px 16px', borderRadius: '14px',
                                backgroundColor: p.isAvailable ? '#f0fdf4' : '#fff1f2',
                                border: `1px solid ${p.isAvailable ? '#bbf7d0' : '#fecdd3'}`,
                                transition: '0.2s'
                            }}>
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '14px', color: p.isAvailable ? '#065f46' : '#991b1b' }}>{p.name}</div>
                                    <div style={{ fontSize: '12px', color: c.slate }}>₹{p.price}</div>
                                </div>
                                <button onClick={() => toggle(p._id, p.isAvailable)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
                                    {p.isAvailable
                                        ? <ToggleRight size={36} color={c.success} />
                                        : <ToggleLeft size={36} color="#cbd5e1" />}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </Section>
    );
};

// ── Announcements Section ────────────────────────────────────────────────────
const AnnouncementsSection = ({ s, setS, setSaved, showToast }) => {
    const [newAnn, setNewAnn] = useState({ text: '', emoji: '📢', active: true });
    const addBtn = { display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#1a4331', color: '#fff', border: 'none', padding: '11px 18px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' };
    const deleteBtn = { border: 'none', background: '#fee2e2', color: '#ef4444', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
    const inpStyle = { width: '100%', padding: '11px 14px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#f1f5f9', fontFamily: 'inherit' };

    const add = async () => {
        if (!newAnn.text.trim()) return alert('Enter announcement text');
        const updated = [...(s.announcements || []), newAnn];
        try {
            const { data } = await API.put('/settings', { announcements: updated });
            const next = { ...s, announcements: data.announcements };
            setS(next); setSaved(next);
            setNewAnn({ text: '', emoji: '📢', active: true });
            showToast('Announcement added — visible on homepage');
        } catch { showToast('Failed', true); }
    };

    const remove = async (id) => {
        const updated = (s.announcements || []).filter(a => (a._id || a.text) !== id);
        try {
            const { data } = await API.put('/settings', { announcements: updated });
            const next = { ...s, announcements: data.announcements };
            setS(next); setSaved(next);
            showToast('Announcement removed');
        } catch { showToast('Failed', true); }
    };

    const toggleActive = async (id, current) => {
        const updated = (s.announcements || []).map(a => (a._id || a.text) === id ? { ...a, active: !current } : a);
        try {
            const { data } = await API.put('/settings', { announcements: updated });
            const next = { ...s, announcements: data.announcements };
            setS(next); setSaved(next);
        } catch { showToast('Failed', true); }
    };

    return (
        <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '28px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', borderBottom: '2px solid #f1f5f9', paddingBottom: '16px' }}>
                <div style={{ backgroundColor: '#fcd5ce', padding: '8px', borderRadius: '10px' }}>
                    <Megaphone size={18} color="#1a4331" />
                </div>
                <h3 style={{ margin: 0, color: '#1a4331', fontSize: '17px', fontWeight: '800' }}>Announcements Ticker</h3>
                <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '4px' }}>Scrolls across the top of the home page</span>
            </div>

            <div style={{ backgroundColor: '#f1f5f9', borderRadius: '14px', padding: '18px', marginBottom: '20px' }}>
                <p style={{ margin: '0 0 12px', fontWeight: '700', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Add New Announcement</p>
                <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr auto', gap: '10px', alignItems: 'end' }}>
                    <div>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>EMOJI</label>
                        <input value={newAnn.emoji} onChange={e => setNewAnn({ ...newAnn, emoji: e.target.value })} style={{ ...inpStyle, textAlign: 'center', fontSize: '18px' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>TEXT</label>
                        <input value={newAnn.text} onChange={e => setNewAnn({ ...newAnn, text: e.target.value })}
                            placeholder="e.g. Free delivery on orders above ₹499! 🚚"
                            style={inpStyle} />
                    </div>
                    <button onClick={add} style={{ ...addBtn, height: '46px' }}>Add</button>
                </div>
            </div>

            {(!s.announcements || s.announcements.length === 0) ? (
                <p style={{ textAlign: 'center', color: '#64748b', fontSize: '14px', padding: '16px 0' }}>No announcements yet. Add one above to show the ticker on the home page.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {s.announcements.map(a => {
                        const aid = a._id || a.text;
                        return (
                            <div key={aid} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: a.active ? '#f0fdf4' : '#f8fafc', borderRadius: '12px', border: `1px solid ${a.active ? '#bbf7d0' : '#e2e8f0'}` }}>
                                <span style={{ fontSize: '20px' }}>{a.emoji}</span>
                                <span style={{ flex: 1, fontSize: '14px', fontWeight: '600', color: a.active ? '#1a4331' : '#94a3b8' }}>{a.text}</span>
                                <button onClick={() => toggleActive(aid, a.active)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
                                    {a.active
                                        ? <ToggleRight size={36} color="#10b981" />
                                        : <ToggleLeft  size={36} color="#cbd5e1" />}
                                </button>
                                <button onClick={() => remove(aid)} style={deleteBtn}><Trash2 size={15} /></button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SystemSettings;
