import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import {
    Package, Truck, Clock, CheckCircle, XCircle,
    ArrowLeft, ShoppingBag, CreditCard, AlertTriangle, RefreshCw, RotateCcw, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../utils/helpers';

const ORDER_STATUS = {
    'Pending Payment':    { label: 'Pending Payment', icon: CreditCard, bg: '#fef3c7', text: '#92400e' },
    'Placed':             { label: 'Order Placed', icon: CheckCircle, bg: '#dcfce7', text: '#15803d' },
    'Processing':         { label: 'Processing', icon: Clock, bg: '#dbeafe', text: '#1e40af' },
    'Packed':             { label: 'Packed & Ready', icon: Package, bg: '#ede9fe', text: '#5b21b6' },
    'Preparing':          { label: 'Tailoring / Packing', icon: Package, bg: '#ede9fe', text: '#5b21b6' },
    'Shipped':            { label: 'Dispatched', icon: Truck, bg: '#cffafe', text: '#0e7490' },
    'Delivered':          { label: 'Delivered', icon: CheckCircle, bg: '#d1fae5', text: '#065f46' },
    'Exchange Requested': { label: 'Exchange Requested', icon: RefreshCw, bg: '#e0e7ff', text: '#4338ca' },
    'Exchanged':          { label: 'Replacement Shipped', icon: CheckCircle, bg: '#dcfce7', text: '#15803d' },
    'Return Requested':   { label: 'Return Requested', icon: RotateCcw, bg: '#fee2e2', text: '#b91c1c' },
    'Returned':           { label: 'Returned & Refunded', icon: CheckCircle, bg: '#f1f5f9', text: '#475569' },
    'Cancelled':          { label: 'Cancelled', icon: XCircle, bg: '#fee2e2', text: '#991b1b' },
};

const PAY_STATUS = {
    Paid:     { label: 'Paid', bg: '#dcfce7', text: '#15803d' },
    Pending:  { label: 'Pending', bg: '#fef9c3', text: '#854d0e' },
    Failed:   { label: 'Failed', bg: '#fee2e2', text: '#b91c1c' },
    Refunded: { label: 'Refunded', bg: '#ede9fe', text: '#6d28d9' },
};

const fmt = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const navigate = useNavigate();

    // Exchange / Return Modal State
    const [exchangeModalOpen, setExchangeModalOpen] = useState(false);
    const [targetOrder, setTargetOrder] = useState(null);
    const [targetProduct, setTargetProduct] = useState(null);
    const [requestType, setRequestType] = useState('exchange'); // 'exchange' | 'return'
    const [requestedSize, setRequestedSize] = useState('L');
    const [returnReason, setReturnReason] = useState('Too Tight');
    const [submittingRequest, setSubmittingRequest] = useState(false);

    const fetchOrders = () => {
        setLoading(true);
        API.get('/orders/myorders')
            .then(({ data }) => setOrders(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm('Are you sure you want to cancel this order?')) return;
        try {
            await API.put(`/orders/${orderId}/cancel`);
            fetchOrders();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to cancel order.');
        }
    };

    const openExchangeModal = (order, item) => {
        setTargetOrder(order);
        setTargetProduct(item);
        setExchangeModalOpen(true);
    };

    const handleExchangeSubmit = async (e) => {
        e.preventDefault();
        setSubmittingRequest(true);
        try {
            await API.post('/orders/request-return', {
                orderId: targetOrder._id,
                productId: targetProduct.product?._id || targetProduct.product,
                type: requestType,
                requestedSize: requestType === 'exchange' ? requestedSize : '',
                reason: returnReason,
            });
            alert(`${requestType === 'exchange' ? 'Size exchange' : 'Return'} request submitted successfully! We will coordinate pickup with you.`);
            setExchangeModalOpen(false);
            fetchOrders();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to submit exchange request');
        } finally {
            setSubmittingRequest(false);
        }
    };

    const filtered = filter === 'all' 
        ? orders
        : filter === 'active' 
            ? orders.filter(o => !['Delivered', 'Cancelled', 'Returned'].includes(o.status))
            : orders.filter(o => o.status === filter);

    return (
        <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'inherit', padding: '40px 20px 80px' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
                    <div>
                        <button
                            onClick={() => navigate('/')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: '#64748b', fontWeight: '600', fontSize: '13px', marginBottom: '8px'
                            }}
                        >
                            <ArrowLeft size={16} /> Back to Store
                        </button>
                        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#09090b', letterSpacing: '-0.5px' }}>
                            My Orders & Exchanges
                        </h1>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        {['all', 'active', 'Delivered'].map(tab => (
                            <button
                                key={tab} onClick={() => setFilter(tab)}
                                style={{
                                    padding: '8px 14px', borderRadius: '8px', border: 'none',
                                    fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                                    background: filter === tab ? '#09090b' : '#ffffff',
                                    color: filter === tab ? '#ffffff' : '#64748b',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                }}
                            >
                                {tab === 'all' ? 'All Orders' : tab}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Loading your orders...</div>
                ) : filtered.length === 0 ? (
                    <div style={{
                        background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0',
                        padding: '60px 20px', textAlign: 'center'
                    }}>
                        <ShoppingBag size={40} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
                        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#09090b', margin: '0 0 8px' }}>No orders found</h2>
                        <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 20px' }}>Explore our latest fashion drops and place your first order!</p>
                        <button
                            onClick={() => navigate('/')}
                            style={{
                                padding: '10px 24px', background: '#09090b', color: '#fff',
                                border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer'
                            }}
                        >
                            Shop Collection
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {filtered.map(order => {
                            const statusMeta = ORDER_STATUS[order.status] || { label: order.status, bg: '#f1f5f9', text: '#64748b' };
                            const payMeta = PAY_STATUS[order.paymentStatus] || { label: order.paymentStatus, bg: '#f1f5f9', text: '#64748b' };
                            const canCancel = ['Placed', 'Processing'].includes(order.status);
                            const canExchange = order.status === 'Delivered';

                            return (
                                <div key={order._id} style={{
                                    background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)', overflow: 'hidden'
                                }}>
                                    {/* Order Top Bar */}
                                    <div style={{
                                        padding: '16px 20px', background: '#fafafa', borderBottom: '1px solid #f1f5f9',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px'
                                    }}>
                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                            <span style={{ fontSize: '15px', fontWeight: '800', color: '#09090b' }}>
                                                {order.orderId}
                                            </span>
                                            <span style={{ fontSize: '13px', color: '#64748b' }}>
                                                {fmtDate(order.createdAt)}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <span style={{
                                                padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700',
                                                background: statusMeta.bg, color: statusMeta.text
                                            }}>
                                                {statusMeta.label}
                                            </span>
                                            <span style={{
                                                padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600',
                                                background: payMeta.bg, color: payMeta.text
                                            }}>
                                                {payMeta.label}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Order Items */}
                                    <div style={{ padding: '20px' }}>
                                        {order.orderItems.map((item, idx) => (
                                            <div key={idx} style={{
                                                display: 'flex', gap: '16px', paddingBottom: idx === order.orderItems.length - 1 ? 0 : '16px',
                                                borderBottom: idx === order.orderItems.length - 1 ? 'none' : '1px solid #f4f4f5',
                                                alignItems: 'center'
                                            }}>
                                                <img 
                                                    src={getImageUrl(item.image)} alt={item.name}
                                                    style={{ width: '64px', height: '80px', objectFit: 'cover', borderRadius: '6px', background: '#f4f4f5' }}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#09090b' }}>
                                                        {item.name}
                                                    </div>
                                                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', display: 'flex', gap: '8px' }}>
                                                        <span style={{ fontWeight: '700', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', color: '#09090b' }}>
                                                            Size: {item.size || 'M'}
                                                        </span>
                                                        {item.color && item.color !== 'Standard' && <span>Color: {item.color}</span>}
                                                        <span>Qty: {item.qty}</span>
                                                    </div>
                                                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#09090b', marginTop: '6px' }}>
                                                        {fmt(item.price * item.qty)}
                                                    </div>
                                                </div>

                                                {/* Exchange / Return Button for Delivered items */}
                                                {canExchange && (
                                                    <button
                                                        onClick={() => openExchangeModal(order, item)}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '6px',
                                                            background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px',
                                                            padding: '8px 14px', fontSize: '13px', fontWeight: '700', color: '#09090b', cursor: 'pointer'
                                                        }}
                                                    >
                                                        <RefreshCw size={14} /> Exchange Size
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Tracking info if dispatched */}
                                    {order.trackingId && (
                                        <div style={{ margin: '0 20px 16px', padding: '12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', fontSize: '13px' }}>
                                            <strong>Courier:</strong> {order.courierName || 'Express'} • <strong>Tracking ID:</strong> <span style={{ color: '#16a34a', fontWeight: '700' }}>{order.trackingId}</span>
                                        </div>
                                    )}

                                    {/* Order Footer */}
                                    <div style={{
                                        padding: '14px 20px', background: '#fafafa', borderTop: '1px solid #f1f5f9',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px'
                                    }}>
                                        <div style={{ fontSize: '14px', color: '#64748b' }}>
                                            Total: <strong style={{ color: '#09090b', fontSize: '16px' }}>{fmt(order.totalPrice)}</strong>
                                        </div>

                                        {canCancel && (
                                            <button
                                                onClick={() => handleCancelOrder(order._id)}
                                                style={{
                                                    background: '#fee2e2', color: '#dc2626', border: 'none',
                                                    borderRadius: '6px', padding: '6px 14px', fontSize: '12px',
                                                    fontWeight: '700', cursor: 'pointer'
                                                }}
                                            >
                                                Cancel Order
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Exchange / Return Modal */}
            {exchangeModalOpen && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <div style={{
                        background: '#ffffff', borderRadius: '16px', padding: '28px',
                        maxWidth: '480px', width: '100%', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                    }}>
                        <button
                            onClick={() => setExchangeModalOpen(false)}
                            style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            <X size={20} />
                        </button>

                        <h3 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: '800', color: '#09090b' }}>
                            Size Exchange & Returns
                        </h3>
                        <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#64748b' }}>
                            For {targetProduct?.name} (Order {targetOrder?.orderId})
                        </p>

                        <form onSubmit={handleExchangeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>
                                    Request Type
                                </label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setRequestType('exchange')}
                                        style={{
                                            flex: 1, padding: '10px', borderRadius: '8px', fontWeight: '700', fontSize: '13px',
                                            border: requestType === 'exchange' ? '2px solid #09090b' : '1px solid #cbd5e1',
                                            background: requestType === 'exchange' ? '#09090b' : '#fff',
                                            color: requestType === 'exchange' ? '#fff' : '#475569', cursor: 'pointer'
                                        }}
                                    >
                                        Exchange Size
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRequestType('return')}
                                        style={{
                                            flex: 1, padding: '10px', borderRadius: '8px', fontWeight: '700', fontSize: '13px',
                                            border: requestType === 'return' ? '2px solid #09090b' : '1px solid #cbd5e1',
                                            background: requestType === 'return' ? '#09090b' : '#fff',
                                            color: requestType === 'return' ? '#fff' : '#475569', cursor: 'pointer'
                                        }}
                                    >
                                        Return for Refund
                                    </button>
                                </div>
                            </div>

                            {requestType === 'exchange' && (
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>
                                        Replacement Size Needed
                                    </label>
                                    <select
                                        value={requestedSize}
                                        onChange={e => setRequestedSize(e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                                    >
                                        {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(s => (
                                            <option key={s} value={s}>Size {s}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>
                                    Reason
                                </label>
                                <select
                                    value={returnReason}
                                    onChange={e => setReturnReason(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                                >
                                    <option value="Too Tight">Too Tight / Need Larger Size</option>
                                    <option value="Too Loose">Too Loose / Need Smaller Size</option>
                                    <option value="Fabric / Fit not as expected">Fabric / Fit not as expected</option>
                                    <option value="Defective / Stitching issue">Defective / Stitching issue</option>
                                </select>
                            </div>

                            <button
                                type="submit" disabled={submittingRequest}
                                style={{
                                    marginTop: '8px', padding: '12px', background: '#09090b',
                                    color: '#fff', border: 'none', borderRadius: '8px',
                                    fontWeight: '700', fontSize: '14px', cursor: 'pointer'
                                }}
                            >
                                {submittingRequest ? 'Submitting Request...' : 'Submit Request'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}