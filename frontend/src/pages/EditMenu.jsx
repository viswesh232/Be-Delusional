import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { useNavigate } from 'react-router-dom';
import {
    Trash2, IndianRupee, Tag,
    ToggleLeft, ToggleRight, Pencil, Check, X,
    ArrowLeft, Plus, Upload, Link, ChevronLeft, ChevronRight, Image, Shirt, Sparkles, Layers
} from 'lucide-react';
import { getImageUrl } from '../utils/helpers';

const c = {
    dark: '#09090b',
    lightBg: '#f8fafc',
    border: '#e2e8f0',
    primary: '#09090b',
    accent: '#2563eb',
    muted: '#64748b',
    cardBg: '#ffffff'
};

const inp = {
    padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff', fontSize: '14px', outline: 'none',
    width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
    color: '#09090b'
};

const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const APPAREL_CATEGORIES = ['T-Shirts', 'Shirts', 'Hoodies', 'Pants', 'Jeans', 'Jackets', 'Accessories'];

export default function EditMenu() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [activeTab, setActiveTab] = useState('All');

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        brand: 'True Threads',
        price: '',
        discountPrice: '',
        category: 'T-Shirts',
        subCategory: 'Oversized',
        gender: 'Unisex',
        description: '',
        material: '100% Combed Cotton, 240 GSM',
        fit: 'Oversized Fit',
        careInstructions: 'Machine wash cold. Do not tumble dry.',
        modelStats: '',
        isAvailable: true,
        isNewDrop: true,
        isBestseller: false,
        selectedSizes: ['S', 'M', 'L', 'XL'],
        colorName: 'Black',
        colorHex: '#09090b',
        stockPerSize: { 'S': 20, 'M': 25, 'L': 30, 'XL': 15 }
    });

    const [urlImages, setUrlImages] = useState(['']);
    const [fileImages, setFileImages] = useState([]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await API.get('/products?all=true');
            setProducts(res.data);
        } catch (err) {
            console.error('Failed to fetch products', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleSizeToggle = (size) => {
        setFormData(prev => {
            const exists = prev.selectedSizes.includes(size);
            const updated = exists 
                ? prev.selectedSizes.filter(s => s !== size)
                : [...prev.selectedSizes, size];
            
            const newStock = { ...prev.stockPerSize };
            if (!exists && !newStock[size]) {
                newStock[size] = 20;
            }
            return { ...prev, selectedSizes: updated, stockPerSize: newStock };
        });
    };

    const handleStockChange = (size, val) => {
        setFormData(prev => ({
            ...prev,
            stockPerSize: { ...prev.stockPerSize, [size]: Number(val) || 0 }
        }));
    };

    const resetForm = () => {
        setFormData({
            name: '',
            brand: 'True Threads',
            price: '',
            discountPrice: '',
            category: 'T-Shirts',
            subCategory: 'Oversized',
            gender: 'Unisex',
            description: '',
            material: '100% Combed Cotton, 240 GSM',
            fit: 'Oversized Fit',
            careInstructions: 'Machine wash cold. Do not tumble dry.',
            modelStats: '',
            isAvailable: true,
            isNewDrop: true,
            isBestseller: false,
            selectedSizes: ['S', 'M', 'L', 'XL'],
            colorName: 'Black',
            colorHex: '#09090b',
            stockPerSize: { 'S': 20, 'M': 25, 'L': 30, 'XL': 15 }
        });
        setUrlImages(['']);
        setFileImages([]);
        setEditingId(null);
    };

    const handleEditClick = (p) => {
        setEditingId(p._id);
        const sizes = (p.sizes && p.sizes.length > 0) ? p.sizes : ['S', 'M', 'L', 'XL'];
        const stockMap = {};
        if (Array.isArray(p.variants)) {
            p.variants.forEach(v => {
                stockMap[v.size] = v.stock;
            });
        } else {
            sizes.forEach(s => stockMap[s] = 20);
        }

        setFormData({
            name: p.name || '',
            brand: p.brand || 'True Threads',
            price: p.price || '',
            discountPrice: p.discountPrice || '',
            category: p.category || 'T-Shirts',
            subCategory: p.subCategory || '',
            gender: p.gender || 'Unisex',
            description: p.description || '',
            material: p.material || '100% Cotton',
            fit: p.fit || 'Regular Fit',
            careInstructions: p.careInstructions || '',
            modelStats: p.modelStats || '',
            isAvailable: p.isAvailable ?? true,
            isNewDrop: p.isNewDrop ?? false,
            isBestseller: p.isBestseller ?? false,
            selectedSizes: sizes,
            colorName: p.colors?.[0]?.name || 'Black',
            colorHex: p.colors?.[0]?.hex || '#09090b',
            stockPerSize: stockMap
        });

        setUrlImages(p.images && p.images.length > 0 ? p.images : ['']);
        setFileImages([]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const variants = formData.selectedSizes.map(size => ({
                sku: `${formData.name.substring(0, 3).toUpperCase()}-${size}`,
                size,
                color: formData.colorName,
                colorHex: formData.colorHex,
                stock: formData.stockPerSize[size] ?? 20,
                price: Number(formData.price)
            }));

            const colors = [{ name: formData.colorName, hex: formData.colorHex }];

            const fd = new FormData();
            fd.append('name', formData.name);
            fd.append('brand', formData.brand);
            fd.append('price', formData.price);
            fd.append('discountPrice', formData.discountPrice || '0');
            fd.append('category', formData.category);
            fd.append('subCategory', formData.subCategory);
            fd.append('gender', formData.gender);
            fd.append('description', formData.description);
            fd.append('material', formData.material);
            fd.append('fit', formData.fit);
            fd.append('careInstructions', formData.careInstructions);
            fd.append('modelStats', formData.modelStats);
            fd.append('isAvailable', formData.isAvailable);
            fd.append('isNewDrop', formData.isNewDrop);
            fd.append('isBestseller', formData.isBestseller);

            fd.append('sizes', JSON.stringify(formData.selectedSizes));
            fd.append('colors', JSON.stringify(colors));
            fd.append('variants', JSON.stringify(variants));

            urlImages.filter(u => u && u.trim()).forEach(u => fd.append('urlImages', u.trim()));
            fileImages.forEach(f => fd.append('images', f));

            if (editingId) {
                await API.put(`/products/${editingId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            } else {
                await API.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            }

            resetForm();
            fetchProducts();
        } catch (err) {
            console.error('Error saving product', err);
            alert(err.response?.data?.message || 'Error saving apparel product');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this product from catalog?')) return;
        try {
            await API.delete(`/products/${id}`);
            fetchProducts();
        } catch (err) {
            alert('Failed to delete product');
        }
    };

    const toggleAvailability = async (product) => {
        try {
            await API.put(`/products/${product._id}`, { isAvailable: !product.isAvailable }, {
                headers: { 'Content-Type': 'application/json' }
            });
            fetchProducts();
        } catch (err) {
            alert('Failed to toggle availability');
        }
    };

    const filteredProducts = activeTab === 'All' 
        ? products 
        : products.filter(p => p.gender === activeTab || p.category === activeTab);

    return (
        <div style={{ backgroundColor: c.lightBg, minHeight: '100vh', padding: '30px 20px', fontFamily: 'inherit' }}>
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
                            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '800', color: c.dark }}>
                                Apparel Catalog & Inventory Matrix
                            </h1>
                            <p style={{ margin: 0, fontSize: '14px', color: c.muted }}>
                                Manage clothing items, size variants, stock counts, and fabric specs
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form Card */}
                <div style={{
                    background: '#ffffff', borderRadius: '16px', padding: '28px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0',
                    marginBottom: '32px'
                }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: c.dark, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Shirt size={20} color={c.accent} />
                        {editingId ? 'Edit Apparel Product' : 'Add New Clothing Item'}
                    </h2>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Product Title *</label>
                                <input 
                                    style={inp} required placeholder="e.g. Heavyweight Oversized Tee"
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Brand</label>
                                <input 
                                    style={inp} placeholder="True Threads"
                                    value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Gender Collection</label>
                                <select 
                                    style={inp} value={formData.gender}
                                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                >
                                    <option value="Men">Men</option>
                                    <option value="Women">Women</option>
                                    <option value="Unisex">Unisex</option>
                                    <option value="Kids">Kids</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Category *</label>
                                <select 
                                    style={inp} value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    {APPAREL_CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Regular Price (₹) *</label>
                                <input 
                                    type="number" style={inp} required placeholder="1299"
                                    value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Discounted / Sale Price (₹)</label>
                                <input 
                                    type="number" style={inp} placeholder="999 (Optional)"
                                    value={formData.discountPrice} onChange={e => setFormData({ ...formData, discountPrice: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Sub-Category / Style</label>
                                <input 
                                    style={inp} placeholder="e.g. Acid Wash, Cargo, Boxy"
                                    value={formData.subCategory} onChange={e => setFormData({ ...formData, subCategory: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Primary Color Name & Hex</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input 
                                        style={{ ...inp, flex: 2 }} placeholder="Onyx Black"
                                        value={formData.colorName} onChange={e => setFormData({ ...formData, colorName: e.target.value })}
                                    />
                                    <input 
                                        type="color" style={{ width: '46px', height: '42px', padding: 0, border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                        value={formData.colorHex} onChange={e => setFormData({ ...formData, colorHex: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sizes & Variant Stock Matrix */}
                        <div style={{ padding: '16px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '10px', color: c.dark }}>
                                Size Selection & Variant Stock Matrix
                            </label>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                                {DEFAULT_SIZES.map(s => {
                                    const isSel = formData.selectedSizes.includes(s);
                                    return (
                                        <button
                                            key={s} type="button" onClick={() => handleSizeToggle(s)}
                                            style={{
                                                padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: '700',
                                                border: isSel ? '2px solid #09090b' : '1px solid #cbd5e1',
                                                background: isSel ? '#09090b' : '#ffffff',
                                                color: isSel ? '#ffffff' : '#475569',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {s} {isSel ? '✓' : '+'}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Stock inputs per selected size */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                                {formData.selectedSizes.map(s => (
                                    <div key={s} style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <span style={{ fontSize: '12px', fontWeight: '700', color: c.muted, textTransform: 'uppercase' }}>Size {s} Stock</span>
                                        <input 
                                            type="number" min="0" style={{ ...inp, marginTop: '4px', padding: '6px 10px' }}
                                            value={formData.stockPerSize[s] ?? 0}
                                            onChange={e => handleStockChange(s, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Garment Details */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Material / Fabric</label>
                                <input 
                                    style={inp} placeholder="100% Combed Cotton, 240 GSM"
                                    value={formData.material} onChange={e => setFormData({ ...formData, material: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Fit Description</label>
                                <input 
                                    style={inp} placeholder="Oversized Boxy Silhouette"
                                    value={formData.fit} onChange={e => setFormData({ ...formData, fit: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Model Stats</label>
                                <input 
                                    style={inp} placeholder="Model is 6'1 wearing size L"
                                    value={formData.modelStats} onChange={e => setFormData({ ...formData, modelStats: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Description *</label>
                            <textarea 
                                rows={3} style={{ ...inp, resize: 'vertical' }} required
                                placeholder="Describe the silhouette, styling tips, feel, and details..."
                                value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        {/* Image URLs & Files */}
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                                Product Photos (Image URLs or Upload)
                            </label>
                            {urlImages.map((url, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                    <input 
                                        style={inp} placeholder="https://images.unsplash.com/photo-..."
                                        value={url} onChange={e => {
                                            const updated = [...urlImages];
                                            updated[idx] = e.target.value;
                                            setUrlImages(updated);
                                        }}
                                    />
                                    {urlImages.length > 1 && (
                                        <button 
                                            type="button" onClick={() => setUrlImages(urlImages.filter((_, i) => i !== idx))}
                                            style={{ background: '#fee2e2', border: 'none', borderRadius: '8px', padding: '0 12px', cursor: 'pointer' }}
                                        >
                                            <X size={16} color="#ef4444" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button" onClick={() => setUrlImages([...urlImages, ''])}
                                style={{ background: 'none', border: '1px dashed #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                            >
                                + Add Image URL
                            </button>

                            <div style={{ marginTop: '12px' }}>
                                <label style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                                    background: '#f1f5f9', padding: '8px 14px', borderRadius: '8px',
                                    cursor: 'pointer', fontSize: '13px', fontWeight: '600'
                                }}>
                                    <Upload size={16} /> Upload Photos from Computer
                                    <input 
                                        type="file" multiple accept="image/*" style={{ display: 'none' }}
                                        onChange={e => setFileImages(Array.from(e.target.files))}
                                    />
                                </label>
                                {fileImages.length > 0 && (
                                    <span style={{ marginLeft: '12px', fontSize: '13px', color: '#16a34a', fontWeight: '600' }}>
                                        {fileImages.length} photo(s) selected
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Merchandising Badges */}
                        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', paddingTop: '8px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                                <input 
                                    type="checkbox" checked={formData.isNewDrop}
                                    onChange={e => setFormData({ ...formData, isNewDrop: e.target.checked })}
                                />
                                Mark as "New Drop"
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                                <input 
                                    type="checkbox" checked={formData.isBestseller}
                                    onChange={e => setFormData({ ...formData, isBestseller: e.target.checked })}
                                />
                                Mark as "Bestseller"
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                                <input 
                                    type="checkbox" checked={formData.isAvailable}
                                    onChange={e => setFormData({ ...formData, isAvailable: e.target.checked })}
                                />
                                Available for Purchase
                            </label>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                            <button
                                type="submit"
                                style={{
                                    background: c.dark, color: '#ffffff', border: 'none',
                                    borderRadius: '8px', padding: '12px 28px', fontSize: '15px',
                                    fontWeight: '700', cursor: 'pointer'
                                }}
                            >
                                {editingId ? 'Update Product' : 'Add to Catalog'}
                            </button>
                            {editingId && (
                                <button
                                    type="button" onClick={resetForm}
                                    style={{
                                        background: '#f1f5f9', color: '#475569', border: 'none',
                                        borderRadius: '8px', padding: '12px 20px', fontSize: '15px',
                                        fontWeight: '600', cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    {['All', 'Men', 'Women', 'Unisex', 'T-Shirts', 'Hoodies'].map(tab => (
                        <button
                            key={tab} onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                                border: 'none', cursor: 'pointer',
                                background: activeTab === tab ? c.dark : '#ffffff',
                                color: activeTab === tab ? '#ffffff' : '#64748b',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Catalog Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {filteredProducts.map(p => (
                        <div key={p._id} style={{
                            background: '#ffffff', borderRadius: '12px', overflow: 'hidden',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0',
                            display: 'flex', flexDirection: 'column'
                        }}>
                            <div style={{ height: '220px', overflow: 'hidden', position: 'relative', background: '#f8fafc' }}>
                                <img 
                                    src={p.images?.[0] ? getImageUrl(p.images[0]) : (p.image ? getImageUrl(p.image) : '')} 
                                    alt={p.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800'; }}
                                />
                                <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', gap: '4px' }}>
                                    {p.isNewDrop && <span style={{ background: '#09090b', color: '#fff', fontSize: '10px', padding: '3px 6px', borderRadius: '4px', fontWeight: '700' }}>NEW</span>}
                                    {p.gender && <span style={{ background: 'rgba(255,255,255,0.9)', color: '#09090b', fontSize: '10px', padding: '3px 6px', borderRadius: '4px', fontWeight: '700' }}>{p.gender}</span>}
                                </div>
                            </div>
                            <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: '600', textTransform: 'uppercase' }}>
                                        {p.brand || 'True Threads'} • {p.category}
                                    </div>
                                    <h3 style={{ margin: '4px 0 8px', fontSize: '16px', fontWeight: '700', color: c.dark }}>
                                        {p.name}
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '16px', fontWeight: '800', color: c.dark }}>
                                            ₹{p.discountPrice && p.discountPrice > 0 ? p.discountPrice : p.price}
                                        </span>
                                        {p.discountPrice && p.discountPrice > 0 && (
                                            <span style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'line-through' }}>
                                                ₹{p.price}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                        {(p.sizes || []).map(s => {
                                            const v = p.variants?.find(x => x.size === s);
                                            const stock = v ? v.stock : '-';
                                            return (
                                                <span key={s} style={{
                                                    fontSize: '11px', fontWeight: '600', background: '#f1f5f9',
                                                    padding: '2px 6px', borderRadius: '4px', color: '#334155'
                                                }}>
                                                    {s}: {stock}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                                    <button
                                        onClick={() => toggleAvailability(p)}
                                        style={{
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            fontSize: '13px', fontWeight: '600',
                                            color: p.isAvailable ? '#16a34a' : '#dc2626'
                                        }}
                                    >
                                        {p.isAvailable ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                                        {p.isAvailable ? 'In Stock' : 'Hidden'}
                                    </button>

                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => handleEditClick(p)}
                                            style={{
                                                background: '#f1f5f9', border: 'none', borderRadius: '6px',
                                                padding: '6px 10px', cursor: 'pointer', color: '#334155'
                                            }}
                                        >
                                            <Pencil size={15} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(p._id)}
                                            style={{
                                                background: '#fee2e2', border: 'none', borderRadius: '6px',
                                                padding: '6px 10px', cursor: 'pointer', color: '#ef4444'
                                            }}
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
