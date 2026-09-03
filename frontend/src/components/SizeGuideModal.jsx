import React, { useState } from 'react';
import { X, Ruler } from 'lucide-react';

const DEFAULT_SIZE_CHART = [
    { size: 'XS', chest: '36', length: '26', shoulder: '16.5', waist: '34' },
    { size: 'S',  chest: '38', length: '27', shoulder: '17.5', waist: '36' },
    { size: 'M',  chest: '40', length: '28', shoulder: '18.5', waist: '38' },
    { size: 'L',  chest: '42', length: '29', shoulder: '19.5', waist: '40' },
    { size: 'XL', chest: '44', length: '30', shoulder: '20.5', waist: '42' },
    { size: 'XXL',chest: '46', length: '31', shoulder: '21.5', waist: '44' },
];

export default function SizeGuideModal({ isOpen, onClose, customChart, category = 'Apparel' }) {
    const [unit, setUnit] = useState('inches'); // 'inches' | 'cm'

    if (!isOpen) return null;

    const chart = (customChart && customChart.length > 0) ? customChart : DEFAULT_SIZE_CHART;

    const convert = (val) => {
        const num = parseFloat(val);
        if (isNaN(num)) return val;
        if (unit === 'cm') {
            return (num * 2.54).toFixed(1);
        }
        return num;
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(6px)',
            padding: '16px'
        }}>
            <div style={{
                background: '#ffffff',
                borderRadius: '16px',
                maxWidth: '640px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                position: 'relative',
                padding: '28px',
                border: '1px solid #e5e7eb'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            background: '#f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Ruler size={18} color="#09090b" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#09090b' }}>
                                Size & Fit Guide
                            </h3>
                            <p style={{ margin: 0, fontSize: '13px', color: '#71717a' }}>
                                Standard Garment Measurements ({category})
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        style={{
                            background: '#f4f4f5',
                            border: 'none',
                            borderRadius: '50%',
                            width: '34px',
                            height: '34px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <X size={18} color="#09090b" />
                    </button>
                </div>

                {/* Unit Switcher */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                    <div style={{
                        display: 'inline-flex',
                        background: '#f4f4f5',
                        borderRadius: '8px',
                        padding: '4px',
                        gap: '4px'
                    }}>
                        <button
                            onClick={() => setUnit('inches')}
                            style={{
                                padding: '6px 14px',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                background: unit === 'inches' ? '#09090b' : 'transparent',
                                color: unit === 'inches' ? '#ffffff' : '#71717a',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Inches
                        </button>
                        <button
                            onClick={() => setUnit('cm')}
                            style={{
                                padding: '6px 14px',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                background: unit === 'cm' ? '#09090b' : 'transparent',
                                color: unit === 'cm' ? '#ffffff' : '#71717a',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            CM
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto', border: '1px solid #e4e4e7', borderRadius: '10px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '14px' }}>
                        <thead>
                            <tr style={{ background: '#fafafa', borderBottom: '1px solid #e4e4e7' }}>
                                <th style={{ padding: '12px', fontWeight: '700', color: '#09090b' }}>Size</th>
                                <th style={{ padding: '12px', fontWeight: '700', color: '#09090b' }}>Chest ({unit})</th>
                                <th style={{ padding: '12px', fontWeight: '700', color: '#09090b' }}>Length ({unit})</th>
                                <th style={{ padding: '12px', fontWeight: '700', color: '#09090b' }}>Shoulder ({unit})</th>
                                <th style={{ padding: '12px', fontWeight: '700', color: '#09090b' }}>Waist ({unit})</th>
                            </tr>
                        </thead>
                        <tbody>
                            {chart.map((row, idx) => (
                                <tr key={idx} style={{ borderBottom: idx === chart.length - 1 ? 'none' : '1px solid #f4f4f5' }}>
                                    <td style={{ padding: '12px', fontWeight: '700', color: '#09090b' }}>{row.size}</td>
                                    <td style={{ padding: '12px', color: '#52525b' }}>{convert(row.chest)}</td>
                                    <td style={{ padding: '12px', color: '#52525b' }}>{convert(row.length)}</td>
                                    <td style={{ padding: '12px', color: '#52525b' }}>{convert(row.shoulder)}</td>
                                    <td style={{ padding: '12px', color: '#52525b' }}>{convert(row.waist)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Measuring Tips */}
                <div style={{
                    marginTop: '20px',
                    padding: '16px',
                    borderRadius: '10px',
                    background: '#fafafa',
                    border: '1px solid #f4f4f5',
                    fontSize: '13px',
                    color: '#71717a',
                    lineHeight: '1.6'
                }}>
                    <strong style={{ color: '#09090b', display: 'block', marginBottom: '6px' }}>
                        Measuring Instructions:
                    </strong>
                    • <strong>Chest:</strong> Measure around the fullest part of your chest, keeping the tape horizontal.<br />
                    • <strong>Length:</strong> Measure straight down from the highest point of the shoulder seam to the hem.<br />
                    • <strong>Fit Note:</strong> For an oversized, streetwear look, we recommend ordering your standard size. For a regular fit, consider sizing down.
                </div>
            </div>
        </div>
    );
}
