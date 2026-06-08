// src/pages/admin/AdminUtilities.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/admin/AdminSidebar';
import productService from '../../services/productService';
import notificationService from '../../services/notificationService';
import '../../index.css';

const AdminUtilities = () => {
    const { user } = useAuth();
    
    // Product Types Tab State
    const [activeTab, setActiveTab] = useState('product-types');
    const [productTypes, setProductTypes] = useState([]);
    const [typeStats, setTypeStats] = useState([]);
    const [loadingTypes, setLoadingTypes] = useState(false);
    const [typeError, setTypeError] = useState(null);
    
    // Validate Product Type Form
    const [validateForm, setValidateForm] = useState({
        name: '',
        productType: 'Furniture',
        width: '',
        height: '',
        depth: '',
        weight: '',
        basePrice: '',
        categoryId: '1'
    });
    const [validateLoading, setValidateLoading] = useState(false);
    const [validateResult, setValidateResult] = useState(null);
    const [validateError, setValidateError] = useState(null);

    // Notification Testing State
    const [emailForm, setEmailForm] = useState({
        to: user?.email || '',
        subject: 'Test Email',
        body: 'This is a test email from FurnitureShop Admin'
    });
    const [smsForm, setSmsForm] = useState({
        phoneNumber: '',
        message: 'Test SMS from FurnitureShop Admin'
    });
    const [notificationLoading, setNotificationLoading] = useState(false);
    const [notificationStatus, setNotificationStatus] = useState(null);
    const [notificationError, setNotificationError] = useState(null);

    // Load Product Types
    useEffect(() => {
        if (activeTab === 'product-types') {
            loadProductTypesData();
        }
    }, [activeTab]);

    const loadProductTypesData = async () => {
        setLoadingTypes(true);
        setTypeError(null);
        try {
            // Fetch available types
            const typesResult = await productService.getProductTypes();
            if (typesResult.success) {
                setProductTypes(typesResult.data ?? []);
            }
            
            // Fetch stats
            const statsResult = await productService.getProductTypeStats();
            if (statsResult.success) {
                setTypeStats(statsResult.data ?? []);
            }
        } catch (err) {
            setTypeError('Không thể tải thông tin loại sản phẩm');
        } finally {
            setLoadingTypes(false);
        }
    };

    const handleValidateProduct = async (e) => {
        e.preventDefault();
        setValidateLoading(true);
        setValidateError(null);
        setValidateResult(null);

        try {
            const result = await productService.validateProductType({
                name: validateForm.name,
                productType: validateForm.productType,
                width: parseFloat(validateForm.width) || 0,
                height: parseFloat(validateForm.height) || 0,
                depth: parseFloat(validateForm.depth) || 0,
                weight: parseFloat(validateForm.weight) || 0,
                basePrice: parseFloat(validateForm.basePrice) || 0,
                categoryId: parseInt(validateForm.categoryId) || 1
            });

            if (result.success) {
                setValidateResult(result.data);
            } else {
                setValidateError(result.message || 'Kiểm tra thất bại');
            }
        } catch (err) {
            setValidateError('Lỗi: ' + (err.message || 'Không thể kiểm tra sản phẩm'));
        } finally {
            setValidateLoading(false);
        }
    };

    const handleSendTestEmail = async (e) => {
        e.preventDefault();
        setNotificationLoading(true);
        setNotificationError(null);
        setNotificationStatus(null);

        try {
            const result = await notificationService.sendTestEmail(
                emailForm.to,
                emailForm.subject,
                emailForm.body
            );

            if (result.success) {
                setNotificationStatus('✓ Email test đã được gửi (check queue)');
                setEmailForm({ ...emailForm, to: emailForm.to });
            } else {
                setNotificationError(result.message || 'Gửi email thất bại');
            }
        } catch (err) {
            setNotificationError('Lỗi: ' + (err.message || 'Không thể gửi email'));
        } finally {
            setNotificationLoading(false);
        }
    };

    const handleSendTestSms = async (e) => {
        e.preventDefault();
        setNotificationLoading(true);
        setNotificationError(null);
        setNotificationStatus(null);

        try {
            const result = await notificationService.sendTestSms(
                smsForm.phoneNumber,
                smsForm.message
            );

            if (result.success) {
                setNotificationStatus('✓ SMS test đã được gửi (check queue)');
            } else {
                setNotificationError(result.message || 'Gửi SMS thất bại');
            }
        } catch (err) {
            setNotificationError('Lỗi: ' + (err.message || 'Không thể gửi SMS'));
        } finally {
            setNotificationLoading(false);
        }
    };

    return (
        <div className="admin-layout">
            <AdminSidebar />

            <main className="admin-main">
                <div className="admin-header">
                    <h1>⚙️ Tiện ích Admin</h1>
                    <p>Quản lý loại sản phẩm, thử nghiệm thông báo</p>
                </div>

                {/* Tab Navigation */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #e5e7eb' }}>
                    <button
                        onClick={() => setActiveTab('product-types')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: activeTab === 'product-types' ? '#C8102E' : 'transparent',
                            color: activeTab === 'product-types' ? '#fff' : '#666',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600,
                            borderBottom: activeTab === 'product-types' ? '3px solid #C8102E' : 'none'
                        }}
                    >
                        📦 Loại Sản Phẩm
                    </button>
                    <button
                        onClick={() => setActiveTab('notifications')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: activeTab === 'notifications' ? '#C8102E' : 'transparent',
                            color: activeTab === 'notifications' ? '#fff' : '#666',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600,
                            borderBottom: activeTab === 'notifications' ? '3px solid #C8102E' : 'none'
                        }}
                    >
                        📨 Thử Nghiệm Thông Báo
                    </button>
                </div>

                {/* Product Types Tab */}
                {activeTab === 'product-types' && (
                    <div>
                        {typeError && (
                            <div style={{ color: '#ef4444', background: '#fef2f2', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                                {typeError}
                            </div>
                        )}

                        {loadingTypes ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                                Đang tải...
                            </div>
                        ) : (
                            <>
                                {/* Types List */}
                                {productTypes.length > 0 && (
                                    <div style={{ marginBottom: '2rem' }}>
                                        <h3 style={{ marginBottom: '1rem' }}>Các Loại Sản Phẩm Hiện Có</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                            {productTypes.map((type, i) => (
                                                <div key={i} style={{
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '0.5rem',
                                                    padding: '1rem',
                                                    background: '#f9fafb'
                                                }}>
                                                    <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{type}</div>
                                                    {typeStats.find(s => s.productType === type) && (
                                                        <div style={{ fontSize: '0.9em', color: '#666' }}>
                                                            👥 {typeStats.find(s => s.productType === type)?.count || 0} sản phẩm
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Validate Product Form */}
                                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1.5rem' }}>
                                    <h3 style={{ marginBottom: '1rem' }}>Kiểm Tra Loại Sản Phẩm</h3>
                                    <form onSubmit={handleValidateProduct}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Tên Sản Phẩm *</label>
                                                <input
                                                    type="text"
                                                    value={validateForm.name}
                                                    onChange={(e) => setValidateForm({ ...validateForm, name: e.target.value })}
                                                    placeholder="VD: Bàn ăn gỗ"
                                                    required
                                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '0.25rem' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Loại *</label>
                                                <select
                                                    value={validateForm.productType}
                                                    onChange={(e) => setValidateForm({ ...validateForm, productType: e.target.value })}
                                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '0.25rem' }}
                                                >
                                                    {productTypes.map((type) => (
                                                        <option key={type} value={type}>{type}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Chiều rộng (cm)</label>
                                                <input
                                                    type="number"
                                                    value={validateForm.width}
                                                    onChange={(e) => setValidateForm({ ...validateForm, width: e.target.value })}
                                                    placeholder="80"
                                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '0.25rem' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Chiều cao (cm)</label>
                                                <input
                                                    type="number"
                                                    value={validateForm.height}
                                                    onChange={(e) => setValidateForm({ ...validateForm, height: e.target.value })}
                                                    placeholder="75"
                                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '0.25rem' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Chiều sâu (cm)</label>
                                                <input
                                                    type="number"
                                                    value={validateForm.depth}
                                                    onChange={(e) => setValidateForm({ ...validateForm, depth: e.target.value })}
                                                    placeholder="120"
                                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '0.25rem' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Trọng lượng (kg)</label>
                                                <input
                                                    type="number"
                                                    value={validateForm.weight}
                                                    onChange={(e) => setValidateForm({ ...validateForm, weight: e.target.value })}
                                                    placeholder="50"
                                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '0.25rem' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Giá (VND)</label>
                                                <input
                                                    type="number"
                                                    value={validateForm.basePrice}
                                                    onChange={(e) => setValidateForm({ ...validateForm, basePrice: e.target.value })}
                                                    placeholder="5000000"
                                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '0.25rem' }}
                                                />
                                            </div>
                                        </div>

                                        {validateError && (
                                            <div style={{ color: '#ef4444', background: '#fef2f2', padding: '0.75rem', borderRadius: '0.25rem', marginBottom: '1rem' }}>
                                                {validateError}
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={validateLoading}
                                            style={{
                                                background: '#C8102E',
                                                color: '#fff',
                                                padding: '0.75rem 1.5rem',
                                                border: 'none',
                                                borderRadius: '0.25rem',
                                                cursor: validateLoading ? 'not-allowed' : 'pointer',
                                                opacity: validateLoading ? 0.6 : 1
                                            }}
                                        >
                                            {validateLoading ? 'Đang kiểm tra...' : 'Kiểm Tra'}
                                        </button>

                                        {validateResult && (
                                            <div style={{
                                                marginTop: '1rem',
                                                background: '#ecfdf5',
                                                border: '1px solid #d1fae5',
                                                borderRadius: '0.25rem',
                                                padding: '1rem',
                                                color: '#047857'
                                            }}>
                                                <strong>✓ Kiểm tra thành công:</strong>
                                                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                                                    <li>Loại: {validateResult.productType}</li>
                                                    <li>Mô tả: {validateResult.description}</li>
                                                    <li>Cân nặng vận chuyển: {validateResult.estimatedShippingWeight} kg</li>
                                                    {validateResult.requiredAttributes?.length > 0 && (
                                                        <li>Thuộc tính bắt buộc: {validateResult.requiredAttributes.join(', ')}</li>
                                                    )}
                                                </ul>
                                            </div>
                                        )}
                                    </form>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                    <div>
                        {notificationStatus && (
                            <div style={{
                                color: '#047857',
                                background: '#ecfdf5',
                                border: '1px solid #d1fae5',
                                padding: '1rem',
                                borderRadius: '0.5rem',
                                marginBottom: '1rem'
                            }}>
                                {notificationStatus}
                            </div>
                        )}

                        {notificationError && (
                            <div style={{
                                color: '#ef4444',
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                padding: '1rem',
                                borderRadius: '0.5rem',
                                marginBottom: '1rem'
                            }}>
                                {notificationError}
                            </div>
                        )}

                        {/* Email Test Form */}
                        <div style={{
                            background: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.5rem',
                            padding: '1.5rem',
                            marginBottom: '2rem'
                        }}>
                            <h3 style={{ marginBottom: '1rem' }}>📧 Thử Nghiệm Email</h3>
                            <form onSubmit={handleSendTestEmail}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Địa chỉ Email *</label>
                                    <input
                                        type="email"
                                        value={emailForm.to}
                                        onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '0.25rem' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Tiêu đề</label>
                                    <input
                                        type="text"
                                        value={emailForm.subject}
                                        onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '0.25rem' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Nội dung</label>
                                    <textarea
                                        value={emailForm.body}
                                        onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
                                        rows={4}
                                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '0.25rem' }}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={notificationLoading}
                                    style={{
                                        background: '#C8102E',
                                        color: '#fff',
                                        padding: '0.75rem 1.5rem',
                                        border: 'none',
                                        borderRadius: '0.25rem',
                                        cursor: notificationLoading ? 'not-allowed' : 'pointer',
                                        opacity: notificationLoading ? 0.6 : 1
                                    }}
                                >
                                    {notificationLoading ? 'Đang gửi...' : '📤 Gửi Email Test'}
                                </button>
                            </form>
                        </div>

                        {/* SMS Test Form */}
                        <div style={{
                            background: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.5rem',
                            padding: '1.5rem'
                        }}>
                            <h3 style={{ marginBottom: '1rem' }}>📱 Thử Nghiệm SMS</h3>
                            <form onSubmit={handleSendTestSms}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Số Điện Thoại *</label>
                                    <input
                                        type="tel"
                                        value={smsForm.phoneNumber}
                                        onChange={(e) => setSmsForm({ ...smsForm, phoneNumber: e.target.value })}
                                        placeholder="0901234567"
                                        required
                                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '0.25rem' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Tin Nhắn</label>
                                    <textarea
                                        value={smsForm.message}
                                        onChange={(e) => setSmsForm({ ...smsForm, message: e.target.value })}
                                        rows={3}
                                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '0.25rem' }}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={notificationLoading}
                                    style={{
                                        background: '#C8102E',
                                        color: '#fff',
                                        padding: '0.75rem 1.5rem',
                                        border: 'none',
                                        borderRadius: '0.25rem',
                                        cursor: notificationLoading ? 'not-allowed' : 'pointer',
                                        opacity: notificationLoading ? 0.6 : 1
                                    }}
                                >
                                    {notificationLoading ? 'Đang gửi...' : '📤 Gửi SMS Test'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminUtilities;
