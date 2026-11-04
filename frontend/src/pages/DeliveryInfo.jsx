import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import { 
    Truck, Search, CheckCircle, ArrowLeft, 
    User, MapPin, Mail, Package, Send, History 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DeliveryInfo = () => {
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [trackingId, setTrackingId] = useState('');
    const [customMessage, setCustomMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('search') || '';
    });
    const [loading, setLoading] = useState(false);
    const [courierName, setCourierName] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();
    

    const colors = { forest: '#1a4331', peach: '#fcd5ce', white: '#ffffff', slate: '#64748b' };

    const fetchAllOrders = async () => {
        try {
            const { data } = await API.get('/orders');
            setOrders(Array.isArray(data) ? data : []);
            if (selectedOrder) {
                const refreshed = data.find(o => o._id === selectedOrder._id);
                if (refreshed) setSelectedOrder(refreshed);
                else setSelectedOrder(null);
            }
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        const loadOrders = async () => {
            try {
                const { data } = await API.get('/orders');
                setOrders(Array.isArray(data) ? data : []);

                const pending = data.filter(o => o.status === 'Preparing');
                if (pending.length > 0) {
                    setSelectedOrder(current => current || pending[0]);
                }
            } catch (err) {
                console.error(err);
            }
        };

        loadOrders();
    }, []);

    const handleDispatch = async () => {
        if (!trackingId.trim()) return setErrorMessage('Enter the courier tracking ID before dispatch.');
        if (!selectedOrder) return;
        if (!['Preparing', 'Shipped'].includes(selectedOrder.status)) {
            return setErrorMessage('Only quality-checked or already shipped orders can be dispatched or updated.');
        }

        setLoading(true);
        setErrorMessage('');
        try {
            await API.put(`/orders/${selectedOrder._id}/delivery`, {
                trackingId: trackingId.trim(),
                courierName: courierName.trim() || 'Private Courier',
                customNote: customMessage.trim(),
            });
            await fetchAllOrders();
            setTrackingId('');
            setCustomMessage('');
            alert(`Dispatch details saved for ${selectedOrder.orderId}`);
        } catch (err) {
            setErrorMessage(err.response?.data?.message || 'Could not update dispatch details. Refresh the order and try again.');
        } finally {
            setLoading(false);
        }
    };

    // --- SAFER FILTER LOGIC (Prevents .toLowerCase() crash) ---
    const filterBySearch = (list) => {
        return list.filter(o => {
            const id = o.orderId ? String(o.orderId).toLowerCase() : "";
            const query = searchQuery.toLowerCase();
            return id.includes(query);
        });
    };

    const pendingList = filterBySearch(orders.filter(o => o.status === 'Preparing'));
    const pastList = filterBySearch(orders.filter(o => o.status === 'Shipped' || (o.status === 'Delivered' && o.trackingId)));

    return (
        <div style={{ padding: '40px', backgroundColor: '#f4f7f6', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
                <ArrowLeft onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }} />
                <h1 style={{ margin: 0, color: colors.forest, fontWeight: 900 }}>Dispatch Station 📦</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 2fr)', gap: '30px' }}>
                
                {/* 1. LEFT SIDE: SEARCH & LISTS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* SEARCH EVERYTHING */}
                    <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', background: '#f1f5f9', padding: '10px', borderRadius: '12px', alignItems: 'center' }}>
                            <Search size={18} color={colors.slate} />
                            <input 
                                placeholder="Search ANY Order ID..." 
                                style={{ border: 'none', background: 'transparent', marginLeft: '10px', outline: 'none', width: '100%' }}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* WAITING LIST */}
                    <div style={{ backgroundColor: '#fff', borderRadius: '30px', padding: '25px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
                        <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px' }}>
                            <Package size={18} color={colors.forest}/> Ready to Ship ({pendingList.length})
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
                            {pendingList.map(o => (
                                <div key={o._id} onClick={() => { setSelectedOrder(o); setTrackingId(''); }} style={orderItemStyle(selectedOrder?._id === o._id, colors, false)}>
                                    <div style={{ fontWeight: 'bold' }}>#{o.orderId}</div>
                                    <div style={{ fontSize: '12px', opacity: 0.7 }}>{o.user?.firstName || 'Guest'}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* PAST ORDERS (Now Selectable) */}
                    <div style={{ backgroundColor: '#fff', borderRadius: '30px', padding: '25px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
                        <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px' }}>
                            <History size={18} color={colors.slate}/> Shipped History ({pastList.length})
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
                            {pastList.map(o => (
                                <div key={o._id} onClick={() => { setSelectedOrder(o); setTrackingId(o.trackingId || ''); }} style={orderItemStyle(selectedOrder?._id === o._id, colors, true)}>
                                    <div style={{ fontWeight: 'bold' }}>#{o.orderId}</div>
                                    <div style={{ fontSize: '11px', color: o.status === 'Delivered' ? '#16a34a' : '#0ea5e9' }}>
                                        {o.status === 'Delivered' ? '✓ DELIVERED' : '✓ SHIPPED'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 2. RIGHT SIDE: FULFILLMENT FORM (Always Visible) */}
                {selectedOrder && (
                    <div style={{ backgroundColor: '#fff', borderRadius: '30px', padding: '40px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)' }}>
                        <h2 style={{ color: colors.forest, marginTop: 0, marginBottom: '30px' }}>
                            {selectedOrder.status === 'Shipped' ? 'Update Shipped Order' : selectedOrder.status === 'Delivered' ? 'Delivered Order' : 'Fulfill New Order'} #{selectedOrder.orderId}
                        </h2>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                            <DetailItem icon={<User size={18}/>} label="Customer" value={`${selectedOrder.user?.firstName || 'N/A'} ${selectedOrder.user?.lastName || ''}`} />
                            <DetailItem icon={<Mail size={18}/>} label="Email Address" value={selectedOrder.user?.email || 'No email found'} />
                            <div style={{ gridColumn: 'span 2' }}>
                                <DetailItem icon={<MapPin size={18}/>} label="Shipping Address" value={selectedOrder.shippingAddress || 'No address provided'} />
                            </div>
                        </div>

                        <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '20px', marginBottom: '30px' }}>
                            <p style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 'bold', color: colors.slate }}>ITEMS TO PACK:</p>
                            {selectedOrder.orderItems?.map((item, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                    <span>{item.qty}x {item.name}</span>
                                    <span>₹{item.price * item.qty}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ borderTop: '2px dashed #eee', paddingTop: '30px' }}>
                            {errorMessage && <div role="alert" style={{ padding: '12px', marginBottom: '16px', borderRadius: '8px', background: '#fef2f2', color: '#991b1b', fontSize: '13px' }}>{errorMessage}</div>}
                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Courier name</label>
                            <input style={inputStyle} placeholder="Courier / delivery partner" value={courierName} onChange={e => setCourierName(e.target.value)} />

                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Tracking ID</label>
                            <input 
                                style={inputStyle}
                                placeholder="Paste Courier Tracking ID"
                                value={trackingId}
                                onChange={(e) => setTrackingId(e.target.value)}
                            />

                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Custom Note (Sent via Email)</label>
                            <textarea 
                                style={{ ...inputStyle, height: '80px', fontFamily: 'inherit' }}
                                placeholder="Add a personal message to the customer..."
                                value={customMessage}
                                onChange={(e) => setCustomMessage(e.target.value)}
                            />

                            <button 
                                onClick={handleDispatch}
                                disabled={loading || selectedOrder.status === 'Delivered' || !['Preparing', 'Shipped'].includes(selectedOrder.status)}
                                style={{ 
                                    width: '100%', backgroundColor: selectedOrder.status === 'Delivered' ? '#94a3b8' : colors.forest, color: '#fff', border: 'none', 
                                    padding: '18px', borderRadius: '12px', fontWeight: 'bold', cursor: selectedOrder.status === 'Delivered' || !['Preparing', 'Shipped'].includes(selectedOrder.status) ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center'
                                }}
                            >
                                <Send size={18}/> {selectedOrder.status === 'Shipped' ? "Update & Re-send Email" : selectedOrder.status === 'Delivered' ? "Order Completed" : "Confirm Dispatch & Send Email"}
                            </button>

                            {selectedOrder.status === 'Shipped' && (
                                <button 
                                    onClick={async () => {
                                        if(!window.confirm('Mark this order as successfully delivered?')) return;
                                        setLoading(true);
                                        try {
                                            await API.put(`/orders/${selectedOrder._id}/status`, { status: 'Delivered' });
                                            alert('Order marked as Delivered!');
                                            fetchAllOrders();
                                            setSelectedOrder(null);
                                        } catch {
                                            alert('Failed to mark as delivered');
                                        }
                                        setLoading(false);
                                    }}
                                    disabled={loading}
                                    style={{ 
                                        width: '100%', backgroundColor: '#16a34a', color: '#fff', border: 'none', 
                                        padding: '18px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', marginTop: '12px'
                                    }}
                                >
                                    <CheckCircle size={18}/> Mark as Delivered Successfully
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Styles
const orderItemStyle = (active, colors, isPast) => ({
    padding: '12px', borderRadius: '12px', cursor: 'pointer',
    border: `2px solid ${active ? colors.forest : '#f1f5f9'}`,
    backgroundColor: active ? (isPast ? '#f1f5f9' : '#f0fdf4') : '#fff',
    transition: '0.1s'
});

const inputStyle = { width: '100%', padding: '15px', borderRadius: '12px', border: '2px solid #eee', outline: 'none', fontSize: '15px', marginBottom: '20px', boxSizing: 'border-box' };

const DetailItem = ({ icon, label, value }) => (
    <div>
        <p style={{ margin: '0 0 5px 0', fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px', textTransform: 'uppercase' }}>{icon} {label}</p>
        <p style={{ margin: 0, fontWeight: 'bold', color: '#1e293b', fontSize: '14px' }}>{value}</p>
    </div>
);

export default DeliveryInfo;
