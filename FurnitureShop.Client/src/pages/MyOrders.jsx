// src/pages/MyOrders.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/navbar';
import Footer from '../components/Footer';
import orderService from '../services/orderService';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const fmt = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n ?? 0);

const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('vi-VN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
    });
};

const ORDER_STATUSES = {
    1: { label: 'Chờ xác nhận', class: 'pending', icon: '⏳', color: '#f59e0b', bg: '#fffbeb' },
    2: { label: 'Đang xử lý',   class: 'processing', icon: '🔄', color: '#3b82f6', bg: '#eff6ff' },
    3: { label: 'Đang giao hàng', class: 'shipped', icon: '🚚', color: '#8b5cf6', bg: '#f5f3ff' },
    4: { label: 'Hoàn thành',   class: 'completed', icon: '✅', color: '#10b981', bg: '#ecfdf5' },
    5: { label: 'Đã hủy',       class: 'cancelled', icon: '❌', color: '#ef4444', bg: '#fef2f2' },
};

const PAYMENT_LABELS = {
    'COD': 'Thanh toán khi nhận hàng',
    'BankTransfer': 'Chuyển khoản ngân hàng',
    'CreditCard': 'Thẻ tín dụng',
    'MoMo': 'Ví MoMo',
    'VNPay': 'VNPay',
};

// ─────────────────────────────────────────────
// Progress Steps
// ─────────────────────────────────────────────
const STEPS = [
    { status: 1, label: 'Chờ xác nhận', icon: '📋' },
    { status: 2, label: 'Đang xử lý',   icon: '⚙️' },
    { status: 3, label: 'Đang giao',     icon: '🚚' },
    { status: 4, label: 'Hoàn thành',   icon: '✅' },
];

