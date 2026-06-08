// src/pages/Cart.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/navbar';
import Footer from '../components/Footer';
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
            alert(`Chỉ còn ${maxStock} sản phẩm trong kho`);
            return;
        }

        setUpdatingItems(prev => ({ ...prev, [cartItemId]: true }));
        await updateQuantity(cartItemId, newQuantity);
        setUpdatingItems(prev => ({ ...prev, [cartItemId]: false }));
    };

    // Xử lý xóa sản phẩm
    const handleRemoveItem = async (cartItemId, productName) => {
        if (window.confirm(`Bạn có chắc muốn xóa "${productName}" khỏi giỏ hàng?`)) {
            setUpdatingItems(prev => ({ ...prev, [cartItemId]: true }));
            await removeItem(cartItemId);
            setUpdatingItems(prev => ({ ...prev, [cartItemId]: false }));
        }
    };

    // Xử lý xóa toàn bộ
    const handleClearCart = async () => {
        if (window.confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) {
            await clearCart();
        }
    };

    // Nếu chưa đăng nhập
    if (!isAuthenticated()) {
        return (
            <div className="app">
                <Navbar />
                <div className="cart-page">
                    <div className="container">
                        <div className="cart-empty">
                            <div className="cart-empty-icon">🛒</div>
                            <h2>Vui lòng đăng nhập</h2>
                            <p>Đăng nhập để xem giỏ hàng của bạn</p>
                            <Link to="/login" className="btn btn-primary">
                                Đăng nhập ngay
                            </Link>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    // Loading state
    if (loading) {
        return (
            <div className="app">
                <Navbar />
                <div className="cart-page">
                    <div className="container">
                        <div className="cart-loading">
                            <div className="loading-spinner"></div>
                            <p>Đang tải giỏ hàng...</p>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    // Giỏ hàng trống
    if (!cart || !cart.items || cart.items.length === 0) {
        return (
            <div className="app">
                <Navbar />
                <div className="cart-page">
                    <div className="container">
                        <div className="cart-empty">
                            <div className="cart-empty-icon">🛒</div>
                            <h2>Giỏ hàng trống</h2>
                            <p>Bạn chưa có sản phẩm nào trong giỏ hàng</p>
                            <Link to="/" className="btn btn-primary">
                                Tiếp tục mua sắm
                            </Link>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="app">
            <Navbar />
            <div className="cart-page">
                <div className="container">
                    <div className="cart-header">
                        <h1>Giỏ hàng của bạn</h1>
                        <span className="cart-count">{cart.totalItems} sản phẩm</span>
                    </div>

                    <div className="cart-content">
                        {/* Danh sách sản phẩm */}
                        <div className="cart-items">
                            <div className="cart-items-header">
                                <span className="col-product">Sản phẩm</span>
                                <span className="col-price">Đơn giá</span>
                                <span className="col-quantity">Số lượng</span>
                                <span className="col-subtotal">Thành tiền</span>
                                <span className="col-action"></span>
                            </div>

                            {cart.items.map((item) => (
                                <div 
                                    key={item.cartItemId} 
                                    className={`cart-item ${updatingItems[item.cartItemId] ? 'updating' : ''}`}
                                >
                                    <div className="col-product">
                                        <img 
                                            src={item.productImage || 'https://via.placeholder.com/80'} 
                                            alt={item.productName}
                                            className="cart-item-image"
                                        />
                                        <div className="cart-item-info">
                                            <h3 className="cart-item-name">{item.productName}</h3>
                                            <span className="cart-item-category">{item.categoryName}</span>
                                        </div>
                                    </div>

                                    <div className="col-price">
                                        <span className="cart-item-price">{formatPrice(item.unitPrice)}</span>
                                        {item.originalPrice > item.unitPrice && (
                                            <span className="cart-item-original-price">
                                                {formatPrice(item.originalPrice)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="col-quantity">
                                        <div className="quantity-control">
                                            <button 
                                                onClick={() => handleQuantityChange(item.cartItemId, item.quantity - 1, item.stockQuantity)}
                                                disabled={item.quantity <= 1 || updatingItems[item.cartItemId]}
                                                className="qty-btn"
                                            >
                                                −
                                            </button>
                                            <input 
                                                type="number" 
                                                value={item.quantity}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 1;
                                                    handleQuantityChange(item.cartItemId, val, item.stockQuantity);
                                                }}
                                                min="1"
                                                max={item.stockQuantity}
                                                className="qty-input"
                                            />
                                            <button 
                                                onClick={() => handleQuantityChange(item.cartItemId, item.quantity + 1, item.stockQuantity)}
                                                disabled={item.quantity >= item.stockQuantity || updatingItems[item.cartItemId]}
                                                className="qty-btn"
                                            >
                                                +
                                            </button>
                                        </div>
                                        {item.stockQuantity < 10 && (
                                            <span className="stock-warning">Còn {item.stockQuantity} sản phẩm</span>
                                        )}
                                    </div>

                                    <div className="col-subtotal">
                                        <span className="cart-item-subtotal">{formatPrice(item.subtotal)}</span>
                                    </div>

                                    <div className="col-action">
                                        <button 
                                            onClick={() => handleRemoveItem(item.cartItemId, item.productName)}
                                            className="btn-remove"
                                            title="Xóa sản phẩm"
                                            disabled={updatingItems[item.cartItemId]}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <div className="cart-actions">
                                <Link to="/" className="btn btn-outline">
                                    ← Tiếp tục mua sắm
                                </Link>
                                <button onClick={handleClearCart} className="btn btn-outline btn-danger">
                                    Xóa giỏ hàng
                                </button>
                            </div>
                        </div>

                        {/* Tổng cộng */}
                        <div className="cart-summary">
                            <h3>Tóm tắt đơn hàng</h3>
                            
                            <div className="summary-row">
                                <span>Tạm tính ({cart.totalItems} sản phẩm)</span>
                                <span>{formatPrice(cart.totalAmount)}</span>
                            </div>
                            
                            <div className="summary-row">
                                <span>Phí vận chuyển</span>
                                <span className="shipping-note">Tính khi thanh toán</span>
                            </div>

                            <div className="summary-divider"></div>
                            
                            <div className="summary-row total">
                                <span>Tổng cộng</span>
                                <span className="total-amount">{formatPrice(cart.totalAmount)}</span>
                            </div>

                            <button 
                                onClick={() => navigate('/checkout')}
                                className="btn btn-primary btn-checkout"
                            >
                                Tiến hành thanh toán
                            </button>

                            <div className="cart-benefits">
                                <div className="benefit-item">
                                    <span className="benefit-icon">🚚</span>
                                    <span>Miễn phí vận chuyển đơn từ 5 triệu</span>
                                </div>
                                <div className="benefit-item">
                                    <span className="benefit-icon">🔄</span>
                                    <span>Đổi trả trong 30 ngày</span>
                                </div>
                                <div className="benefit-item">
                                    <span className="benefit-icon">🛡️</span>
                                    <span>Bảo hành chính hãng</span>
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
