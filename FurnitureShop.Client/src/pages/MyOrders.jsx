// src/pages/MyOrders.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/navbar';
import Footer from '../components/Footer';
import orderService from '../services/orderService';
import { toast } from 'react-hot-toast';

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
    1: { label: 'Chờ xác nhận', class: 'pending', color: '#B27B13', bg: '#FDF4E3' },
    2: { label: 'Đang xử lý', class: 'processing', color: '#1D63B8', bg: '#EBF3FC' },
    3: { label: 'Đang giao hàng', class: 'shipped', color: '#2E7D32', bg: '#E8F5E9' },
    4: { label: 'Hoàn thành', class: 'completed', color: '#00796B', bg: '#E0F2F1' },
    5: { label: 'Đã hủy', class: 'cancelled', color: '#C62828', bg: '#FFEBEE' },
    6: { label: 'Đã hoàn tiền', class: 'refunded', color: '#4B5563', bg: '#F3F4F6' },
    7: { label: 'Đã trả hàng', class: 'returned', color: '#4B5563', bg: '#F3F4F6' },
    8: { label: 'Yêu cầu trả hàng', class: 'return-req', color: '#B27B13', bg: '#FDF4E3' },
};

const PAYMENT_LABELS = {
    'COD': 'Thanh toán khi nhận hàng (COD)',
    'BankTransfer': 'Chuyển khoản ngân hàng',
    'CreditCard': 'Thẻ tín dụng Quốc tế',
    'MoMo': 'Ví điện tử MoMo',
    'VNPay': 'Cổng thanh toán VNPay',
};

const STEPS = [
    { status: 1, label: 'Chờ xác nhận' },
    { status: 2, label: 'Đang xử lý' },
    { status: 3, label: 'Đang giao' },
    { status: 4, label: 'Hoàn thành' },
];

