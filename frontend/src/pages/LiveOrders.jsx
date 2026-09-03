import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { PackageCheck, AlertCircle, ArrowLeft, CreditCard, CheckCircle, RefreshCw, MessageSquareWarning, Clock, User, ChevronRight } from 'lucide-react';

const c = { forest: '#1a4331', peach: '#fcd5ce', white: '#ffffff', slate: '#64748b', light: '#f8fafc', border: '#e2e8f0' };

const LiveOrders = () => {
    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState('active'); // active | payment_pending | all
    const [showWarning, setShowWarning] = useState(false);
    const navigate = useNavigate();

    const fetchOrders = async () => {
        try {
            const { data } = await API.get('/orders');
            setOrders(data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 6000);
        return () => clearInterval(interval);
    }, []);

    const handleStatusChange = async (id, newStatus) => {
        if (newStatus === 'Cancelled') {
            if (!window.confirm('WARNING: Are you sure you want to CANCEL this order? This action cannot be undone.')) {
                fetchOrders();
                return;
            }
        }
        try {
            await API.put(`/orders/${id}/status`, { status: newStatus });
            if (newStatus === 'Preparing') { setShowWarning(true); setTimeout(() => setShowWarning(false), 5000); }
            fetchOrders();
        } catch { alert('Update failed. Check backend console.'); }
    };

    const handleConfirmPayment = async (id) => {
        if (!window.confirm('Manually confirm this payment as PAID?')) return;
        try {
            await API.put(`/orders/${id}/confirm-payment`);
            fetchOrders();
        } catch { alert('Failed to confirm payment'); }
    };

    const formatTime = (dateString) => {
        const d = new Date(dateString);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const filtered = orders.filter(o => {
        if (o.paymentStatus === 'Failed') return false; 
        if (filter === 'payment_pending') return o.paymentStatus === 'Pending' || o.status === 'Pending Payment';
        if (filter === 'active') return !['Shipped', 'Delivered', 'Cancelled'].includes(o.status);
        return true;
    });

    const pendingPaymentCount = orders.filter(o => o.paymentStatus === 'Pending' || o.status === 'Pending Payment').length;

    const renderCard = (order) => (
        <div key={order._id} className="kanban-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ fontSize: '18px', fontWeight: '900', color: c.forest }}>#{order.orderId}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '700', color: c.slate }}>
                    <Clock size={12} /> {formatTime(order.createdAt)}
                </div>
            </div>
            
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} color={c.slate} /> {order.user?.firstName} {order.user?.lastName}
            </div>

            <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {order.orderItems.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                        <span style={{ backgroundColor: c.forest, color: '#fff', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '800', marginRight: '8px', marginTop: '1px' }}>{item.qty}x</span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ lineHeight: '1.3' }}>{item.name}</span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>
                                Size: <strong style={{ color: '#09090b' }}>{item.size || 'M'}</strong>
                                {item.color && item.color !== 'Standard' && ` • Color: ${item.color}`}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {order.customNote && (
                <div style={{ padding: '8px 12px', backgroundColor: '#fefce8', borderLeft: '3px solid #fde047', borderRadius: '4px', color: '#854d0e', fontSize: '12px', fontWeight: '700', display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <MessageSquareWarning size={14} style={{ flexShrink: 0, marginTop: '2px' }} color="#ca8a04" />
                    <span>{order.customNote}</span>
                </div>
            )}

            <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: '12px', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: order.paymentStatus === 'Paid' ? '#d1fae5' : '#fee2e2', color: order.paymentStatus === 'Paid' ? '#065f46' : '#991b1b', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CreditCard size={12} /> {order.paymentStatus}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: '900', color: c.forest }}>₹{order.totalPrice}</span>
                </div>

                {order.status === 'Pending Payment' || order.paymentStatus === 'Pending' ? (
                    <button onClick={() => handleConfirmPayment(order._id)} className="action-btn" style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }}>
                        <CheckCircle size={14} /> Confirm Paid
                    </button>
                ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {order.status === 'Placed' && (
                            <button onClick={() => handleStatusChange(order._id, 'Processing')} className="action-btn" style={{ backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', flex: 1 }}>
                                Pick & Pack <ChevronRight size={14} />
                            </button>
                        )}
                        {order.status === 'Processing' && (
                            <button onClick={() => handleStatusChange(order._id, 'Preparing')} className="action-btn" style={{ backgroundColor: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe', flex: 1 }}>
                                Quality Check <ChevronRight size={14} />
                            </button>
                        )}
                        {order.status === 'Preparing' && (
                            <button onClick={() => navigate(`/admin/delivery`)} className="action-btn" style={{ backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', flex: 1 }}>
                                Assign Delivery
                            </button>
                        )}
                        <button onClick={() => handleStatusChange(order._id, 'Cancelled')} className="action-btn" style={{ backgroundColor: '#fff', color: '#dc2626', border: '1px solid #fecaca', padding: '8px' }} title="Cancel Order">
                            ❌
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div style={{ padding: '32px 40px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
            <style>
                {`
                .kanban-board {
                    display: flex; gap: 24px; overflow-x: auto; padding-bottom: 20px;
                    align-items: flex-start; min-height: 70vh;
                }
                .kanban-column {
                    flex: 0 0 340px; background-color: #f1f5f9; border-radius: 20px;
                    padding: 20px; display: flex; flex-direction: column; gap: 16px;
                    max-height: 80vh; overflow-y: auto; border: 1px solid #e2e8f0;
                }
                .kanban-column::-webkit-scrollbar { width: 6px; }
                .kanban-column::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                
                .kanban-card {
                    background-color: #fff; border-radius: 14px; padding: 16px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid #e2e8f0;
                    display: flex; flex-direction: column; transition: all 0.2s;
                    cursor: pointer;
                }
                .kanban-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.06); border-color: #cbd5e1; }
                
                .action-btn {
                    padding: 10px; border-radius: 8px; font-size: 12px; font-weight: 800;
                    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;
                    transition: all 0.2s;
                }
                .action-btn:hover { filter: brightness(0.95); }
                `}
            </style>

            {showWarning && (
                <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', backgroundColor: c.forest, color: '#fff', padding: '14px 28px', borderRadius: '50px', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                    <AlertCircle color={c.peach} size={18} /> Order packed — waiting in Dispatch
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button onClick={() => navigate('/dashboard')} style={{ border: `1px solid ${c.border}`, background: c.white, borderRadius: '12px', padding: '10px', cursor: 'pointer', display: 'flex', transition: 'all 0.2s' }}>
                        <ArrowLeft size={20} color={c.forest} />
                    </button>
                    <div>
                        <h1 style={{ color: c.forest, fontWeight: '900', margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '24px' }}>
                            <PackageCheck size={28} /> Kanban Kitchen
                        </h1>
                        <p style={{ margin: '4px 0 0', color: c.slate, fontSize: '14px', fontWeight: '500' }}>Drag-free Kanban flow for live orders.</p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <button onClick={fetchOrders} style={{ border: `1px solid ${c.border}`, background: c.white, borderRadius: '10px', padding: '10px', cursor: 'pointer', display: 'flex', color: c.forest, transition: 'all 0.2s' }} onMouseEnter={e=>e.currentTarget.style.backgroundColor='#f1f5f9'} onMouseLeave={e=>e.currentTarget.style.backgroundColor='#fff'}>
                        <RefreshCw size={18} />
                    </button>
                    <div style={{ display: 'flex', backgroundColor: c.white, padding: '4px', borderRadius: '12px', border: `1px solid ${c.border}` }}>
                        {[
                            { id: 'active', label: 'Kitchen Flow' },
                            { id: 'payment_pending', label: `Payment Pending ${pendingPaymentCount > 0 ? `(${pendingPaymentCount})` : ''}` },
                            { id: 'all', label: 'All Orders' },
                        ].map(f => (
                            <button key={f.id} onClick={() => setFilter(f.id)} style={{
                                padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                fontWeight: '700', fontSize: '13px', transition: 'all 0.2s',
                                backgroundColor: filter === f.id ? c.forest : 'transparent',
                                color: filter === f.id ? '#fff' : c.slate,
                            }}>{f.label}</button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="kanban-board">
                {/* Column 1: New / Placed */}
                <div className="kanban-column">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></div> New Orders
                        </h3>
                        <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '800' }}>
                            {filtered.filter(o => o.status === 'Placed' || o.status === 'Pending Payment').length}
                        </span>
                    </div>
                    {filtered.filter(o => o.status === 'Placed' || o.status === 'Pending Payment').map(renderCard)}
                    {filtered.filter(o => o.status === 'Placed' || o.status === 'Pending Payment').length === 0 && (
                        <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '14px', fontWeight: '600', backgroundColor: 'transparent', border: '2px dashed #cbd5e1', borderRadius: '12px' }}>No new orders</div>
                    )}
                </div>

                {/* Column 2: Processing (Cooking) */}
                <div className="kanban-column">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3b82f6' }}></div> Cooking
                        </h3>
                        <span style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '800' }}>
                            {filtered.filter(o => o.status === 'Processing').length}
                        </span>
                    </div>
                    {filtered.filter(o => o.status === 'Processing').map(renderCard)}
                    {filtered.filter(o => o.status === 'Processing').length === 0 && (
                        <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '14px', fontWeight: '600', backgroundColor: 'transparent', border: '2px dashed #cbd5e1', borderRadius: '12px' }}>Kitchen is clear</div>
                    )}
                </div>

                {/* Column 3: Preparing (Packed / Dispatch) */}
                <div className="kanban-column">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#5b21b6', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#8b5cf6' }}></div> Packed (Dispatch)
                        </h3>
                        <span style={{ backgroundColor: '#ede9fe', color: '#5b21b6', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '800' }}>
                            {filtered.filter(o => o.status === 'Preparing').length}
                        </span>
                    </div>
                    {filtered.filter(o => o.status === 'Preparing').map(renderCard)}
                    {filtered.filter(o => o.status === 'Preparing').length === 0 && (
                        <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '14px', fontWeight: '600', backgroundColor: 'transparent', border: '2px dashed #cbd5e1', borderRadius: '12px' }}>No packed orders</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LiveOrders;
