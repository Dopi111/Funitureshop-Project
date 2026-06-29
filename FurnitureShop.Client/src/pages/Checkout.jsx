// src/pages/Checkout.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/navbar';
import Footer from '../components/Footer';
import apiService from '../services/apiService';
import orderService from '../services/orderService';

const fmt = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n ?? 0);

const STEPS = ['Tóm tắt giỏ hàng', 'Địa chỉ giao hàng', 'Thanh toán & Đặt mua'];

function StepIndicator({ current }) {
    return (
        <div className="flex items-center justify-center max-w-2xl mx-auto mb-12 w-full px-4">
            {STEPS.map((label, i) => (
                <React.Fragment key={i}>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all flex-shrink-0 ${
                            i < current ? 'bg-[#2E7D32] text-white shadow-md' :
                            i === current ? 'bg-[#0D0D0D] text-[#FDFBF7] ring-4 ring-[#C9A87C]/30 scale-105 font-extrabold' :
                            'bg-[#F5F2EC] text-[#8A8278] border border-[#E8E4DC]'
                        }`}>
                            {i < current ? '✓' : i + 1}
                        </div>
                        <span className={`text-[11px] sm:text-xs font-semibold uppercase tracking-wider hidden md:inline ${
                            i === current ? 'text-[#0D0D0D]' : i < current ? 'text-[#2E7D32]' : 'text-[#8A8278]'
                        }`}>
                            {label}
                        </span>
                    </div>
                    {i < STEPS.length - 1 && (
                        <div className={`flex-1 min-w-6 h-0.5 mx-2 sm:mx-4 transition-colors ${
                            i < current ? 'bg-[#2E7D32]' : 'bg-[#E8E4DC]'
                        }`} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}

function ShippingField({ id, label, required, placeholder, value, onChange, error }) {
    return (
        <div className="space-y-1.5 flex-1 w-full">
            <label htmlFor={id} className="text-[11px] font-bold uppercase tracking-widest text-[#8A8278] block">
                {label}{required && <span className="text-[#C62828]"> *</span>}
            </label>
            <input
                id={id}
                className={`w-full py-3.5 px-4 bg-[#FDFBF7] border rounded-xl text-xs text-[#0D0D0D] placeholder:text-[#B0A89E] focus:outline-none focus:bg-white transition-all tabular-nums ${
                    error ? 'border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 bg-[#FFEBEE]/30' : 'border-[#E8E4DC] focus:border-[#0D0D0D]'
                }`}
                placeholder={placeholder}
                value={value || ''}
                onChange={onChange}
            />
            {error && <span className="text-[11px] font-medium text-[#C62828] block">{error}</span>}
        </div>
    );
}

function getPaymentIcon(code) {
    switch (code) {
        case 'CASH': return '💵';
        case 'PAYPAL': return '🅿️';
        case 'VNPAY': return '🏦';
        case 'MOMO': return '📱';
        default: return '💳';
    }
}

function StepSummary({ cart, coupon, setCoupon, couponInput, setCouponInput, couponLoading, couponError, onApplyCoupon, onNext, onBack }) {
    const items = cart?.items ?? [];
    const subTotal = cart?.totalAmount ?? 0;
    const discount = coupon ? Math.round(subTotal * (coupon.discountPercent / 100)) : 0;
    const total = subTotal - discount;

    return (
        <div className="p-1.5 rounded-[28px] bg-gradient-to-b from-[#E8E4DC] to-[#C9A87C]/30 shadow-xl">
            <div className="bg-white rounded-[24px] p-6 sm:p-10 space-y-8">
                <div className="flex items-center justify-between border-b border-[#E8E4DC] pb-6">
                    <div>
                        <span className="text-[11px] font-bold uppercase tracking-widest text-[#C9A87C]">Bước 1/3</span>
                        <h2 className="text-2xl sm:text-3xl font-light uppercase tracking-tight text-[#0D0D0D]">Tóm Tắt Đơn Hàng</h2>
                    </div>
                    <span className="text-xs font-semibold text-[#8A8278]">{items.length} sản phẩm</span>
                </div>

                <div className="divide-y divide-[#E8E4DC]/60 max-h-96 overflow-y-auto pr-2 no-scrollbar">
                    {items.map((item) => (
                        <div key={item.cartItemId} className="py-4 flex items-center gap-4">
                            <img
                                src={item.productImage || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=200&q=80'}
                                alt={item.productName}
                                className="w-16 h-16 rounded-xl object-cover border border-[#E8E4DC] flex-shrink-0 bg-[#F5F2EC]"
                            />
                            <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-semibold uppercase tracking-tight text-[#0D0D0D] truncate">{item.productName}</h4>
                                <p className="text-[11px] text-[#8A8278] mt-0.5">{item.categoryName || 'Nội thất'}</p>
                                <span className="inline-block mt-1 text-[11px] font-bold text-[#C9A87C]">SL: x{item.quantity}</span>
                            </div>
                            <div className="text-right tabular-nums">
                                {item.originalPrice && item.originalPrice > item.unitPrice ? (
                                    <>
                                        <div className="text-[11px] text-[#8A8278] line-through">{fmt(item.originalPrice * item.quantity)}</div>
                                        <div className="text-xs font-bold text-[#C62828]">{fmt(item.unitPrice * item.quantity)}</div>
                                    </>
                                ) : (
                                    <div className="text-xs font-bold text-[#0D0D0D]">{fmt(item.unitPrice * item.quantity)}</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Coupon Box */}
                <div className="p-5 rounded-2xl bg-[#F5F2EC] border border-[#E8E4DC] space-y-3">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-[#8A8278] block">Mã ưu đãi / Coupon</span>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Nhập mã (VD: SALE10)..."
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value)}
                            className="flex-1 py-2.5 px-4 bg-white border border-[#E8E4DC] rounded-xl text-xs uppercase font-semibold focus:outline-none focus:border-[#0D0D0D]"
                        />
                        <button
                            onClick={onApplyCoupon}
                            disabled={couponLoading}
                            className="py-2.5 px-6 rounded-xl bg-[#0D0D0D] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#C9A87C] hover:text-[#0D0D0D] transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap"
                        >
                            {couponLoading ? '⏳' : 'Áp dụng'}
                        </button>
                    </div>
                    {couponError && <p className="text-[11px] text-[#C62828] font-medium">{couponError}</p>}
                    {coupon && <p className="text-[11px] text-[#2E7D32] font-semibold">✓ Đã áp dụng mã {coupon.code} (Giảm {coupon.discountPercent}%)</p>}
                </div>

                {/* Price Summary Calculation */}
                <div className="space-y-3 pt-2 text-xs tabular-nums">
                    <div className="flex justify-between text-[#8A8278]">
                        <span>Tạm tính giỏ hàng</span>
                        <span className="font-medium text-[#0D0D0D]">{fmt(subTotal)}</span>
                    </div>
                    {discount > 0 && (
                        <div className="flex justify-between text-[#2E7D32] font-semibold">
                            <span>Ưu đãi coupon ({coupon.code})</span>
                            <span>− {fmt(discount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-[#8A8278]">
                        <span>Phí vận chuyển & VAT</span>
                        <span className="italic">Tính ở bước tiếp theo</span>
                    </div>
                    <div className="flex justify-between text-base sm:text-lg font-bold text-[#0D0D0D] pt-4 border-t border-[#E8E4DC]">
                        <span className="uppercase tracking-tight">Tổng tạm tính</span>
                        <span className="text-[#C62828]">{fmt(total)}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-[#E8E4DC] gap-4">
                    <button onClick={onBack} className="py-4 px-6 rounded-full border border-[#E8E4DC] text-xs font-semibold uppercase tracking-widest hover:border-[#0D0D0D] transition-colors cursor-pointer">
                        ← Quay lại giỏ hàng
                    </button>
                    <button onClick={onNext} className="py-4 px-8 rounded-full bg-[#0D0D0D] text-[#FDFBF7] text-xs font-semibold uppercase tracking-widest hover:bg-[#C9A87C] hover:text-[#0D0D0D] active:scale-[0.98] transition-all cursor-pointer shadow-lg">
                        Tiến hành giao hàng →
                    </button>
                </div>
            </div>
        </div>
    );
}

function StepShipping({ shippingInfo, setShippingInfo, onNext, onBack }) {
    const [errors, setErrors] = useState({});

    const handle = (field) => (e) =>
        setShippingInfo((prev) => ({ ...prev, [field]: e.target.value }));

    const validate = () => {
        const e = {};
        if (!shippingInfo.fullName?.trim()) e.fullName = 'Vui lòng nhập họ tên';
        if (!shippingInfo.phone?.trim()) e.phone = 'Vui lòng nhập số điện thoại';
        else if (!/^(0|\+84)[0-9]{8,10}$/.test(shippingInfo.phone.trim())) e.phone = 'Số điện thoại không hợp lệ';
        if (!shippingInfo.address?.trim()) e.address = 'Vui lòng nhập địa chỉ';
        if (!shippingInfo.city?.trim()) e.city = 'Vui lòng nhập thành phố';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const submit = () => {
        if (validate()) onNext();
    };

    return (
        <div className="p-1.5 rounded-[28px] bg-gradient-to-b from-[#E8E4DC] to-[#C9A87C]/30 shadow-xl">
            <div className="bg-white rounded-[24px] p-6 sm:p-10 space-y-8">
                <div className="border-b border-[#E8E4DC] pb-6">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-[#C9A87C]">Bước 2/3</span>
                    <h2 className="text-2xl sm:text-3xl font-light uppercase tracking-tight text-[#0D0D0D]">Địa Chỉ Nhận Hàng</h2>
                </div>

                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-6">
                        <ShippingField id="fullName" label="Họ và tên người nhận" required placeholder="Nguyễn Văn A" value={shippingInfo.fullName} onChange={handle('fullName')} error={errors.fullName} />
                        <ShippingField id="phone" label="Số điện thoại liên hệ" required placeholder="0901234567" value={shippingInfo.phone} onChange={handle('phone')} error={errors.phone} />
                    </div>

                    <ShippingField id="address" label="Địa chỉ chi tiết (Số nhà, tên đường)" required placeholder="123 Đường Lê Lợi..." value={shippingInfo.address} onChange={handle('address')} error={errors.address} />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <ShippingField id="city" label="Tỉnh / Thành phố" required placeholder="TP. Hồ Chí Minh" value={shippingInfo.city} onChange={handle('city')} error={errors.city} />
                        <ShippingField id="district" label="Quận / Huyện" placeholder="Quận 1" value={shippingInfo.district} onChange={handle('district')} />
                        <ShippingField id="ward" label="Phường / Xã" placeholder="Phường Bến Nghé" value={shippingInfo.ward} onChange={handle('ward')} />
                    </div>

                    <div className="p-5 rounded-2xl bg-[#F5F2EC] border border-[#E8E4DC] flex items-start gap-3">
                        <input
                            type="checkbox"
                            id="requireInstallation"
                            checked={shippingInfo.requireInstallation || false}
                            onChange={(e) => setShippingInfo(prev => ({ ...prev, requireInstallation: e.target.checked }))}
                            className="mt-1 w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                        />
                        <label htmlFor="requireInstallation" className="text-xs text-[#0D0D0D] cursor-pointer leading-relaxed select-none">
                            <strong className="font-bold uppercase tracking-wider block text-black">🛠️ Yêu cầu chuyên viên lắp đặt tận nhà (+500,000đ)</strong>
                            Dịch vụ lắp ráp hoàn thiện, đồng bộ khớp nối và vệ sinh khu vực bàn giao sản phẩm.
                        </label>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-[#8A8278] block">Ghi chú bàn giao (Tùy chọn)</label>
                        <textarea
                            className="w-full py-3 px-4 bg-[#FDFBF7] border border-[#E8E4DC] rounded-xl text-xs focus:outline-none focus:border-[#0D0D0D] transition-all placeholder:text-[#B0A89E]"
                            placeholder="Ghi chú thêm về giờ nhận hàng, thang máy máy chung cư..."
                            value={shippingInfo.notes || ''}
                            onChange={handle('notes')}
                            rows={3}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-[#E8E4DC] gap-4">
                    <button onClick={onBack} className="py-4 px-6 rounded-full border border-[#E8E4DC] text-xs font-semibold uppercase tracking-widest hover:border-[#0D0D0D] transition-colors cursor-pointer">
                        ← Quay lại đơn hàng
                    </button>
                    <button onClick={submit} className="py-4 px-8 rounded-full bg-[#0D0D0D] text-[#FDFBF7] text-xs font-semibold uppercase tracking-widest hover:bg-[#C9A87C] hover:text-[#0D0D0D] active:scale-[0.98] transition-all cursor-pointer shadow-lg">
                        Tiếp tục thanh toán →
                    </button>
                </div>
            </div>
        </div>
    );
}

function StepConfirm({ cart, shippingInfo, coupon, paymentMethod, setPaymentMethod,
    paymentMethods, shippingFee, bestShippingOption,
    shippingOptionsLoading, submitting, submitError, onSubmit, onBack, priceBreakdown }) {

    const items = cart?.items ?? [];
    const subTotal = cart?.totalAmount ?? 0;
    const discount = coupon ? Math.round(subTotal * (coupon.discountPercent / 100)) : 0;
    const taxAmount = priceBreakdown?.totalTax ?? Math.round((subTotal - discount) * 0.1);
    const installationFee = shippingInfo.requireInstallation ? 500000 : 0;
    const total = subTotal - discount + taxAmount + (shippingFee ?? 0) + installationFee;

    return (
        <div className="p-1.5 rounded-[28px] bg-gradient-to-b from-[#E8E4DC] to-[#C9A87C]/30 shadow-xl">
            <div className="bg-white rounded-[24px] p-6 sm:p-10 space-y-10">
                <div className="border-b border-[#E8E4DC] pb-6">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-[#C9A87C]">Bước 3/3</span>
                    <h2 className="text-2xl sm:text-3xl font-light uppercase tracking-tight text-[#0D0D0D]">Xác Nhận & Thanh Toán</h2>
                </div>

                {/* 2 Column Bento Check inside Step 3 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {/* Left Info */}
                    <div className="space-y-6 bg-[#FDFBF7] p-6 rounded-2xl border border-[#E8E4DC]">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-[#8A8278] border-b border-[#E8E4DC] pb-3">📦 Thông tin bàn giao</h4>
                        
                        <div className="space-y-2 text-xs leading-relaxed">
                            <p className="font-bold text-black text-sm">{shippingInfo.fullName} • <span className="tabular-nums font-normal">{shippingInfo.phone}</span></p>
                            <p className="text-[#4A4A4A]">{shippingInfo.address}</p>
                            <p className="text-[#8A8278]">{[shippingInfo.ward, shippingInfo.district, shippingInfo.city].filter(Boolean).join(', ')}</p>
                            {shippingInfo.notes && <p className="text-[#C9A87C] pt-2 italic">"{shippingInfo.notes}"</p>}
                        </div>

                        <div className="pt-4 border-t border-[#E8E4DC]">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-[#8A8278] block mb-2">🚚 Đơn vị vận chuyển</span>
                            {shippingOptionsLoading ? (
                                <p className="text-xs text-[#8A8278] animate-pulse">Đang tính toán tuyến đường...</p>
                            ) : bestShippingOption ? (
                                <div className="text-xs font-medium text-black flex items-center justify-between">
                                    <span>{bestShippingOption.name} (Dự kiến {bestShippingOption.estimatedDays} ngày)</span>
                                    <span className="font-bold tabular-nums text-[#2E7D32]">{bestShippingOption.fee > 0 ? fmt(bestShippingOption.fee) : 'Miễn phí'}</span>
                                </div>
                            ) : (
                                <p className="text-xs text-[#8A8278]">Giao hàng tiêu chuẩn</p>
                            )}
                        </div>
                    </div>

                    {/* Right Price Calculation Box */}
                    <div className="space-y-4 bg-[#F5F2EC] p-6 rounded-2xl border border-[#E8E4DC] tabular-nums text-xs">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-[#8A8278] border-b border-[#E8E4DC] pb-3">🧾 Chi tiết thanh toán</h4>
                        
                        <div className="space-y-2.5 pt-1">
                            <div className="flex justify-between text-[#4A4A4A]"><span>Thành tiền giỏ hàng</span><span className="font-semibold text-black">{fmt(subTotal)}</span></div>
                            {discount > 0 && <div className="flex justify-between text-[#2E7D32]"><span>Ưu đãi coupon</span><span>− {fmt(discount)}</span></div>}
                            <div className="flex justify-between text-[#4A4A4A]"><span>Thuế VAT (10%)</span><span>+ {fmt(taxAmount)}</span></div>
                            <div className="flex justify-between text-[#4A4A4A]"><span>Phí vận chuyển</span><span>+{fmt(shippingFee || 0)}</span></div>
                            {shippingInfo.requireInstallation && <div className="flex justify-between text-[#C9A87C] font-semibold"><span>Phí lắp đặt tận nhà</span><span>+{fmt(installationFee)}</span></div>}
                        </div>

                        <div className="pt-4 border-t border-[#E8E4DC] flex justify-between items-baseline">
                            <span className="text-sm font-bold uppercase tracking-tight text-black">Tổng thanh toán</span>
                            <span className="text-xl font-extrabold text-[#C62828]">{fmt(total)}</span>
                        </div>
                    </div>
                </div>

                {/* Radio Payment Methods Architecture */}
                <div className="space-y-4 pt-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[#8A8278]">💳 Chọn phương thức thanh toán</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {paymentMethods.map((method) => {
                            const isSelected = paymentMethod === method.code;
                            return (
                                <div
                                    key={method.code}
                                    onClick={() => setPaymentMethod(method.code)}
                                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 select-none ${
                                        isSelected ? 'border-[#0D0D0D] bg-[#FDFBF7] shadow-md scale-[1.01]' : 'border-[#E8E4DC] hover:border-gray-400 bg-white opacity-80 hover:opacity-100'
                                    }`}
                                >
                                    <div className="text-2xl mt-0.5">{getPaymentIcon(method.code)}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold uppercase tracking-tight text-[#0D0D0D]">{method.name}</span>
                                            {isSelected && <span className="w-4 h-4 rounded-full bg-[#0D0D0D] text-white flex items-center justify-center text-[10px]">✓</span>}
                                        </div>
                                        {method.description && <p className="text-[11px] text-[#8A8278] mt-1 line-clamp-2 leading-relaxed">{method.description}</p>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {submitError && (
                    <div className="p-4 rounded-xl bg-[#FFEBEE] text-[#C62828] text-xs font-semibold text-center animate-shake">
                        ⚠️ {submitError}
                    </div>
                )}

                <div className="flex items-center justify-between pt-6 border-t border-[#E8E4DC] gap-4">
                    <button onClick={onBack} disabled={submitting} className="py-4 px-6 rounded-full border border-[#E8E4DC] text-xs font-semibold uppercase tracking-widest hover:border-[#0D0D0D] transition-colors cursor-pointer disabled:opacity-50">
                        ← Chọn lại địa chỉ
                    </button>
                    <button onClick={onSubmit} disabled={submitting || !paymentMethod} className="py-5 px-10 rounded-full bg-[#C62828] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#B71C1C] active:scale-[0.98] transition-all cursor-pointer shadow-xl disabled:opacity-50">
                        {submitting ? '⏳ Đang khởi tạo đơn hàng...' : `Xác Nhận Đặt Mua • ${fmt(total)}`}
                    </button>
                </div>
            </div>
        </div>
    );
}

function OrderSuccess({ orderNumber, onGoHome }) {
    return (
        <div className="p-1.5 rounded-[32px] bg-gradient-to-b from-[#2E7D32] to-[#C9A87C]/50 shadow-2xl max-w-xl mx-auto my-12 animate-fade-up">
            <div className="bg-white rounded-[28px] p-8 sm:p-12 text-center space-y-6">
                <div className="w-20 h-20 bg-[#E8F5E9] text-[#2E7D32] rounded-full flex items-center justify-center text-4xl mx-auto shadow-inner">
                    ✨
                </div>
                
                <h2 className="text-3xl font-light uppercase tracking-tight text-[#0D0D0D]">Đặt Hàng Thành Công!</h2>
                
                <p className="text-xs sm:text-sm text-[#8A8278] leading-relaxed max-w-md mx-auto">
                    Chúc mừng tác phẩm nội thất của bạn đã được ghi nhận vào hệ thống. Mã chuẩn chi đơn hàng của bạn:
                </p>

                <div className="py-4 px-8 bg-[#F5F2EC] rounded-2xl border border-[#E8E4DC] inline-block font-mono text-xl sm:text-2xl font-extrabold text-[#0D0D0D] tracking-widest shadow-xs">
                    #{orderNumber}
                </div>

                <p className="text-[11px] text-[#A0988E] leading-relaxed italic max-w-xs mx-auto">
                    Chuyên viên giám tuyển của chúng tôi sẽ liên hệ qua điện thoại trong vòng 30 phút để xác nhận lịch bàn giao.
                </p>

                <div className="pt-6 border-t border-[#E8E4DC]">
                    <button onClick={onGoHome} className="w-full py-4 rounded-full bg-[#0D0D0D] text-[#FDFBF7] text-xs font-semibold uppercase tracking-widest hover:bg-[#C9A87C] hover:text-[#0D0D0D] transition-all cursor-pointer shadow-lg">
                        Trở Về Trang Chủ
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Checkout() {
    const { cart, loading: cartLoading, clearCart } = useCart();
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState(0);
    const [couponInput, setCouponInput] = useState('');
    const [coupon, setCoupon] = useState(null);
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponError, setCouponError] = useState('');

    const [shippingInfo, setShippingInfo] = useState({
        fullName: user?.fullName ?? '',
        phone: '',
        address: '',
        city: '',
        district: '',
        ward: '',
        notes: '',
        requireInstallation: false,
    });

    useEffect(() => {
        if (user?.userId) {
            apiService.getProfile(user.userId)
                .then(profile => {
                    setShippingInfo(prev => ({
                        ...prev,
                        fullName: profile.fullName || prev.fullName,
                        phone: profile.phoneNumber || prev.phone,
                        address: profile.address || prev.address,
                        city: profile.city || prev.city,
                        district: profile.district || prev.district,
                        ward: profile.ward || prev.ward,
                    }));
                })
                .catch(() => {});
        }
    }, [user?.userId]);

    const [paymentMethods, setPaymentMethods] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [shippingFee, setShippingFee] = useState(0);
    const [bestShippingOption, setBestShippingOption] = useState(null);
    const [shippingOptionsLoading, setShippingOptionsLoading] = useState(false);
    const [priceBreakdown, setPriceBreakdown] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [orderNumber, setOrderNumber] = useState(null);

    useEffect(() => {
        if (step === 2 && paymentMethods.length === 0) {
            apiService.getPaymentMethods()
                .then((res) => {
                    const methods = res?.data ?? [];
                    setPaymentMethods(methods);
                    if (methods.length > 0) setPaymentMethod(methods[0].code);
                })
                .catch(() => {
                    setPaymentMethods([{ code: 'CASH', name: 'Thanh toán khi nhận hàng (COD)', transactionFeePercent: 0 }]);
                    setPaymentMethod('CASH');
                });
        }
    }, [step, paymentMethods.length]);

    useEffect(() => {
        if (step === 2 && cart?.items?.length) {
            setShippingOptionsLoading(true);
            apiService.getShippingOptions(
                { city: shippingInfo.city, district: shippingInfo.district },
                {
                    totalAmount: cart.totalAmount,
                    totalWeight: cart.items.reduce((sum, item) => sum + (item.weight ?? 1) * item.quantity, 0),
                }
            )
            .then(result => {
                const options = result?.data ?? result ?? [];
                const optionsArray = Array.isArray(options) ? options : [];
                if (optionsArray.length > 0) {
                    const sortedOptions = optionsArray.sort((a, b) => (a.fee ?? 0) - (b.fee ?? 0));
                    const bestOption = sortedOptions[0];
                    setBestShippingOption(bestOption);
                    setShippingFee(bestOption.fee ?? 0);
                } else {
                    const fallback = { name: 'Giao hàng tiêu chuẩn', fee: 0, estimatedDays: 3 };
                    setBestShippingOption(fallback);
                    setShippingFee(0);
                }
            })
            .catch(() => {
                const fallback = { name: 'Giao hàng tiêu chuẩn', fee: 0, estimatedDays: 3 };
                setBestShippingOption(fallback);
                setShippingFee(0);
            })
            .finally(() => setShippingOptionsLoading(false));
        }
    }, [step, cart?.items?.length, cart?.totalAmount, shippingInfo.city, shippingInfo.district]);

    useEffect(() => {
        if (step === 2 && cart?.items?.length) {
            apiService.getPriceBreakdown({
                items: cart.items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    selectedAttributeIds: [],
                })),
                discountPercent: coupon?.discountPercent ?? 0,
                discountLabel: coupon?.code ?? null,
                applyTax: true,
                taxPercent: 10,
                shippingInfo: null,
            })
            .then(breakdown => {
                if (breakdown) setPriceBreakdown(breakdown);
            })
            .catch(() => {});
        }
    }, [step, cart?.items, coupon]);

    if (!isAuthenticated()) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] text-[#0D0D0D] font-['Outfit'] flex flex-col">
                <Navbar />
                <div className="max-w-xl mx-auto w-full px-6 py-32 flex-1 flex items-center justify-center">
                    <div className="bg-white border border-[#E8E4DC] p-12 rounded-3xl shadow-sm text-center space-y-6 w-full">
                        <div className="w-16 h-16 bg-[#F5F2EC] rounded-full flex items-center justify-center text-2xl mx-auto">🔒</div>
                        <h2 className="text-2xl font-light uppercase tracking-tight">Vui lòng đăng nhập</h2>
                        <p className="text-xs text-[#8A8278] leading-relaxed">Bạn cần đăng nhập vào tài khoản thành viên để tiến hành xác nhận và thanh toán tác phẩm.</p>
                        <Link to="/login" className="inline-block rounded-full py-4 px-8 bg-[#0D0D0D] text-[#FDFBF7] text-xs font-semibold uppercase tracking-widest hover:bg-[#C9A87C] hover:text-[#0D0D0D] transition-all">
                            Đăng nhập ngay
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (cartLoading) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] text-[#0D0D0D] font-['Outfit'] flex flex-col">
                <Navbar />
                <div className="max-w-7xl mx-auto w-full px-6 py-32 flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 rounded-full border-2 border-[#C9A87C] border-t-transparent animate-spin" />
                        <p className="text-xs font-semibold uppercase tracking-widest text-[#8A8278]">Đang khởi tạo phiên thanh toán...</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (!cart?.items?.length && !orderNumber) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] text-[#0D0D0D] font-['Outfit'] flex flex-col">
                <Navbar />
                <div className="max-w-xl mx-auto w-full px-6 py-32 flex-1 flex items-center justify-center">
                    <div className="bg-white border border-[#E8E4DC] p-12 rounded-3xl shadow-sm text-center space-y-6 w-full">
                        <div className="w-16 h-16 bg-[#F5F2EC] rounded-full flex items-center justify-center text-3xl mx-auto">🛒</div>
                        <h2 className="text-2xl font-light uppercase tracking-tight">Giỏ hàng đang trống</h2>
                        <p className="text-xs text-[#8A8278] leading-relaxed">Bộ sưu tập hiện chưa có sản phẩm nào. Hãy lựa chọn những thiết kế ưng ý trước khi thanh toán.</p>
                        <Link to="/products" className="inline-block rounded-full py-4 px-8 bg-[#0D0D0D] text-[#FDFBF7] text-xs font-semibold uppercase tracking-widest hover:bg-[#C9A87C] hover:text-[#0D0D0D] transition-all">
                            Tiếp tục khám phá
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    const handleApplyCoupon = async () => {
        if (!couponInput.trim()) {
            setCouponError('Vui lòng nhập mã giảm giá');
            return;
        }
        setCouponLoading(true);
        setCouponError('');
        try {
            await new Promise((r) => setTimeout(r, 600));
            const mockCoupons = {
                'SALE10': { code: 'SALE10', discountPercent: 10 },
                'SALE20': { code: 'SALE20', discountPercent: 20 },
                'SALE5': { code: 'SALE5', discountPercent: 5 },
            };
            const found = mockCoupons[couponInput.trim().toUpperCase()];
            if (found) {
                setCoupon(found);
                setCouponError('');
            } else {
                setCoupon(null);
                setCouponError('Mã giảm giá không hợp lệ hoặc đã hết hạn');
            }
        } catch {
            setCouponError('Không thể kiểm tra mã giảm giá.');
        } finally {
            setCouponLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!paymentMethod) return;
        setSubmitting(true);
        setSubmitError('');
        try {
            const orderData = {
                userId: user.userId,
                shippingInfo: {
                    fullName: shippingInfo.fullName,
                    phone: shippingInfo.phone,
                    address: shippingInfo.address,
                    city: shippingInfo.city,
                    district: shippingInfo.district,
                    ward: shippingInfo.ward,
                },
                items: cart.items.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    selectedAttributeIds: [],
                })),
                paymentMethod,
                notes: shippingInfo.notes || null,
                requireInstallation: shippingInfo.requireInstallation,
            };

            const res = await orderService.checkout(orderData);

            if (res?.success) {
                const newOrderNumber = res.data?.orderNumber || res.orderNumber;
                const newOrderId = res.data?.orderId || res.orderId;
                setOrderNumber(newOrderNumber);
                await clearCart();

                try {
                    const paymentRes = await apiService.createPaymentUrl({
                        paymentMethod: paymentMethod,
                        orderId: newOrderId ? newOrderId.toString() : newOrderNumber,
                        amount: cart.totalAmount,
                        returnUrl: window.location.origin + '/payment-success'
                    });

                    if (paymentRes?.success && paymentRes.data?.requiresRedirect) {
                        window.location.href = paymentRes.data.paymentUrl;
                        return;
                    }
                } catch (paymentErr) {
                    console.warn("Lỗi tạo Payment URL:", paymentErr);
                }

                setStep(3);
            } else {
                setSubmitError(res?.message ?? 'Đặt hàng thất bại. Vui lòng thử lại.');
            }
        } catch (err) {
            setSubmitError('Đã có lỗi xảy ra khi đặt hàng.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-[#0D0D0D] font-['Outfit'] flex flex-col selection:bg-[#C9A87C] selection:text-white">
            <Navbar />

            {/* Editorial Page Title Header */}
            <div className="bg-[#0D0D0D] text-[#FDFBF7] py-16 px-6 sm:px-12 text-center relative overflow-hidden">
                <div className="relative z-10 max-w-3xl mx-auto space-y-3">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-[#C9A87C] block">Khách hàng đặc quyền</span>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-light uppercase tracking-tight">Thanh Toán & Hoàn Thiện</h1>
                </div>
            </div>

            <main className="max-w-5xl mx-auto w-full px-6 sm:px-12 py-12 flex-1">
                {step < 3 && <StepIndicator current={step} />}

                {step === 0 && (
                    <StepSummary
                        cart={cart}
                        coupon={coupon}
                        setCoupon={setCoupon}
                        couponInput={couponInput}
                        setCouponInput={setCouponInput}
                        couponLoading={couponLoading}
                        couponError={couponError}
                        onApplyCoupon={handleApplyCoupon}
                        onNext={() => setStep(1)}
                        onBack={() => navigate('/cart')}
                    />
                )}

                {step === 1 && (
                    <StepShipping
                        shippingInfo={shippingInfo}
                        setShippingInfo={setShippingInfo}
                        onNext={() => setStep(2)}
                        onBack={() => setStep(0)}
                    />
                )}

                {step === 2 && (
                    <StepConfirm
                        cart={cart}
                        shippingInfo={shippingInfo}
                        coupon={coupon}
                        paymentMethod={paymentMethod}
                        setPaymentMethod={setPaymentMethod}
                        paymentMethods={paymentMethods}
                        shippingFee={shippingFee}
                        bestShippingOption={bestShippingOption}
                        shippingOptionsLoading={shippingOptionsLoading}
                        submitting={submitting}
                        submitError={submitError}
                        onSubmit={handleSubmit}
                        onBack={() => setStep(1)}
                        priceBreakdown={priceBreakdown}
                    />
                )}

                {step === 3 && (
                    <OrderSuccess
                        orderNumber={orderNumber}
                        onGoHome={() => navigate('/')}
                    />
                )}
            </main>

            <Footer />
        </div>
    );
}
