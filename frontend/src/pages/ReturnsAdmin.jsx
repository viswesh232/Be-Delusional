import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, Clock, Truck, Search, Eye } from 'lucide-react';
import { getImageUrl } from '../utils/helpers';

export default function ReturnsAdmin() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRequest, setSelectedRequest] = useState(null);

    const fetchReturns = async () => {
        try {
            setLoading(true);
            const res = await API.get('/returns');
            setRequests(res.data);
        } catch (err) {
            console.error('Failed to fetch returns', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReturns();
    }, []);

    const handleUpdateStatus = async (id, newStatus, notes) => {
        try {
            await API.put(`/returns/${id}/status`, { status: newStatus, adminNotes: notes });
            fetchReturns();
            if (selectedRequest && selectedRequest._id === id) {
                setSelectedRequest(prev => ({ ...prev, status: newStatus, adminNotes: notes || prev.adminNotes }));
            }
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const filtered = requests.filter(r => {
        const matchesFilter = filter === 'All' || r.status === filter || (filter === 'exchange' && r.type === 'exchange') || (filter === 'return' && r.type === 'return');
        const matchesSearch = !searchTerm.trim() || 
            (r.orderId && r.orderId.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (r.userName && r.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (r.productName && r.productName.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesFilter && matchesSearch;
    });

    const getStatusBadge = (status) => {
        const colors = {
            Pending: { bg: '#fef3c7', text: '#d97706' },
            Approved: { bg: '#dbeafe', text: '#2563eb' },
            'Pickup Scheduled': { bg: '#e0e7ff', text: '#4f46e5' },
            Completed: { bg: '#dcfce7', text: '#16a34a' },
            Rejected: { bg: '#fee2e2', text: '#dc2626' },
        }[status] || { bg: '#f1f5f9', text: '#64748b' };

        return (
            <span style={{
                background: colors.bg, color: colors.text,
                padding: '4px 10px', borderRadius: '6px',
                fontSize: '12px', fontWeight: '700'
            }}>
                {status}
            </span>
        );
    };

    return (
        <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '30px 20px', fontFamily: 'inherit' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button
                            onClick={() => navigate('/dashboard')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px',
                                padding: '8px 14px', cursor: 'pointer', fontWeight: '600', fontSize: '14px'
                            }}
                        >
                            <ArrowLeft size={16} /> Admin Dashboard
                        </button>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '800', color: '#09090b' }}>
                                Size Exchanges & Returns Desk
                            </h1>
                            <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                                Review customer requests for size replacements and garment returns
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={fetchReturns}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: '#09090b', color: '#ffffff', border: 'none',
                            borderRadius: '8px', padding: '10px 18px', cursor: 'pointer', fontWeight: '600'
                        }}
                    >
                        <RefreshCw size={15} /> Refresh
                    </button>
                </div>

                {/* Filters & Search */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {['All', 'Pending', 'Approved', 'Completed', 'Rejected', 'exchange', 'return'].map(f => (
                            <button
                                key={f} onClick={() => setFilter(f)}
                                style={{
                                    padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                                    border: 'none', cursor: 'pointer', textTransform: 'capitalize',
                                    background: filter === f ? '#09090b' : '#ffffff',
                                    color: filter === f ? '#ffffff' : '#64748b',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    <div style={{ position: 'relative', width: '280px' }}>
                        <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                        <input 
                            placeholder="Search by Order ID or Name..."
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px',
                                border: '1px solid #e2e8f0', background: '#ffffff', outline: 'none',
                                fontSize: '13px', boxSizing: 'border-box'
                            }}
                        />
                    </div>
                </div>

                {/* Table */}
                <div style={{
                    background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)', overflow: 'hidden'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ padding: '14px 18px', fontWeight: '700', color: '#09090b' }}>Order ID</th>
                                <th style={{ padding: '14px 18px', fontWeight: '700', color: '#09090b' }}>Customer</th>
                                <th style={{ padding: '14px 18px', fontWeight: '700', color: '#09090b' }}>Item & Request</th>
                                <th style={{ padding: '14px 18px', fontWeight: '700', color: '#09090b' }}>Reason</th>
                                <th style={{ padding: '14px 18px', fontWeight: '700', color: '#09090b' }}>Status</th>
                                <th style={{ padding: '14px 18px', fontWeight: '700', color: '#09090b' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                        No exchange or return requests found.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(req => (
                                    <tr key={req._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '14px 18px', fontWeight: '700', color: '#09090b' }}>
                                            {req.orderId}
                                        </td>
                                        <td style={{ padding: '14px 18px' }}>
                                            <div style={{ fontWeight: '600', color: '#09090b' }}>{req.userName}</div>
                                            <div style={{ fontSize: '12px', color: '#64748b' }}>{req.userEmail}</div>
                                        </td>
                                        <td style={{ padding: '14px 18px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                {req.productImage && (
                                                    <img 
                                                        src={getImageUrl(req.productImage)} alt="" 
                                                        style={{ width: '40px', height: '48px', objectFit: 'cover', borderRadius: '4px' }}
                                                    />
                                                )}
                                                <div>
                                                    <div style={{ fontWeight: '600', color: '#09090b' }}>{req.productName}</div>
                                                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                                                        Original: {req.originalSize} • <strong style={{ color: req.type === 'exchange' ? '#2563eb' : '#dc2626' }}>
                                                            {req.type === 'exchange' ? `Exchange for ${req.requestedSize}` : 'Return & Refund'}
                                                        </strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 18px', color: '#334155', maxWidth: '240px' }}>
                                            {req.reason}
                                        </td>
                                        <td style={{ padding: '14px 18px' }}>
                                            {getStatusBadge(req.status)}
                                        </td>
                                        <td style={{ padding: '14px 18px' }}>
                                            <select
                                                value={req.status}
                                                onChange={e => handleUpdateStatus(req._id, e.target.value)}
                                                style={{
                                                    padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1',
                                                    fontSize: '13px', background: '#ffffff', cursor: 'pointer'
                                                }}
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Approved">Approved</option>
                                                <option value="Pickup Scheduled">Pickup Scheduled</option>
                                                <option value="Completed">Completed</option>
                                                <option value="Rejected">Rejected</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
