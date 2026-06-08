// src/components/Navbar.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user, isAuthenticated, isAdmin, logout } = useAuth();
    const { cartCount } = useCart();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        window.location.href = '/';
    };

    return (
        <nav className="navbar">
            {/* Top Bar */}
            <div className="navbar-top">
                <div className="container navbar-top-content">
                    <div className="navbar-top-left">
                        <a href="tel:1900xxxx">📞 1900 1900</a>
                        <a href="/gioi-thieu">Giới thiệu</a>
                        <a href="/khuyen-mai">Khuyến mãi</a>
                    </div>
                    <div className="navbar-top-right">
                        {isAuthenticated() ? (
                            <>
                                {isAdmin() && (
                                    <Link to="/admin/dashboard" className="admin-link">⚙️ Quản trị</Link>
                                )}
                                <Link to="/my-orders" style={{ color: 'inherit', textDecoration: 'none' }}>📦 Đơn hàng</Link>
                                <Link to="/profile" className="user-greeting">👤 {user?.fullName || user?.username}</Link>
                                <button onClick={handleLogout} className="logout-btn-nav">Đăng xuất</button>
                            </>
                        ) : (
                            <Link to="/login">👤 Đăng nhập</Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Navigation */}
            <div className="navbar-main">
                <div className="container navbar-main-content">
                    {/* Mobile Toggle */}
                    <button
                        className="navbar-mobile-toggle"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        ☰
                    </button>

                    {/* Menu Left */}
                    <div className="navbar-menu">
                        <a href="/san-pham-moi">Sản phẩm mới</a>
                        <a href="/phong-khach">Phòng khách</a>
                        <a href="/phong-ngu">Phòng ngủ</a>
                    </div>

                    {/* Logo */}
                    <Link to="/" className="navbar-logo">
                        Furniture<span>Shop</span>
                    </Link>

                    {/* Menu Right */}
                    <div className="navbar-menu">
                        <a href="/phong-an">Phòng ăn</a>
                        <a href="/trang-tri">Trang trí</a>
                        <a href="/bo-suu-tap">Bộ sưu tập</a>
                    </div>

                    {/* Icons */}
                    <div className="navbar-icons">
                        <span className="navbar-icon" title="Tìm kiếm">🔍</span>
                        <span className="navbar-icon" title="Yêu thích">♡</span>
                        <Link to="/cart" className="navbar-icon cart-icon" title="Giỏ hàng">
                            🛒
                            {cartCount > 0 && (
                                <span className="cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>
                            )}
                        </Link>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="navbar-mobile-menu">
                    <a href="/san-pham-moi">Sản phẩm mới</a>
                    <a href="/phong-khach">Phòng khách</a>
                    <a href="/phong-ngu">Phòng ngủ</a>
                    <a href="/phong-an">Phòng ăn</a>
                    <a href="/trang-tri">Trang trí</a>
                    <a href="/bo-suu-tap">Bộ sưu tập</a>
                    <Link to="/cart">🛒 Giỏ hàng ({cartCount})</Link>
                    {isAuthenticated() && isAdmin() && (
                        <Link to="/admin/dashboard">⚙️ Quản trị</Link>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;
