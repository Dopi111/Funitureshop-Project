// src/pages/Checkout.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/navbar';
import Footer from '../components/Footer';
import apiService from '../services/apiService';
import orderService from '../services/orderService';

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────
const fmt = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n ?? 0);

const STEPS = ['Tóm tắt đơn hàng', 'Thông tin giao hàng', 'Xác nhận & Thanh toán'];

// ─────────────────────────────────────────────
//  Step Indicator
// ─────────────────────────────────────────────
function StepIndicator({ current }) {
    return (
        <div className="checkout-steps">
            {STEPS.map((label, i) => (
                <React.Fragment key={i}>
                    <div className={`checkout-step ${i < current ? 'done' : ''} ${i === current ? 'active' : ''}`}>
                        <div className="step-circle">{i < current ? '✓' : i + 1}</div>
                        <span className="step-label">{label}</span>
                    </div>
                    {i < STEPS.length - 1 && <div className={`step-line ${i < current ? 'done' : ''}`} />}
                </React.Fragment>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────
//  STEP 1 – Order Summary
// ─────────────────────────────────────────────
function StepSummary({ cart, coupon, setCoupon, couponInput, setCouponInput, couponLoading, couponError, onApplyCoupon, onNext, onBack }) {
    const items = cart?.items ?? [];
    const subTotal = cart?.totalAmount ?? 0;
    const discount = coupon ? Math.round(subTotal * (coupon.discountPercent / 100)) : 0;
    const total = subTotal - discount;

    return (
        <div className="checkout-panel">
            <h2 className="checkout-panel-title">Tóm tắt đơn hàng</h2>

            {/* Product list */}
            <div className="co-product-list">
                {items.map((item) => (
                    <div key={item.cartItemId} className="co-product-row">
                        <img
                            src={item.productImage || 'https://via.placeholder.com/64'}
                            alt={item.productName}
                            className="co-product-img"
                        />
                        <div className="co-product-info">
                            <div className="co-product-name">{item.productName}</div>
                            <div className="co-product-cat">{item.categoryName}</div>
                        </div>
                        <div className="co-product-qty">x{item.quantity}</div>
                        <div className="co-product-price">
                            {item.originalPrice && item.originalPrice > item.unitPrice ? (
                                <>
                                    <span className="co-price-original">{fmt(item.originalPrice * item.quantity)}</span>
                                    <span className="co-price-discounted">{fmt(item.unitPrice * item.quantity)}</span>
                                </>
                            ) : (
                                <span>{fmt(item.unitPrice * item.quantity)}</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="co-divider" />

            {/* Price rows */}
            <div className="co-price-rows">
                <div className="co-price-row">
                    <span>Thành tiền</span>
                    <span className="co-price-val">{fmt(subTotal)}</span>
                </div>
                {discount > 0 && (
                    <div className="co-price-row co-discount">
                        <span>Giảm giá ({coupon.code} – {coupon.discountPercent}%)</span>
                        <span className="co-price-val">- {fmt(discount)}</span>
                    </div>
                )}
                <div className="co-price-row co-shipping-note">
                    <span>Vận chuyển</span>
                    <span className="co-price-note">Phí giao hàng sẽ được tính ở bước tiếp theo.</span>
                </div>
            </div>

            <div className="co-divider" />

            {/* Coupon */}
            <div className="co-coupon-row">
                <input
                    className="co-coupon-input"
                    placeholder="Mã giảm giá"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onApplyCoupon()}
                />
                <button
                    className="co-coupon-btn"
                    onClick={onApplyCoupon}
                    disabled={couponLoading}
                >
                    {couponLoading ? '...' : 'SỬ DỤNG'}
                </button>
            </div>
            {couponError && <p className="co-coupon-error">{couponError}</p>}
            {coupon && <p className="co-coupon-ok">✓ Áp dụng thành công: giảm {coupon.discountPercent}%</p>}

            <div className="co-divider" />

            {/* Total */}
            <div className="co-price-row co-total-row">
                <span>Tổng cộng</span>
                <span className="co-total-val">{fmt(total)}</span>
            </div>

            {/* Shipping info blurb */}
            <div className="co-shipping-info">
                <p className="co-shipping-info-title">Thông tin giao hàng</p>
                <p>Đối với những sản phẩm có sẵn tại khu vực, chúng tôi sẽ giao hàng trong vòng 2–7 ngày.</p>
                <p>Đối với những sản phẩm không có sẵn, thời gian giao hàng sẽ được nhân viên thông báo đến quý khách.</p>
                <p>Từ 2–6: 8:30 – 17:30</p>
                <p>Thứ 7, CN: 9:30 – 16:30</p>
            </div>

            {/* Buttons */}
            <div className="co-btn-row">
                <Link to="/cart" className="co-btn co-btn-outline">← Tiếp tục mua hàng</Link>
                <button className="co-btn co-btn-primary" onClick={onNext}>ĐẶT HÀNG</button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
//  Shipping Form Field (standalone to prevent remount on re-render)
// ─────────────────────────────────────────────
function ShippingField({ id, label, required, placeholder, value, onChange, error }) {
    return (
        <div className="co-field">
            <label htmlFor={id} className="co-label">
                {label}{required && <span className="co-required"> *</span>}
            </label>
            <input
                id={id}
                className={`co-input ${error ? 'co-input-err' : ''}`}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
            />
            {error && <span className="co-err-msg">{error}</span>}
        </div>
    );
}

// ─────────────────────────────────────────────
//  STEP 2 – Shipping Address
// ─────────────────────────────────────────────
function StepShipping({ shippingInfo, setShippingInfo, onNext, onBack }) {
    const [errors, setErrors] = useState({});

    const handle = (field) => (e) =>
        setShippingInfo((prev) => ({ ...prev, [field]: e.target.value }));

    const validate = () => {
        const e = {};
        if (!shippingInfo.fullName.trim()) e.fullName = 'Vui lòng nhập họ tên';
        if (!shippingInfo.phone.trim()) e.phone = 'Vui lòng nhập số điện thoại';
        else if (!/^(0|\+84)[0-9]{8,10}$/.test(shippingInfo.phone.trim())) e.phone = 'Số điện thoại không hợp lệ';
        if (!shippingInfo.address.trim()) e.address = 'Vui lòng nhập địa chỉ';
        if (!shippingInfo.city.trim()) e.city = 'Vui lòng nhập thành phố';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const submit = () => {
        if (validate()) onNext();
    };

    return (
        <div className="checkout-panel">
            <h2 className="checkout-panel-title">Thông tin giao hàng</h2>
            <p className="co-subtitle">
                Vui lòng nhập địa chỉ nhận hàng. Phí vận chuyển sẽ được tính dựa trên địa chỉ này.
            </p>

            <div className="co-form-grid">
                <ShippingField id="fullName" label="Họ và tên" required placeholder="Nguyễn Văn A" value={shippingInfo.fullName} onChange={handle('fullName')} error={errors.fullName} />
                <ShippingField id="phone" label="Số điện thoại" required placeholder="0901234567" value={shippingInfo.phone} onChange={handle('phone')} error={errors.phone} />
            </div>
            <ShippingField id="address" label="Địa chỉ (số nhà, tên đường, phường/xã)" required placeholder="123 Đường Lê Lợi, Phường Bến Nghé" value={shippingInfo.address} onChange={handle('address')} error={errors.address} />
            <div className="co-form-grid">
                <ShippingField id="city" label="Tỉnh / Thành phố" required placeholder="TP. Hồ Chí Minh" value={shippingInfo.city} onChange={handle('city')} error={errors.city} />
                <ShippingField id="district" label="Quận / Huyện" placeholder="Quận 1" value={shippingInfo.district} onChange={handle('district')} />
                <ShippingField id="ward" label="Phường / Xã" placeholder="Phường Bến Nghé" value={shippingInfo.ward} onChange={handle('ward')} />
            </div>
            <div className="co-field">
                <label className="co-label">Ghi chú đơn hàng</label>
                <textarea
                    className="co-input co-textarea"
                    placeholder="Ghi chú thêm cho đơn hàng (tùy chọn)"
                    value={shippingInfo.notes}
                    onChange={handle('notes')}
                    rows={3}
                />
            </div>

            <div className="co-btn-row">
                <button className="co-btn co-btn-outline" onClick={onBack}>← Quay lại</button>
                <button className="co-btn co-btn-primary" onClick={submit}>TIẾP TỤC ĐẶT HÀNG</button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
//  STEP 3 – Confirmation & Payment
// ─────────────────────────────────────────────
function StepConfirm({ cart, shippingInfo, coupon, paymentMethod, setPaymentMethod,
    paymentMethods, shippingFee, bestShippingOption,
    shippingOptionsLoading, submitting, submitError, onSubmit, onBack, priceBreakdown }) {

    const items = cart?.items ?? [];
    const subTotal = cart?.totalAmount ?? 0;
    const discount = coupon ? Math.round(subTotal * (coupon.discountPercent / 100)) : 0;
    // Thuế VAT lấy từ kết quả CalculatePriceBreakdownAsync (FACADE PATTERN)
    const taxAmount = priceBreakdown?.totalTax ?? 0;
    const total = subTotal - discount + taxAmount + (shippingFee ?? 0);

    return (
        <div className="checkout-panel">
            <h2 className="checkout-panel-title">Xác nhận đơn hàng</h2>

            {/* Products */}
            <div className="co-section-title">Sản phẩm đặt mua</div>
            <div className="co-product-list">
                {items.map((item) => (
                    <div key={item.cartItemId} className="co-product-row">
                        <img
                            src={item.productImage || 'https://via.placeholder.com/64'}
                            alt={item.productName}
                            className="co-product-img"
                        />
                        <div className="co-product-info">
                            <div className="co-product-name">{item.productName}</div>
                            <div className="co-product-cat">{item.categoryName}</div>
                        </div>
                        <div className="co-product-qty">x{item.quantity}</div>
                        <div className="co-product-price">{fmt(item.unitPrice * item.quantity)}</div>
                    </div>
                ))}
            </div>

            <div className="co-divider" />

            {/* Shipping address */}
            <div className="co-section-title">Địa chỉ giao hàng</div>
            <div className="co-address-box">
                <p><strong>{shippingInfo.fullName}</strong> — {shippingInfo.phone}</p>
                <p>{shippingInfo.address}</p>
                <p>
                    {[shippingInfo.ward, shippingInfo.district, shippingInfo.city]
                        .filter(Boolean).join(', ')}
                </p>
                {shippingInfo.notes && <p className="co-notes">Ghi chú: {shippingInfo.notes}</p>}
            </div>

            <div className="co-divider" />

            {/* Shipping method - hiển thị phương thức tối ưu nhất (không chọn) */}
            <div className="co-section-title">Phương thức vận chuyển</div>
            {shippingOptionsLoading ? (
                <p className="co-loading-text">Đang tính phí vận chuyển...</p>
            ) : bestShippingOption ? (
                <div className="co-shipping-method-info">
                    <span className="co-icon-truck">🚚</span>
                    <div className="co-shipping-details">
                        <div className="co-shipping-name">{bestShippingOption.name}</div>
                        <div className="co-shipping-desc">
                            {bestShippingOption.fee > 0 ? fmt(bestShippingOption.fee) : 'Miễn phí'} — Dự kiến {bestShippingOption.estimatedDays} ngày
                        </div>
                    </div>
                </div>
            ) : (
                <p className="co-loading-text">Không thể tính phí vận chuyển</p>
            )}

            <div className="co-divider" />

            {/* Price breakdown */}
            <div className="co-section-title">Chi tiết giá</div>
            <div className="co-price-rows">
                <div className="co-price-row">
                    <span>Thành tiền</span>
                    <span className="co-price-val">{fmt(subTotal)}</span>
                </div>
                {discount > 0 && (
                    <div className="co-price-row co-discount">
                        <span>Giảm giá ({coupon.code} – {coupon.discountPercent}%)</span>
                        <span className="co-price-val">- {fmt(discount)}</span>
                    </div>
                )}
                {taxAmount > 0 && (
                    <div className="co-price-row co-tax">
                        <span>Thuế VAT (10%)</span>
                        <span className="co-price-val">+ {fmt(taxAmount)}</span>
                    </div>
                )}
                <div className="co-price-row">
                    <span>Phí vận chuyển</span>
                    <span className="co-price-val">
                        {shippingFee > 0 ? fmt(shippingFee) : 'Miễn phí'}
                    </span>
                </div>
                <div className="co-price-row co-total-row">
                    <span>Tổng thanh toán</span>
                    <span className="co-total-val">{fmt(total)}</span>
                </div>
            </div>

            <div className="co-divider" />

            {/* Payment methods */}
            <div className="co-section-title">Phương thức thanh toán</div>
            <div className="co-payment-methods">
                {paymentMethods.length === 0 && (
                    <p className="co-loading-text">Đang tải phương thức thanh toán...</p>
                )}
                {paymentMethods.map((method) => (
                    <label key={method.code} className={`co-payment-option ${paymentMethod === method.code ? 'selected' : ''}`}>
                        <input
                            type="radio"
                            name="paymentMethod"
                            value={method.code}
                            checked={paymentMethod === method.code}
                            onChange={() => setPaymentMethod(method.code)}
                        />
                        <span className="co-pm-icon">{getPaymentIcon(method.code)}</span>
                        <div className="co-pm-info">
                            <div className="co-pm-name">{method.name}</div>
                            {method.description && (
                                <div className="co-pm-desc">{method.description}</div>
                            )}
                            {method.transactionFeePercent > 0 && (
                                <div className="co-pm-fee">
                                    Phí giao dịch: {method.transactionFeePercent}%
                                </div>
                            )}
                        </div>
                    </label>
                ))}
            </div>

            {submitError && <p className="co-coupon-error co-submit-error">{submitError}</p>}

            <div className="co-btn-row">
                <button className="co-btn co-btn-outline" onClick={onBack} disabled={submitting}>
                    ← Quay lại
                </button>
                <button
                    className="co-btn co-btn-primary"
                    onClick={onSubmit}
                    disabled={submitting || !paymentMethod}
                >
                    {submitting ? 'Đang xử lý...' : 'XÁC NHẬN ĐẶT HÀNG'}
                </button>
            </div>
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

// ─────────────────────────────────────────────
//  Order Success screen
// ─────────────────────────────────────────────
function OrderSuccess({ orderNumber, onGoHome }) {
    return (
        <div className="checkout-panel co-success">
            <div className="co-success-icon">✅</div>
            <h2>Đặt hàng thành công!</h2>
            <p>Cảm ơn bạn đã đặt hàng. Mã đơn hàng của bạn:</p>
            <div className="co-order-number">{orderNumber}</div>
            <p className="co-success-note">
                Chúng tôi sẽ xác nhận và liên hệ với bạn sớm nhất có thể.
            </p>
            <div className="co-btn-row co-btn-center">
                <button className="co-btn co-btn-primary" onClick={onGoHome}>
                    Về trang chủ
                </button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
//  MAIN Checkout Component
// ─────────────────────────────────────────────
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
    });

    // Auto-fill shipping info from saved user profile
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
                .catch(() => {}); // Silently fail – user can fill manually
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

    // Load payment methods when reaching step 2
    useEffect(() => {
        if (step === 2 && paymentMethods.length === 0) {
            apiService.getPaymentMethods()
                .then((res) => {
                    const methods = res?.data ?? [];
                    setPaymentMethods(methods);
                    if (methods.length > 0) setPaymentMethod(methods[0].code);
                })
                .catch(() => {
                    // Fallback to COD if API fails
                    setPaymentMethods([{ code: 'CASH', name: 'Thanh toán khi nhận hàng (COD)', transactionFeePercent: 0 }]);
                    setPaymentMethod('CASH');
                });
        }
    }, [step, paymentMethods.length]);

    // Load shipping options when reaching step 2
    useEffect(() => {
        if (step === 2 && cart?.items?.length) {
            setShippingOptionsLoading(true);
            orderService.getShippingOptions(
                cart.items.map(item => item.productId),
                {
                    fullName: shippingInfo.fullName,
                    phone: shippingInfo.phone,
                    address: shippingInfo.address,
                    city: shippingInfo.city,
                    district: shippingInfo.district,
                    ward: shippingInfo.ward,
                }
            )
            .then(result => {
                // Handle both response formats: { success, data } and direct array
                const options = result?.data ?? result ?? [];
                const optionsArray = Array.isArray(options) ? options : [];
                
                if (optionsArray.length > 0) {
                    // Sắp xếp theo phí thấp nhất và chỉ lấy option tốt nhất
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
    }, [step, cart?.items?.length]);

    // Gọi CalculatePriceBreakdownAsync (FACADE PATTERN) khi đến bước xác nhận để lấy thuế và chi tiết giá
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
                shippingInfo: null, // Phí ship xử lý riêng qua getShippingOptions
            })
            .then(breakdown => {
                if (breakdown) setPriceBreakdown(breakdown);
            })
            .catch(() => {}); // Fallback: hiển thị không có thuế
        }
    }, [step]);

    // Guard – must be logged in
    if (!isAuthenticated()) {
        return (
            <div className="app">
                <Navbar />
                <div className="cart-page">
                    <div className="container">
                        <div className="cart-empty">
                            <div className="cart-empty-icon">🔒</div>
                            <h2>Vui lòng đăng nhập</h2>
                            <p>Bạn cần đăng nhập để tiến hành thanh toán</p>
                            <Link to="/login" className="btn btn-primary">Đăng nhập ngay</Link>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (cartLoading) {
        return (
            <div className="app">
                <Navbar />
                <div className="cart-page"><div className="container"><div className="cart-loading">
                    <div className="loading-spinner" />
                    <p>Đang tải giỏ hàng...</p>
                </div></div></div>
                <Footer />
            </div>
        );
    }

    if (!cart?.items?.length && !orderNumber) {
        return (
            <div className="app">
                <Navbar />
                <div className="cart-page"><div className="container"><div className="cart-empty">
                    <div className="cart-empty-icon">🛒</div>
                    <h2>Giỏ hàng trống</h2>
                    <p>Bạn chưa có sản phẩm nào trong giỏ hàng</p>
                    <Link to="/" className="btn btn-primary">Tiếp tục mua sắm</Link>
                </div></div></div>
                <Footer />
            </div>
        );
    }

    // ── Apply coupon ──
    const handleApplyCoupon = async () => {
        if (!couponInput.trim()) {
            setCouponError('Vui lòng nhập mã giảm giá');
            return;
        }
        setCouponLoading(true);
        setCouponError('');
        try {
            // TODO: Replace with real coupon validation API when available
            // Simulated validation for now
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
            setCouponError('Không thể kiểm tra mã giảm giá. Vui lòng thử lại.');
        } finally {
            setCouponLoading(false);
        }
    };

    // ── Select shipping option ──
    // Bỏ vì chỉ có 1 option tối ưu nhất (không cần chọn)

    // ── Submit order ──
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
            };

            const res = await orderService.checkout(orderData);

            if (res?.success) {
                setOrderNumber(res.data?.orderNumber || res.orderNumber);
                await clearCart();
                setStep(3); // success screen
            } else {
                setSubmitError(res?.message ?? 'Đặt hàng thất bại. Vui lòng thử lại.');
            }
        } catch (err) {
            setSubmitError('Đã có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="app">
            <Navbar />
            <div className="cart-page checkout-page">
                <div className="container">
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
                </div>
            </div>
            <Footer />
        </div>
    );
}