function OrderProgress({ status }) {
    if (status === 5) {
        return (
            <div style={styles.progressCancelled}>
                <span style={{ fontSize: '1.5rem' }}>❌</span>
                <span style={{ fontWeight: 600, color: '#ef4444' }}>Đơn hàng đã bị hủy</span>
            </div>
        );
    }

    return (
        <div style={styles.progressContainer}>
            {STEPS.map((step, i) => {
                const isDone = status > step.status;
                const isActive = status === step.status;
                return (
                    <React.Fragment key={step.status}>
                        <div style={styles.progressStep}>
                            <div style={{
                                ...styles.progressCircle,
                                background: isDone || isActive ? '#C8102E' : '#e5e7eb',
                                color: isDone || isActive ? '#fff' : '#9ca3af',
                                boxShadow: isActive ? '0 0 0 4px rgba(200,16,46,0.2)' : 'none',
                                transform: isActive ? 'scale(1.15)' : 'scale(1)',
                            }}>
                                {isDone ? '✓' : step.icon}
                            </div>
                            <span style={{
                                ...styles.progressLabel,
                                color: isDone || isActive ? '#C8102E' : '#9ca3af',
                                fontWeight: isActive ? 700 : 400,
                            }}>
                                {step.label}
                            </span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div style={{
                                ...styles.progressLine,
                                background: status > step.status ? '#C8102E' : '#e5e7eb',
                            }} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

// ─────────────────────────────────────────────
// Order List View
// ─────────────────────────────────────────────
function OrderList({ orders, onSelect }) {
    const [filterStatus, setFilterStatus] = useState('');
    const filtered = filterStatus
        ? orders.filter(o => o.status === parseInt(filterStatus))
        : orders;

    return (
        <div>
            {/* Filter tabs */}
            <div style={styles.filterTabs}>
                {[
                    { value: '', label: 'Tất cả' },
                    { value: '1', label: '⏳ Chờ xác nhận' },
                    { value: '2', label: '🔄 Đang xử lý' },
                    { value: '3', label: '🚚 Đang giao hàng' },
                    { value: '4', label: '✅ Hoàn thành' },
                    { value: '5', label: '❌ Đã hủy' },
                ].map(tab => (
                    <button
                        key={tab.value}
                        style={{
                            ...styles.filterTab,
                            ...(filterStatus === tab.value ? styles.filterTabActive : {}),
                        }}
                        onClick={() => setFilterStatus(tab.value)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <div style={styles.emptyState}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                    <p style={{ color: '#6b7280', fontSize: '1rem' }}>
                        {filterStatus ? 'Không có đơn hàng nào ở trạng thái này.' : 'Bạn chưa có đơn hàng nào.'}
                    </p>
                    <Link to="/" style={styles.shopNowBtn}>Mua sắm ngay</Link>
                </div>
            ) : (
                <div style={styles.orderList}>
                    {filtered.map(order => {
                        const st = ORDER_STATUSES[order.status] || ORDER_STATUSES[1];
                        return (
                            <div
                                key={order.orderId}
                                style={styles.orderCard}
                                onClick={() => onSelect(order.orderId)}
                            >
                                <div style={styles.orderCardTop}>
                                    <div>
                                        <span style={styles.orderNumber}>#{order.orderNumber}</span>
                                        <span style={styles.orderDate}>{fmtDate(order.createdAt)}</span>
                                    </div>
                                    <span style={{
                                        ...styles.statusBadge,
                                        color: st.color,
                                        background: st.bg,
                                    }}>
                                        {st.icon} {st.label}
                                    </span>
                                </div>

                                <div style={styles.orderCardMid}>
                                    <div style={styles.orderMeta}>
                                        <span style={styles.metaItem}>
                                            🛍️ {order.orderDetails?.length ?? '—'} sản phẩm
                                        </span>
                                        <span style={styles.metaItem}>
                                            {order.isPaid
                                                ? <span style={{ color: '#10b981' }}>✓ Đã thanh toán</span>
                                                : <span style={{ color: '#f59e0b' }}>○ Chưa thanh toán</span>}
                                        </span>
                                    </div>
                                    <div style={styles.orderTotal}>
                                        {fmt(order.totalAmount)}
                                    </div>
                                </div>

                                <div style={styles.orderCardFooter}>
                                    <span style={styles.viewDetailHint}>Xem chi tiết →</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────
// Order Detail View
// ─────────────────────────────────────────────
function OrderDetail({ orderId, onBack }) {
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const result = await orderService.getOrderById(orderId);
                if (result.success && result.data) {
                    setOrder(result.data);
                } else {
                    setError(result.message || 'Không thể tải chi tiết đơn hàng');
                }
            } catch (e) {
                setError('Không thể tải chi tiết đơn hàng. Vui lòng thử lại.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [orderId]);

    if (loading) {
        return (
            <div style={styles.loadingBox}>
                <div style={styles.spinner} />
                <p style={{ color: '#6b7280', marginTop: '1rem' }}>Đang tải đơn hàng…</p>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div style={styles.errorBox}>
                <p>{error || 'Không tìm thấy đơn hàng'}</p>
                <button onClick={onBack} style={styles.backBtn}>← Quay lại</button>
            </div>
        );
    }

    const st = ORDER_STATUSES[order.status] || ORDER_STATUSES[1];
    const subTotal = order.subTotal ?? 0;
    const shippingFee = order.shippingFee ?? 0;
    const totalAmount = order.totalAmount ?? 0;
    const details = order.orderDetails ?? [];

    return (
        <div>
            {/* Back button + header */}
            <div style={styles.detailHeader}>
                <button onClick={onBack} style={styles.backBtn}>← Danh sách đơn hàng</button>
                <div style={styles.detailMeta}>
                    <h2 style={styles.detailTitle}>Đơn hàng #{order.orderNumber}</h2>
                    <span style={styles.detailDate}>{fmtDate(order.createdAt)}</span>
                </div>
                <span style={{
                    ...styles.statusBadgeLg,
                    color: st.color,
                    background: st.bg,
                    border: `1px solid ${st.color}33`,
                }}>
                    {st.icon} {st.label}
                </span>
            </div>

            {/* Progress tracker */}
            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Trạng thái đơn hàng</h3>
                <OrderProgress status={order.status} />
            </div>

            {/* Products */}
            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Sản phẩm đã đặt ({details.length})</h3>
                <div style={styles.productList}>
                    {details.map((item) => {
                        const attrs = (() => {
                            try {
                                return item.selectedAttributes
                                    ? JSON.parse(item.selectedAttributes)
                                    : null;
                            } catch { return null; }
                        })();
                        return (
                            <div key={item.orderDetailId} style={styles.productRow}>
                                <div style={styles.productImageBox}>
                                    {item.product?.images?.[0]?.imageUrl ? (
                                        <img
                                            src={item.product.images[0].imageUrl}
                                            alt={item.productName}
                                            style={styles.productImage}
                                        />
                                    ) : (
                                        <div style={styles.productImagePlaceholder}>🛋️</div>
                                    )}
                                </div>
                                <div style={styles.productInfo}>
                                    <div style={styles.productName}>{item.productName}</div>
                                    {item.productSKU && (
                                        <div style={styles.productSku}>SKU: {item.productSKU}</div>
                                    )}
                                    {attrs && (
                                        <div style={styles.productAttrs}>
                                            {Object.entries(attrs).map(([k, v]) => (
                                                <span key={k} style={styles.attrTag}>
                                                    {k}: {v}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div style={styles.productQty}>x{item.quantity}</div>
                                <div style={styles.productTotal}>
                                    <div style={styles.unitPrice}>{fmt(item.unitPrice)} / cái</div>
                                    <div style={styles.lineTotal}>{fmt(item.unitPrice * item.quantity)}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Price summary */}
                <div style={styles.priceSummary}>
                    <div style={styles.priceRow}>
                        <span>Tạm tính</span>
                        <span>{fmt(subTotal)}</span>
                    </div>
                    <div style={styles.priceRow}>
                        <span>Phí vận chuyển</span>
                        <span>{shippingFee === 0 ? 'Miễn phí' : fmt(shippingFee)}</span>
                    </div>
                    {order.discountAmount > 0 && (
                        <div style={{ ...styles.priceRow, color: '#10b981' }}>
                            <span>Giảm giá</span>
                            <span>- {fmt(order.discountAmount)}</span>
                        </div>
                    )}
                    <div style={styles.priceDivider} />
                    <div style={styles.totalRow}>
                        <span>Tổng cộng</span>
                        <span style={{ color: '#C8102E' }}>{fmt(totalAmount)}</span>
                    </div>
                </div>
            </div>

            {/* 2-column: Shipping + Payment */}
            <div style={styles.infoGrid}>
                {/* Shipping info */}
                <div style={styles.infoCard}>
                    <h3 style={styles.sectionTitle}>📍 Thông tin giao hàng</h3>
                    <div style={styles.infoRows}>
                        <div style={styles.infoRow}>
                            <span style={styles.infoLabel}>Họ tên</span>
                            <span style={styles.infoValue}>{order.shippingFullName}</span>
                        </div>
                        <div style={styles.infoRow}>
                            <span style={styles.infoLabel}>Số điện thoại</span>
                            <span style={styles.infoValue}>{order.shippingPhone}</span>
                        </div>
                        <div style={styles.infoRow}>
                            <span style={styles.infoLabel}>Địa chỉ</span>
                            <span style={styles.infoValue}>
                                {[
                                    order.shippingAddress,
                                    order.shippingWard,
                                    order.shippingDistrict,
                                    order.shippingCity
                                ].filter(Boolean).join(', ')}
                            </span>
                        </div>
                        {order.shippingMethod && (
                            <div style={styles.infoRow}>
                                <span style={styles.infoLabel}>Phương thức</span>
                                <span style={styles.infoValue}>{order.shippingMethod.name}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Payment info */}
                <div style={styles.infoCard}>
                    <h3 style={styles.sectionTitle}>💳 Thông tin thanh toán</h3>
                    <div style={styles.infoRows}>
                        <div style={styles.infoRow}>
                            <span style={styles.infoLabel}>Phương thức</span>
                            <span style={styles.infoValue}>
                                {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod || '—'}
                            </span>
                        </div>
                        <div style={styles.infoRow}>
                            <span style={styles.infoLabel}>Trạng thái</span>
                            <span style={{
                                ...styles.infoValue,
                                color: order.isPaid ? '#10b981' : '#f59e0b',
                                fontWeight: 600,
                            }}>
                                {order.isPaid ? '✓ Đã thanh toán' : '○ Chưa thanh toán'}
                            </span>
                        </div>
                        {order.isPaid && order.paidAt && (
                            <div style={styles.infoRow}>
                                <span style={styles.infoLabel}>Thanh toán lúc</span>
                                <span style={styles.infoValue}>{fmtDate(order.paidAt)}</span>
                            </div>
                        )}
                        <div style={styles.infoRow}>
                            <span style={styles.infoLabel}>Tổng tiền</span>
                            <span style={{ ...styles.infoValue, color: '#C8102E', fontWeight: 700, fontSize: '1.1rem' }}>
                                {fmt(totalAmount)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notes */}
            {order.notes && (
                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>📝 Ghi chú đơn hàng</h3>
                    <div style={styles.notesBox}>
                        {order.notes}
                    </div>
                </div>
            )}

            {/* Status history */}
            {order.statusHistories && order.statusHistories.length > 0 && (
                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>📜 Lịch sử trạng thái</h3>
                    <div style={styles.historyList}>
                        {order.statusHistories
                            .slice()
                            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                            .map((h, i) => {
                                const hSt = ORDER_STATUSES[h.toStatus];
                                return (
                                    <div key={i} style={styles.historyItem}>
                                        <div style={{
                                            ...styles.historyDot,
                                            background: hSt?.color || '#9ca3af',
                                        }} />
                                        <div style={styles.historyContent}>
                                            <span style={{ fontWeight: 600, color: hSt?.color }}>
                                                {hSt?.icon} {hSt?.label}
                                            </span>
                                            {h.notes && (
                                                <span style={styles.historyNote}> — {h.notes}</span>
                                            )}
                                            <div style={styles.historyDate}>{fmtDate(h.createdAt)}</div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function MyOrders() {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOrderId, setSelectedOrderId] = useState(null);

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/login?redirect=/my-orders');
            return;
        }
        const load = async () => {
            try {
                setLoading(true);
                const result = await orderService.getUserOrders(user.userId || user.id);
                if (result.success && result.data) {
                    setOrders(Array.isArray(result.data) ? result.data : []);
                } else {
                    setError(result.message || 'Không thể tải danh sách đơn hàng.');
                }
            } catch (e) {
                setError('Không thể tải danh sách đơn hàng.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user]);

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />

            <main style={styles.main}>
                <div style={styles.container}>
                    {/* Page header */}
                    <div style={styles.pageHeader}>
                        <h1 style={styles.pageTitle}>
                            {selectedOrderId ? 'Chi tiết đơn hàng' : 'Đơn hàng của tôi'}
                        </h1>
                        {!selectedOrderId && (
                            <p style={styles.pageSubtitle}>
                                Theo dõi trạng thái và lịch sử mua hàng của bạn
                            </p>
                        )}
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div style={styles.loadingBox}>
                            <div style={styles.spinner} />
                            <p style={{ color: '#6b7280', marginTop: '1rem' }}>Đang tải đơn hàng…</p>
                        </div>
                    ) : error ? (
                        <div style={styles.errorBox}>
                            <p style={{ color: '#ef4444' }}>{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                style={styles.retryBtn}
                            >
                                Thử lại
                            </button>
                        </div>
                    ) : selectedOrderId ? (
                        <OrderDetail
                            orderId={selectedOrderId}
                            onBack={() => setSelectedOrderId(null)}
                        />
                    ) : (
                        <OrderList
                            orders={orders}
                            onSelect={(id) => setSelectedOrderId(id)}
                        />
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = {
    main: {
        flex: 1,
        background: '#f9fafb',
        padding: '2.5rem 0 4rem',
    },
    container: {
        maxWidth: '900px',
        margin: '0 auto',
        padding: '0 1.5rem',
    },
    pageHeader: {
        marginBottom: '2rem',
    },
    pageTitle: {
        fontFamily: "'Playfair Display', serif",
        fontSize: '2rem',
        fontWeight: 400,
        color: '#1a1a1a',
        marginBottom: '0.25rem',
    },
    pageSubtitle: {
        color: '#6b7280',
        fontSize: '0.95rem',
    },

    // Filter tabs
    filterTabs: {
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap',
        marginBottom: '1.5rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid #e5e7eb',
    },
    filterTab: {
        padding: '0.4rem 0.9rem',
        border: '1px solid #e5e7eb',
        borderRadius: '20px',
        background: '#fff',
        cursor: 'pointer',
        fontSize: '0.85rem',
        color: '#6b7280',
        fontFamily: 'inherit',
        transition: 'all 0.2s',
    },
    filterTabActive: {
        background: '#C8102E',
        borderColor: '#C8102E',
        color: '#fff',
        fontWeight: 600,
    },

    // Order list
    orderList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
    },
    orderCard: {
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '1.25rem 1.5rem',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        ':hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
    },
    orderCardTop: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.875rem',
    },
    orderNumber: {
        fontWeight: 700,
        fontSize: '1rem',
        color: '#1a1a1a',
        marginRight: '0.75rem',
        fontFamily: 'monospace',
    },
    orderDate: {
        color: '#9ca3af',
        fontSize: '0.82rem',
    },
    statusBadge: {
        padding: '0.3rem 0.75rem',
        borderRadius: '20px',
        fontSize: '0.82rem',
        fontWeight: 600,
    },
    orderCardMid: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    orderMeta: {
        display: 'flex',
        gap: '1rem',
    },
    metaItem: {
        fontSize: '0.875rem',
        color: '#6b7280',
    },
    orderTotal: {
        fontWeight: 700,
        fontSize: '1.1rem',
        color: '#C8102E',
    },
    orderCardFooter: {
        marginTop: '0.875rem',
        paddingTop: '0.75rem',
        borderTop: '1px solid #f3f4f6',
        textAlign: 'right',
    },
    viewDetailHint: {
        fontSize: '0.82rem',
        color: '#C8102E',
        fontWeight: 500,
    },

    // Empty state
    emptyState: {
        textAlign: 'center',
        padding: '4rem 2rem',
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
    },
    shopNowBtn: {
        display: 'inline-block',
        marginTop: '1rem',
        padding: '0.6rem 1.5rem',
        background: '#C8102E',
        color: '#fff',
        borderRadius: '6px',
        fontWeight: 600,
        textDecoration: 'none',
        fontSize: '0.9rem',
    },

    // Loading / Error
    loadingBox: {
        textAlign: 'center',
        padding: '4rem 2rem',
    },
    spinner: {
        width: '36px',
        height: '36px',
        border: '3px solid #e5e7eb',
        borderTop: '3px solid #C8102E',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        margin: '0 auto',
    },
    errorBox: {
        textAlign: 'center',
        padding: '3rem',
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #fecaca',
    },
    retryBtn: {
        marginTop: '1rem',
        padding: '0.5rem 1.25rem',
        background: '#C8102E',
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontWeight: 600,
    },

    // Detail header
    detailHeader: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '1.75rem',
        padding: '1.25rem 1.5rem',
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
    },
    backBtn: {
        background: 'none',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '0.45rem 1rem',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: '0.875rem',
        color: '#374151',
        marginRight: 'auto',
    },
    detailMeta: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.2rem',
    },
    detailTitle: {
        fontFamily: "'Playfair Display', serif",
        fontSize: '1.25rem',
        fontWeight: 400,
        color: '#1a1a1a',
    },
    detailDate: {
        fontSize: '0.82rem',
        color: '#9ca3af',
    },
    statusBadgeLg: {
        padding: '0.45rem 1rem',
        borderRadius: '20px',
        fontSize: '0.9rem',
        fontWeight: 700,
    },

    // Section
    section: {
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1.25rem',
    },
    sectionTitle: {
        fontFamily: "'Playfair Display', serif",
        fontSize: '1.1rem',
        fontWeight: 600,
        color: '#1a1a1a',
        marginBottom: '1.25rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid #f3f4f6',
    },

    // Progress
    progressContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
        padding: '0.5rem 0 1.25rem',
    },
    progressStep: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
        minWidth: '80px',
    },
    progressCircle: {
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.1rem',
        fontWeight: 700,
        transition: 'all 0.3s',
    },
    progressLabel: {
        fontSize: '0.78rem',
        textAlign: 'center',
        whiteSpace: 'nowrap',
        transition: 'color 0.3s',
    },
    progressLine: {
        flex: 1,
        height: '3px',
        minWidth: '30px',
        transition: 'background 0.3s',
        marginBottom: '24px',
    },
    progressCancelled: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '1rem 1.5rem',
        background: '#fef2f2',
        borderRadius: '8px',
        border: '1px solid #fecaca',
    },

    // Product list
    productList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
    },
    productRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.875rem',
        background: '#f9fafb',
        borderRadius: '8px',
    },
    productImageBox: {
        width: '64px',
        height: '64px',
        flexShrink: 0,
        borderRadius: '8px',
        overflow: 'hidden',
        background: '#e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    productImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    productImagePlaceholder: {
        fontSize: '1.5rem',
    },
    productInfo: {
        flex: 1,
        minWidth: 0,
    },
    productName: {
        fontWeight: 600,
        fontSize: '0.935rem',
        color: '#1a1a1a',
        marginBottom: '0.25rem',
    },
    productSku: {
        fontSize: '0.78rem',
        color: '#9ca3af',
    },
    productAttrs: {
        display: 'flex',
        gap: '0.375rem',
        flexWrap: 'wrap',
        marginTop: '0.4rem',
    },
    attrTag: {
        fontSize: '0.75rem',
        background: '#e5e7eb',
        borderRadius: '4px',
        padding: '0.15rem 0.5rem',
        color: '#374151',
    },
    productQty: {
        color: '#6b7280',
        fontSize: '0.9rem',
        fontWeight: 500,
        whiteSpace: 'nowrap',
    },
    productTotal: {
        textAlign: 'right',
        whiteSpace: 'nowrap',
    },
    unitPrice: {
        fontSize: '0.78rem',
        color: '#9ca3af',
    },
    lineTotal: {
        fontWeight: 700,
        color: '#1a1a1a',
        fontSize: '0.95rem',
    },

    // Price summary
    priceSummary: {
        marginTop: '1.25rem',
        paddingTop: '1rem',
        borderTop: '2px solid #f3f4f6',
        maxWidth: '320px',
        marginLeft: 'auto',
    },
    priceRow: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.9rem',
        color: '#374151',
        marginBottom: '0.5rem',
    },
    priceDivider: {
        borderTop: '1px solid #e5e7eb',
        margin: '0.75rem 0',
    },
    totalRow: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '1.05rem',
        fontWeight: 700,
        color: '#1a1a1a',
    },

    // Info grid
    infoGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1.25rem',
        marginBottom: '1.25rem',
    },
    infoCard: {
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '1.5rem',
    },
    infoRows: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
    },
    infoRow: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '1rem',
        fontSize: '0.9rem',
    },
    infoLabel: {
        color: '#9ca3af',
        flexShrink: 0,
    },
    infoValue: {
        color: '#1a1a1a',
        fontWeight: 500,
        textAlign: 'right',
    },

    // Notes
    notesBox: {
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '1rem 1.25rem',
        fontSize: '0.9rem',
        color: '#374151',
        lineHeight: 1.6,
        fontStyle: 'italic',
    },

    // History
    historyList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem',
    },
    historyItem: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.875rem',
    },
    historyDot: {
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        flexShrink: 0,
        marginTop: '0.3rem',
    },
    historyContent: {
        fontSize: '0.9rem',
        color: '#374151',
        lineHeight: 1.5,
    },
    historyNote: {
        color: '#6b7280',
    },
    historyDate: {
        fontSize: '0.78rem',
        color: '#9ca3af',
        marginTop: '0.15rem',
    },
};
