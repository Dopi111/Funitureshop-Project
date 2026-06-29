// src/pages/Cart.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/navbar';
import Footer from '../components/Footer';
import { toast } from 'react-hot-toast';
import '../index.css';

const Cart = () => {
    const { cart, loading, updateQuantity, removeItem, clearCart } = useCart();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [updatingItems, setUpdatingItems] = useState({});

    // Format tiền VND
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    // Xử lý thay đổi số lượng
    const handleQuantityChange = async (cartItemId, newQuantity, maxStock) => {
        if (newQuantity < 1) return;
        if (newQuantity > maxStock) {
            toast.error(`Chỉ còn ${maxStock} sản phẩm trong kho`);
            return;
        }

        setUpdatingItems(prev => ({ ...prev, [cartItemId]: true }));
        const result = await updateQuantity(cartItemId, newQuantity);
        if (result && !result.success) {
            toast.error(result.message || 'Lỗi cập nhật số lượng');
        }
        setUpdatingItems(prev => ({ ...prev, [cartItemId]: false }));
    };

    // Xử lý xóa sản phẩm
    const handleRemoveItem = async (cartItemId, productName) => {
        setUpdatingItems(prev => ({ ...prev, [cartItemId]: true }));
        const result = await removeItem(cartItemId);
        if (result && result.success) {
            toast.success(`Đã xóa "${productName}" khỏi giỏ hàng`);
        } else {
            toast.error('Lỗi khi xóa sản phẩm');
        }
        setUpdatingItems(prev => ({ ...prev, [cartItemId]: false }));
    };

    // Xử lý xóa toàn bộ
    const handleClearCart = async () => {
        if (window.confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) {
            const result = await clearCart();
            toast.success('Đã làm trống giỏ hàng');
        }
    };

    // Nếu chưa đăng nhập
    if (!isAuthenticated()) {
        return (
            <div className="bg-[#FDFBF7] min-h-screen flex flex-col font-['Outfit']">
                <Navbar />
                <div className="flex-1 flex items-center justify-center py-24">
                    <div className="max-w-md w-full text-center px-6">
                        <div className="w-20 h-20 mx-auto bg-[#F5F2EC] flex items-center justify-center rounded-full mb-6 text-[#8A8278]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </div>
                        <h2 className="text-xl uppercase tracking-widest font-semibold text-[#0d0d0d] mb-2">Yêu cầu đăng nhập</h2>
                        <p className="text-sm text-[#8A8278] mb-8">Vui lòng đăng nhập tài khoản của bạn để xem và quản lý giỏ hàng</p>
                        <Link to="/login" className="inline-block w-full py-4 bg-[#0D0D0D] text-[#FDFBF7] font-semibold text-xs uppercase tracking-widest hover:bg-[#C9A87C] hover:text-[#0D0D0D] transition-colors cursor-pointer text-center">
                            Đăng nhập ngay
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    // Loading state
    if (loading) {
        return (
            <div className="bg-[#FDFBF7] min-h-screen flex flex-col font-['Outfit']">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center py-24">
                    <div className="w-10 h-10 border-2 border-[#E8E4DC] border-t-[#C9A87C] rounded-full animate-spin mb-4" />
                    <p className="text-xs uppercase tracking-widest font-semibold text-[#8A8278]">Đang tải giỏ hàng...</p>
                </div>
                <Footer />
            </div>
        );
    }

    // Giỏ hàng trống
    if (!cart || !cart.items || cart.items.length === 0) {
        return (
            <div className="bg-[#FDFBF7] min-h-screen flex flex-col font-['Outfit']">
                <Navbar />
                <div className="flex-1 flex items-center justify-center py-24">
                    <div className="max-w-md w-full text-center px-6">
                        <div className="w-20 h-20 mx-auto bg-[#F5F2EC] flex items-center justify-center rounded-full mb-6 text-[#8A8278]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                                <line x1="3" x2="21" y1="6" y2="6" />
                                <path d="M16 10a4 4 0 0 1-8 0" />
                            </svg>
                        </div>
                        <h2 className="text-xl uppercase tracking-widest font-semibold text-[#0d0d0d] mb-2">Giỏ hàng trống</h2>
                        <p className="text-sm text-[#8A8278] mb-8">Bạn chưa thêm bất kỳ sản phẩm nào vào giỏ hàng của mình</p>
                        <Link to="/products" className="inline-block w-full py-4 bg-[#0D0D0D] text-[#FDFBF7] font-semibold text-xs uppercase tracking-widest hover:bg-[#C9A87C] hover:text-[#0D0D0D] transition-colors cursor-pointer text-center">
                            Tiếp tục mua sắm
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="bg-[#FDFBF7] min-h-screen flex flex-col font-['Outfit']">
            <Navbar />
            
            <div className="max-w-[1440px] mx-auto px-6 py-12 md:py-20 w-full flex-1">
                {/* Header */}
                <div className="flex items-baseline justify-between mb-10 pb-6 border-b border-[#E8E4DC]">
                    <h1 className="text-2xl md:text-3xl font-medium uppercase tracking-tight text-[#0D0D0D]">Giỏ hàng của bạn</h1>
                    <span className="text-xs uppercase tracking-widest font-bold text-[#8A8278]">{cart.totalItems} sản phẩm</span>
                </div>

                {/* Content layout: 70 / 30 split */}
                <div className="grid grid-cols-1 lg:grid-cols-10 gap-10 items-start">
                    {/* Left Column: Items */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="space-y-4">
                            {cart.items.map((item) => (
                                <div 
                                    key={item.cartItemId} 
                                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-white border border-[#E8E4DC] gap-6 relative transition-opacity duration-300 ${
                                        updatingItems[item.cartItemId] ? 'opacity-50 pointer-events-none' : ''
                                    }`}
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <img 
                                            src={item.productImage || 'https://via.placeholder.com/96x128'} 
                                            alt={item.productName}
                                            className="w-20 h-24 object-cover bg-[#F5F2EC] flex-shrink-0"
                                        />
                                        <div className="space-y-1">
                                            <span className="text-[10px] uppercase tracking-wider text-[#8A8278] font-medium">{item.categoryName}</span>
                                            <h3 className="text-sm font-medium text-[#0D0D0D] pr-4 line-clamp-2">{item.productName}</h3>
                                            <div className="flex items-center gap-2 pt-1 text-xs">
                                                <span className="text-[#C9A87C] font-semibold">{formatPrice(item.unitPrice)}</span>
                                                {item.originalPrice > item.unitPrice && (
                                                    <span className="text-[#8A8278] line-through text-[11px]">
                                                        {formatPrice(item.originalPrice)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-8 w-full sm:w-auto border-t sm:border-t-0 border-[#E8E4DC]/60 pt-4 sm:pt-0">
                                        {/* Quantity controls */}
                                        <div className="flex flex-col gap-1 items-start sm:items-center">
                                            <div className="flex items-center bg-[#F5F2EC] rounded-none">
                                                <button 
                                                    onClick={() => handleQuantityChange(item.cartItemId, item.quantity - 1, item.stockQuantity)}
                                                    disabled={item.quantity <= 1 || updatingItems[item.cartItemId]}
                                                    className="w-9 h-9 flex items-center justify-center hover:bg-[#E8E4DC] text-[#0d0d0d] font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                                >
                                                    −
                                                </button>
                                                <span className="w-10 text-center text-xs font-semibold text-[#0d0d0d] tabular-nums select-none">
                                                    {item.quantity}
                                                </span>
                                                <button 
                                                    onClick={() => handleQuantityChange(item.cartItemId, item.quantity + 1, item.stockQuantity)}
                                                    disabled={item.quantity >= item.stockQuantity || updatingItems[item.cartItemId]}
                                                    className="w-9 h-9 flex items-center justify-center hover:bg-[#E8E4DC] text-[#0d0d0d] font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            {item.stockQuantity < 10 && (
                                                <span className="text-[10px] text-red-500 font-medium">Chỉ còn {item.stockQuantity} sản phẩm</span>
                                            )}
                                        </div>

                                        {/* Subtotal */}
                                        <div className="text-right min-w-[100px]">
                                            <span className="text-sm font-semibold text-[#0d0d0d] tabular-nums block">
                                                {formatPrice(item.subtotal)}
                                            </span>
                                        </div>

                                        {/* Remove button */}
                                        <button 
                                            onClick={() => handleRemoveItem(item.cartItemId, item.productName)}
                                            className="text-[#8A8278] hover:text-red-500 transition-colors p-1.5 cursor-pointer"
                                            title="Xóa sản phẩm"
                                            disabled={updatingItems[item.cartItemId]}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Cart Actions */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                            <Link to="/products" className="w-full sm:w-auto px-6 py-3 border border-[#0d0d0d] text-[#0d0d0d] hover:bg-[#0D0D0D] hover:text-[#FDFBF7] text-xs font-semibold uppercase tracking-wider transition-all text-center cursor-pointer">
                                ← Tiếp tục mua sắm
                            </Link>
                            <button 
                                onClick={handleClearCart} 
                                className="w-full sm:w-auto px-6 py-3 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold uppercase tracking-wider transition-all text-center cursor-pointer"
                            >
                                Xóa giỏ hàng
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Summary Card */}
                    <div className="lg:col-span-3">
                        <div className="bg-white border border-[#E8E4DC] p-8 shadow-[0_2px_12px_rgba(13,13,13,0.04)] lg:sticky lg:top-24 space-y-6">
                            <h3 className="text-xs uppercase tracking-[0.15em] font-bold text-[#0D0D0D] pb-3 border-b border-[#E8E4DC]">Tóm tắt đơn hàng</h3>
                            
                            <div className="space-y-3 text-xs">
                                <div className="flex justify-between text-[#8A8278]">
                                    <span>Tạm tính ({cart.totalItems} sản phẩm)</span>
                                    <span className="tabular-nums text-[#0d0d0d] font-medium">{formatPrice(cart.totalAmount)}</span>
                                </div>
                                <div className="flex justify-between text-[#8A8278]">
                                    <span>Phí vận chuyển</span>
                                    <span className="italic font-medium text-[#C9A87C]">Tính khi thanh toán</span>
                                </div>
                            </div>

                            <div className="border-t border-[#E8E4DC] pt-4 flex justify-between items-baseline">
                                <span className="text-xs uppercase tracking-wider font-bold text-[#0D0D0D]">Tổng cộng</span>
                                <span className="text-2xl font-medium text-[#C9A87C] tabular-nums">{formatPrice(cart.totalAmount)}</span>
                            </div>

                            <button 
                                onClick={() => navigate('/checkout')}
                                className="w-full py-4 bg-[#0D0D0D] text-[#FDFBF7] font-semibold text-xs uppercase tracking-widest hover:bg-[#C9A87C] hover:text-[#0D0D0D] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                            >
                                Tiến hành thanh toán
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </button>

                            {/* Trust badges */}
                            <div className="pt-6 border-t border-[#E8E4DC]/60 space-y-4">
                                <div className="flex items-center gap-3 text-xs text-[#8A8278]">
                                    <div className="text-[#C9A87C] flex-shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <rect width="20" height="14" x="2" y="5" rx="2" />
                                            <path d="M2 10h20M6 15h.01M10 15h.01" />
                                        </svg>
                                    </div>
                                    <span>Miễn phí vận chuyển đơn từ 5 triệu</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-[#8A8278]">
                                    <div className="text-[#C9A87C] flex-shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="m12 3-1.912 5.886H3.82l5.12 3.72L7.027 18.5 12 14.78l4.973 3.72-1.914-5.894 5.12-3.72h-6.268L12 3z" />
                                        </svg>
                                    </div>
                                    <span>Đổi trả dễ dàng trong vòng 30 ngày</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-[#8A8278]">
                                    <div className="text-[#C9A87C] flex-shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                        </svg>
                                    </div>
                                    <span>Bảo hành chính hãng 12-36 tháng</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <Footer />
        </div>
    );
};

export default Cart;