function OrderProgress({ status }) {
    if (status === 5) {
        return (
            <div className="flex items-center gap-3 p-5 rounded-2xl bg-[#FFEBEE] text-[#C62828] border border-[#FFCDD2] text-xs font-semibold animate-shake">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span className="uppercase tracking-widest text-[11px]">Đơn hàng này đã được hủy theo yêu cầu</span>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between py-6 max-w-2xl mx-auto overflow-x-auto px-4">
            {STEPS.map((step, i) => {
                const isDone = status > step.status;
                const isActive = status === step.status;
                return (
                    <React.Fragment key={step.status}>
                        <div className="flex flex-col items-center gap-2.5 z-10 min-w-[90px]">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 flex-shrink-0 ${
                                isDone
                                    ? 'bg-[#0D0D0D] text-[#FDFBF7] shadow-md'
                                    : isActive
                                        ? 'bg-[#0D0D0D] text-[#FDFBF7] ring-4 ring-[#C9A87C]/40 scale-110 font-extrabold shadow-lg'
                                        : 'bg-[#F5F2EC] text-[#8A8278] border border-[#E8E4DC]'
                            }`}>
                                {isDone ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                ) : (
                                    step.status
                                )}
                            </div>
                            <span className={`text-[11px] uppercase tracking-wider font-semibold transition-colors ${
                                isDone || isActive ? 'text-[#0D0D0D] font-bold' : 'text-[#8A8278]'
                            }`}>
                                {step.label}
                            </span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className={`flex-1 min-w-8 h-0.5 -mt-6 transition-colors duration-500 mx-2 ${
                                status > step.status ? 'bg-[#0D0D0D]' : 'bg-[#E8E4DC]'
                            }`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

function OrderList({ orders, onSelect }) {
    const [filterStatus, setFilterStatus] = useState('');
    const filtered = filterStatus
        ? orders.filter(o => o.status === parseInt(filterStatus))
        : orders;

    const getStatusCount = (statusVal) => {
        if (!statusVal) return orders.length;
        return orders.filter(o => o.status === parseInt(statusVal)).length;
    };

    return (
        <div className="space-y-8">
            {/* Pill-Style Status Filter Bar Architecture */}
            <div className="bg-[#F5F2EC] p-2 rounded-full inline-flex border border-[#E8E4DC] gap-1 overflow-x-auto max-w-full no-scrollbar w-full sm:w-auto">
                {[
                    { value: '', label: 'Tất cả' },
                    { value: '1', label: 'Chờ xác nhận' },
                    { value: '2', label: 'Đang xử lý' },
                    { value: '3', label: 'Đang giao' },
                    { value: '4', label: 'Hoàn thành' },
                    { value: '5', label: 'Đã hủy' },
                ].map(tab => {
                    const isActive = filterStatus === tab.value;
                    const count = getStatusCount(tab.value);
                    return (
                        <button
                            key={tab.value}
                            onClick={() => setFilterStatus(tab.value)}
                            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-full transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                                isActive
                                    ? 'bg-[#0D0D0D] text-[#FDFBF7] shadow-md scale-105'
                                    : 'text-[#8A8278] hover:text-[#0D0D0D] hover:bg-white/60'
                            }`}
                        >
                            <span>{tab.label}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                                isActive ? 'bg-[#C9A87C] text-[#0D0D0D] font-bold' : 'bg-white text-[#8A8278] border border-[#E8E4DC]'
                            }`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {filtered.length === 0 ? (
                <div className="text-center py-24 bg-white border border-[#E8E4DC] rounded-3xl flex flex-col items-center justify-center px-6 shadow-xs">
                    <div className="w-16 h-16 bg-[#F5F2EC] flex items-center justify-center rounded-full mb-4 text-[#8A8278] text-2xl">
                        📦
                    </div>
                    <h3 className="text-lg font-light uppercase tracking-tight text-[#0D0D0D] mb-1">Danh sách trống</h3>
                    <p className="text-xs text-[#8A8278] mb-8 max-w-xs">
                        {filterStatus ? 'Hiện không có tác phẩm nào ở trạng thái tìm kiếm này.' : 'Bạn chưa thực hiện giao dịch nào tại hệ thống.'}
                    </p>
                    <Link to="/products" className="py-4 px-8 rounded-full bg-[#0D0D0D] text-[#FDFBF7] hover:bg-[#C9A87C] hover:text-[#0D0D0D] text-xs font-semibold uppercase tracking-widest transition-all shadow-lg">
                        Khám phá bộ sưu tập ngay
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 animate-fade-up">
                    {filtered.map(order => {
                        const st = ORDER_STATUSES[order.status] || ORDER_STATUSES[1];
                        return (
                            <div
                                key={order.orderId}
                                onClick={() => onSelect(order.orderId)}
                                className="p-1.5 rounded-3xl bg-gradient-to-b from-[#E8E4DC] to-[#C9A87C]/30 shadow-xs hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group"
                            >
                                <div className="bg-white rounded-[22px] p-6 sm:p-8 flex flex-col gap-6">
                                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E8E4DC] pb-4">
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-sm tracking-wider uppercase text-[#0D0D0D] font-mono group-hover:text-[#C9A87C] transition-colors">
                                                #{order.orderNumber}
                                            </span>
                                            <span className="text-[11px] text-[#8A8278] font-medium">• {fmtDate(order.createdAt)}</span>
                                        </div>
                                        <span
                                            className="text-[11px] uppercase tracking-wider font-extrabold px-3.5 py-1 rounded-full border shadow-2xs"
                                            style={{ color: st.color, backgroundColor: st.bg, borderColor: `${st.color}30` }}
                                        >
                                            {st.label}
                                        </span>
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-6 text-xs text-[#8A8278]">
                                            <span className="flex items-center gap-2 font-medium text-black">
                                                🛋️ {order.orderDetails?.length ?? 0} hạng mục sản phẩm
                                            </span>
                                            <span>•</span>
                                            <span>
                                                {order.isPaid ? (
                                                    <span className="text-[#2E7D32] font-semibold flex items-center gap-1">✓ Đã thanh toán</span>
                                                ) : (
                                                    <span className="text-[#B27B13] font-semibold flex items-center gap-1">⏳ Chờ thanh toán</span>
                                                )}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[11px] text-[#8A8278] block uppercase">Tổng chi phí</span>
                                            <span className="text-lg font-extrabold text-[#C62828] tabular-nums">
                                                {fmt(order.totalAmount)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="border-t border-[#E8E4DC]/60 pt-3 flex justify-end">
                                        <span className="text-xs uppercase tracking-widest font-bold text-[#0D0D0D] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                                            Chi tiết hồ sơ đơn →
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function OrderDetail({ orderId, onBack, onRequestReturn }) {
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
                setError('Không thể tải chi tiết đơn hàng.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [orderId]);

    if (loading) {
        return (
            <div className="text-center py-28 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 rounded-full border-2 border-[#C9A87C] border-t-transparent animate-spin" />
                <p className="text-xs uppercase tracking-widest font-bold text-[#8A8278]">Đang khôi phục hồ sơ đơn hàng...</p>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="text-center py-20 bg-white border border-[#E8E4DC] rounded-3xl p-8 max-w-md mx-auto space-y-4">
                <p className="text-[#C62828] font-semibold text-xs">⚠️ {error || 'Không tìm thấy đơn hàng'}</p>
                <button onClick={onBack} className="py-3 px-6 rounded-full bg-[#0D0D0D] text-white text-xs font-semibold uppercase tracking-widest cursor-pointer">
                    ← Quay lại danh sách
                </button>
            </div>
        );
    }

    const st = ORDER_STATUSES[order.status] || ORDER_STATUSES[1];
    const subTotal = order.subTotal ?? 0;
    const shippingFee = order.shippingFee ?? 0;
    const totalAmount = order.totalAmount ?? 0;
    const details = order.orderDetails ?? [];

    return (
        <div className="space-y-8 animate-fade-up">
            {/* Doppelrand Header Bar */}
            <div className="p-1.5 rounded-3xl bg-gradient-to-b from-[#E8E4DC] to-[#C9A87C]/30 shadow-sm">
                <div className="bg-white rounded-[22px] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <button onClick={onBack} className="text-xs font-bold uppercase tracking-widest text-[#8A8278] hover:text-[#0D0D0D] transition-colors flex items-center gap-2 cursor-pointer">
                            ← Trở về danh sách
                        </button>
                        <div className="flex flex-wrap items-baseline gap-3 pt-1">
                            <h2 className="text-xl sm:text-2xl font-light text-[#0D0D0D] uppercase tracking-tight">Hồ Sơ Đơn #{order.orderNumber}</h2>
                            <span className="text-xs text-[#8A8278] font-mono">• {fmtDate(order.createdAt)}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {order.status === 4 && (
                            <button
                                onClick={() => onRequestReturn(order)}
                                className="py-2.5 px-5 rounded-full text-xs font-bold uppercase tracking-wider border border-[#C62828] text-[#C62828] hover:bg-[#FFEBEE] transition-all cursor-pointer shadow-2xs"
                            >
                                🔄 Yêu cầu hoàn trả
                            </button>
                        )}
                        <span
                            className="text-xs uppercase tracking-wider font-extrabold px-4 py-2 rounded-full border shadow-2xs"
                            style={{ color: st.color, backgroundColor: st.bg, borderColor: `${st.color}30` }}
                        >
                            {st.label}
                        </span>
                    </div>
                </div>
            </div>

            {/* Progress Tracker Box */}
            <div className="bg-white border border-[#E8E4DC] rounded-3xl p-8 shadow-2xs">
                <h3 className="text-xs uppercase tracking-widest font-bold text-[#8A8278] pb-4 border-b border-[#E8E4DC] mb-4">📍 Tiến Trình Vận Chuyển</h3>
                <OrderProgress status={order.status} />
            </div>

            {/* Products List Doppelrand */}
            <div className="bg-white border border-[#E8E4DC] rounded-3xl p-8 shadow-2xs space-y-6">
                <h3 className="text-xs uppercase tracking-widest font-bold text-[#8A8278] pb-4 border-b border-[#E8E4DC]">🛋️ Chi Tiết Tác Phẩm ({details.length})</h3>
                <div className="divide-y divide-[#E8E4DC]/60">
                    {details.map((item) => {
                        const attrs = (() => {
                            try {
                                return item.selectedAttributes
                                    ? JSON.parse(item.selectedAttributes)
                                    : null;
                            } catch { return null; }
                        })();
                        return (
                            <div key={item.orderDetailId} className="py-5 flex items-center justify-between gap-6 first:pt-0 last:pb-0">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <img
                                        src={item.product?.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=200&q=80'}
                                        alt={item.productName}
                                        className="w-16 h-16 rounded-xl object-cover border border-[#E8E4DC] bg-[#F5F2EC] flex-shrink-0"
                                    />
                                    <div className="space-y-1 min-w-0 flex-1">
                                        <h4 className="text-xs font-bold uppercase tracking-tight text-[#0D0D0D] truncate">{item.productName}</h4>
                                        {item.productSKU && <p className="text-[10px] font-mono text-[#8A8278]">SKU: {item.productSKU}</p>}
                                        {attrs && (
                                            <div className="flex flex-wrap gap-1 pt-1">
                                                {Object.entries(attrs).map(([k, v]) => (
                                                    <span key={k} className="px-2 py-0.5 text-[9px] uppercase tracking-wider font-semibold bg-[#F5F2EC] text-[#8A8278] rounded">
                                                        {k}: {v}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right tabular-nums">
                                    <div className="text-xs text-[#8A8278]">SL: x{item.quantity}</div>
                                    <div className="text-xs font-bold text-[#0D0D0D] mt-1">{fmt(item.unitPrice * item.quantity)}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Price Summary Calculation */}
                <div className="border-t border-[#E8E4DC] pt-6 max-w-sm ml-auto space-y-3 text-xs tabular-nums">
                    <div className="flex justify-between text-[#8A8278]"><span>Tạm tính tác phẩm</span><span className="font-medium text-[#0D0D0D]">{fmt(subTotal)}</span></div>
                    <div className="flex justify-between text-[#8A8278]"><span>Phí vận chuyển</span><span className="font-medium text-[#0D0D0D]">{shippingFee === 0 ? 'Miễn phí' : fmt(shippingFee)}</span></div>
                    {order.discountAmount > 0 && <div className="flex justify-between text-[#2E7D32] font-semibold"><span>Ưu đãi giảm giá</span><span>− {fmt(order.discountAmount)}</span></div>}
                    <div className="border-t border-[#E8E4DC] pt-4 flex justify-between items-baseline text-base font-bold text-[#0D0D0D]">
                        <span className="uppercase tracking-tight">Tổng chuẩn chi</span>
                        <span className="text-xl font-extrabold text-[#C62828]">{fmt(totalAmount)}</span>
                    </div>
                </div>
            </div>

            {/* 2-Column Info Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-[#FDFBF7] border border-[#E8E4DC] rounded-3xl p-8 space-y-4 text-xs">
                    <h3 className="text-xs uppercase tracking-widest font-bold text-[#8A8278] pb-3 border-b border-[#E8E4DC]">📍 Địa Chỉ Bàn Giao</h3>
                    <div className="space-y-2 leading-relaxed">
                        <p className="font-bold text-black text-sm">{order.shippingFullName} • <span className="font-normal tabular-nums">{order.shippingPhone}</span></p>
                        <p className="text-[#4A4A4A]">{order.shippingAddress}</p>
                        <p className="text-[#8A8278]">{[order.shippingWard, order.shippingDistrict, order.shippingCity].filter(Boolean).join(', ')}</p>
                        {order.shippingMethod && <p className="text-[#C9A87C] font-semibold pt-2">🚚 {order.shippingMethod.name}</p>}
                    </div>
                </div>

                <div className="bg-[#F5F2EC] border border-[#E8E4DC] rounded-3xl p-8 space-y-4 text-xs">
                    <h3 className="text-xs uppercase tracking-widest font-bold text-[#8A8278] pb-3 border-b border-[#E8E4DC]">💳 Trạng Thái Thanh Toán</h3>
                    <div className="space-y-2.5">
                        <div className="flex justify-between text-[#4A4A4A]"><span>Phương thức</span><span className="font-semibold text-black">{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod || '—'}</span></div>
                        <div className="flex justify-between items-center">
                            <span className="text-[#4A4A4A]">Xác nhận tiền</span>
                            <span className={`font-bold px-3 py-1 rounded-full text-[11px] ${order.isPaid ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#FFF3E0] text-[#E65100]'}`}>
                                {order.isPaid ? '✓ Đã hoàn tất' : '⏳ Chưa thanh toán'}
                            </span>
                        </div>
                        {order.isPaid && order.paidAt && <div className="flex justify-between text-[#8A8278] text-[11px]"><span>Thời gian ghi nhận</span><span>{fmtDate(order.paidAt)}</span></div>}
                    </div>
                </div>
            </div>

            {order.notes && (
                <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-3xl p-6 text-xs text-[#5D4037]">
                    <span className="font-bold uppercase tracking-widest block mb-1">📝 Ghi chú từ người đặt:</span>
                    <p className="italic">"{order.notes}"</p>
                </div>
            )}

            {/* Status History Timeline */}
            {order.statusHistories?.length > 0 && (
                <div className="bg-white border border-[#E8E4DC] rounded-3xl p-8 shadow-2xs space-y-6">
                    <h3 className="text-xs uppercase tracking-widest font-bold text-[#8A8278] pb-4 border-b border-[#E8E4DC]">🕒 Nhật Ký Trạng Thái</h3>
                    <div className="space-y-6 relative pl-6 before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E8E4DC]">
                        {order.statusHistories
                            .slice()
                            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                            .map((h, i) => {
                                const hSt = ORDER_STATUSES[h.toStatus] || { label: 'Cập nhật', color: '#8A8278' };
                                return (
                                    <div key={i} className="relative flex gap-4 items-start">
                                        <div
                                            className="w-3.5 h-3.5 rounded-full absolute left-[-22px] top-1 border-2 border-white ring-2 ring-gray-200 shadow-2xs"
                                            style={{ backgroundColor: hSt.color }}
                                        />
                                        <div className="space-y-1">
                                            <div className="text-xs font-bold text-[#0D0D0D] flex items-center gap-2">
                                                <span style={{ color: hSt.color }}>{hSt.label}</span>
                                                {h.notes && <span className="text-[#8A8278] font-normal">• {h.notes}</span>}
                                            </div>
                                            <div className="text-[10px] text-[#8A8278] font-mono">{fmtDate(h.createdAt)}</div>
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

export default function MyOrders() {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOrderId, setSelectedOrderId] = useState(null);

    const [returnOrder, setReturnOrder] = useState(null);
    const [returnReason, setReturnReason] = useState('');
    const [submittingReturn, setSubmittingReturn] = useState(false);

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
    }, [user, navigate, isAuthenticated]);

    const handleReturnSubmit = async (e) => {
        e.preventDefault();
        if (!returnReason.trim()) {
            toast.error('Vui lòng nhập lý do trả hàng');
            return;
        }

        try {
            setSubmittingReturn(true);
            const res = await fetch(`/api/orders/${returnOrder.orderId}/request-return`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ notes: returnReason, changedBy: user.fullName || 'User' })
            });

            if (res.ok) {
                toast.success('Đã gửi yêu cầu trả hàng thành công');
                setReturnOrder(null);
                setReturnReason('');
                window.location.reload();
            } else {
                const data = await res.json();
                toast.error(data.message || 'Lỗi gửi yêu cầu trả hàng');
            }
        } catch (err) {
            toast.error('Lỗi kết nối máy chủ');
        } finally {
            setSubmittingReturn(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-[#0D0D0D] font-['Outfit'] flex flex-col selection:bg-[#C9A87C] selection:text-white">
            <Navbar />

            {/* Title Hero Header */}
            <div className="bg-[#0D0D0D] text-[#FDFBF7] py-16 px-6 sm:px-12 text-center relative overflow-hidden">
                <div className="relative z-10 max-w-3xl mx-auto space-y-3">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-[#C9A87C] block">Kho lưu trữ giao dịch</span>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-light uppercase tracking-tight">
                        {selectedOrderId ? 'Hồ Sơ Chi Tiết Đơn' : 'Đơn Hàng Của Tôi'}
                    </h1>
                </div>
            </div>

            <main className="flex-1 py-12 px-6 sm:px-12">
                <div className="max-w-4xl mx-auto w-full">
                    {loading ? (
                        <div className="text-center py-28 flex flex-col items-center justify-center space-y-4">
                            <div className="w-12 h-12 rounded-full border-2 border-[#C9A87C] border-t-transparent animate-spin" />
                            <p className="text-xs uppercase tracking-widest font-bold text-[#8A8278]">Đang đồng bộ danh sách đơn hàng...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-16 bg-white border border-[#E8E4DC] rounded-3xl p-8 max-w-md mx-auto space-y-4">
                            <p className="text-[#C62828] font-semibold text-xs">⚠️ {error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="py-3 px-8 rounded-full bg-[#0D0D0D] text-white text-xs font-semibold uppercase tracking-widest cursor-pointer"
                            >
                                Thử lại
                            </button>
                        </div>
                    ) : selectedOrderId ? (
                        <OrderDetail
                            orderId={selectedOrderId}
                            onBack={() => setSelectedOrderId(null)}
                            onRequestReturn={(order) => setReturnOrder(order)}
                        />
                    ) : (
                        <OrderList
                            orders={orders}
                            onSelect={(id) => setSelectedOrderId(id)}
                        />
                    )}
                </div>
            </main>

            {/* Return Request Modal */}
            {returnOrder && (
                <div className="fixed inset-0 z-50 bg-[#0D0D0D]/70 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-up">
                    <div className="bg-white rounded-3xl border border-[#E8E4DC] max-w-md w-full p-8 shadow-2xl space-y-6">
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-widest text-[#C62828] block mb-1">Hỗ trợ hậu mãi</span>
                            <h3 className="text-xl font-light uppercase tracking-tight text-[#0D0D0D]">Yêu Cầu Hoàn Trả Tác Phẩm</h3>
                            <p className="text-xs text-[#8A8278] font-mono mt-1">Đơn hàng #{returnOrder.orderNumber}</p>
                        </div>

                        <form onSubmit={handleReturnSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[11px] uppercase font-bold tracking-widest text-[#8A8278] block">Lý do hoàn trả</label>
                                <textarea
                                    value={returnReason}
                                    onChange={(e) => setReturnReason(e.target.value)}
                                    placeholder="Vui lòng cung cấp lý do chi tiết (VD: Hàng trầy xước trong quá trình vận chuyển...)"
                                    className="w-full h-32 px-4 py-3 text-xs bg-[#FDFBF7] border border-[#E8E4DC] rounded-xl focus:outline-none focus:border-[#0D0D0D] transition-all resize-none placeholder:text-[#B0A89E]"
                                    required
                                />
                            </div>

                            <div className="flex gap-4 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setReturnOrder(null); setReturnReason(''); }}
                                    className="w-1/2 py-3.5 rounded-full border border-[#E8E4DC] text-[#0D0D0D] hover:border-black text-xs font-semibold uppercase tracking-widest cursor-pointer text-center transition-all"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingReturn}
                                    className="w-1/2 py-3.5 rounded-full bg-[#C62828] text-white hover:bg-[#B71C1C] text-xs font-bold uppercase tracking-widest cursor-pointer text-center transition-all disabled:opacity-50 shadow-lg"
                                >
                                    {submittingReturn ? '⏳ Đang gửi...' : 'Gửi Yêu Cầu'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
